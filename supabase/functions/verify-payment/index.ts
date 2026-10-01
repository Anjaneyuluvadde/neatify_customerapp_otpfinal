// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id, payment_type } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      throw new Error("Missing required payment details");
    }

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    // 2. Fetch payment details from Razorpay to get exact amount
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`
      }
    });
    
    if (!rzpResponse.ok) {
      throw new Error("Could not fetch payment from Razorpay");
    }
    const rzpData = await rzpResponse.json();
    const amountPaid = rzpData.amount / 100; // Convert from paise

    // 3. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch existing booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // 5. Check whether this Razorpay payment was already recorded
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("booking_payments")
      .select("id, amount, status, booking_id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPaymentError) {
      throw new Error(
        "Failed to check existing payment: " + existingPaymentError.message
      );
    }

    if (existingPayment) {
      console.log(
        "Payment already processed (found in DB):",
        razorpay_payment_id
      );

      // If the existing payment was inserted by a webhook without a booking_id,
      // or we just need to ensure it's linked to THIS booking:
      if (!existingPayment.booking_id) {
        await supabase
          .from("booking_payments")
          .update({ booking_id: booking_id })
          .eq("razorpay_payment_id", razorpay_payment_id);
      } else if (existingPayment.booking_id !== booking_id) {
        throw new Error("Payment is already associated with a different booking.");
      }

      // We still want to recalculate and update the booking to be safe,
      // in case the previous thread died before updating the booking!
      // But we will NOT return early here, we will just skip the INSERT.
    } else {
      // 6. Insert the NEW successful payment into booking_payments
      const { error: insertError } = await supabase
        .from("booking_payments")
        .insert({
          booking_id: booking_id,
          amount: amountPaid,
          payment_type: payment_type || "FULL",
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          status: "success",
        });

      if (insertError) {
        // If it's a unique constraint violation, another thread inserted it concurrently.
        // We can safely ignore the error and proceed to recalculate.
        if (insertError.code === "23505" || insertError.message.includes("duplicate key")) {
           console.log("Concurrent insert detected and safely ignored for:", razorpay_payment_id);
        } else {
          throw new Error(
            "Failed to insert booking payment: " + insertError.message
          );
        }
      }
    }

    // 7. Recalculate paid amount from successful payment history
    const { data: successfulPayments, error: paymentsError } = await supabase
      .from("booking_payments")
      .select("amount, razorpay_payment_id")
      .eq("booking_id", booking_id)
      .eq("status", "success");

    if (paymentsError) {
      throw new Error(
        "Failed to fetch payment history: " + paymentsError.message
      );
    }

    // Deduplicate by razorpay_payment_id to be extra safe against legacy duplicates
    // But rely primarily on the DB unique constraint handled above.
    const uniquePaymentsMap = new Map();
    for (const p of (successfulPayments || [])) {
      if (p.razorpay_payment_id) {
        uniquePaymentsMap.set(p.razorpay_payment_id, p);
      } else {
        uniquePaymentsMap.set(Math.random(), p);
      }
    }
    const uniquePayments = Array.from(uniquePaymentsMap.values());

    const paidAmount = uniquePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const totalAmount = Number(booking.total_amount || 0);

    const remainingAmount = Math.max(
      0,
      totalAmount - paidAmount
    );

    let paymentStatus = booking.payment_status;

    let paymentPlan = booking.payment_plan;
    if (payment_type === "PARTIAL") {
      paymentPlan = "PARTIAL";
    } else if (!paymentPlan) {
      paymentPlan = payment_type === "FULL" ? "FULL" : "PARTIAL";
    }

    if (remainingAmount === 0) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partial";
    }

    // 8. Update booking with calculated payment summary
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_status: paymentStatus,
        payment_verified: true,
        payment_plan: paymentPlan,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_method: rzpData.method || "card",
      })
      .eq("id", booking_id);

    if (updateError) {
      throw new Error(
        "Failed to update booking: " + updateError.message
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("verify-payment Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
