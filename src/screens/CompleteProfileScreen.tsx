import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { COLORS } from "../theme/colors";

export default function CompleteProfileScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [userId, setUserId] = useState<string | null>(null);
    const [userPhone, setUserPhone] = useState<string>("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Safely get the user ID directly from the active Supabase session
        const fetchAuthData = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);

                // Format the phone number to exactly 10 digits
                const rawPhone = user.phone || route.params?.userPhone || route.params?.initialData?.phone || "";
                const digits = rawPhone.replace(/\D/g, "").slice(-10);
                setUserPhone(digits);
            } else {
                console.error("No active user session found:", error);
            }
        };

        fetchAuthData();
    }, []);

    const handleSaveProfile = async () => {
        if (!fullName.trim() || !email.trim()) {
            Alert.alert("Required Fields", "Please enter your full name and email.");
            return;
        }

        if (!userId) {
            Alert.alert("Authentication Error", "Could not verify your user ID. Please log in again.");
            return;
        }

        setLoading(true);
        try {
            // Now 'userId' is guaranteed to be the valid Supabase UUID
            const { error: profileError } = await supabase
                .from("profile")
                .insert({
                    id: userId,
                    full_name: fullName,
                    email: email,
                    phone: userPhone,
                    address: address,
                });

            if (profileError) throw profileError;

            // Create an empty wallet for the new user
            const { error: walletError } = await supabase
                .from("wallet")
                .insert({ user_id: userId, balance: 0 });

            if (walletError) console.error("Wallet creation failed:", walletError);

            // Successfully saved! Send them to the Home screen
            navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });

        } catch (error: any) {
            console.error("Save Profile Error:", error);
            Alert.alert("Database Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.content}>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>Just a few more details to get you started.</Text>

                    <View style={styles.form}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={userPhone}
                            editable={false}
                        />

                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

                        <Text style={styles.label}>Email Address *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. john@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Current Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter your address..."
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleSaveProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#111" />
                            ) : (
                                <Text style={styles.primaryText}>Save & Continue</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FDFDFD" },
    content: { padding: 24, flex: 1, justifyContent: "center" },
    title: { fontSize: 28, fontWeight: "800", color: "#111", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
    form: { gap: 16 },
    label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: -8, marginLeft: 4 },
    input: { borderWidth: 1.5, borderColor: "#E5E5E5", borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: "#FFF", color: "#111" },
    disabledInput: { backgroundColor: "#F5F5F5", color: "#888" },
    textArea: { height: 80, textAlignVertical: "top" },
    primaryBtn: { backgroundColor: COLORS.saffron, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
    primaryText: { color: "#111", fontWeight: "800", fontSize: 16 },
});