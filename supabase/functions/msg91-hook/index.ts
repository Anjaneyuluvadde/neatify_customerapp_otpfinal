import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();

    const phone = payload.user.phone;
    const code = payload.sms.otp || payload.sms.code;

    const cleanPhone = phone.replace('+', '');
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY') || "";

    // Fetch your Flow ID directly from your Supabase Secrets
    // (Or replace with your literal flow ID string if preferred)
    const flowId = Deno.env.get('MSG91_FLOW_ID') || "your_flow_id_here";

    console.log(`Sending via Flow API: ${code} to Mobile: ${cleanPhone}`);

    const url = `https://control.msg91.com/api/v5/flow/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': msg91AuthKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        // MSG91's Flow API requires the Flow ID to be passed as 'template_id'
        template_id: flowId,
        short_url: "0",
        recipients: [
          {
            mobiles: cleanPhone,
            // Ensure this key matches your MSG91 variable exact name (e.g., ##OTP##)
            OTP: code
          }
        ]
      })
    });

    const msg91Data = await response.json();
    console.log("MSG91 Flow Response:", msg91Data);

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Hook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});