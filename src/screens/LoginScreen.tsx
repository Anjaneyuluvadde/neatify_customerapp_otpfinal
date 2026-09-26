// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { Image } from "expo-image";
// import { Lock, Mail, User } from "lucide-react-native";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions
// } from "react-native";
// import Animated, {
//   FadeInDown,
//   FadeInUp,
//   interpolateColor,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withSequence,
//   withSpring,
//   withTiming
// } from "react-native-reanimated";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// import NeatifyLogo from "../../assets/images/neatifylogo.png";
// import PrivacyModal from "../components/PrivacyModal";
// import TermsModal from "../components/TermsModal";
// import { useLanguage } from "../context/LanguageContext";
// import { useTheme } from "../context/ThemeContext";
// import { useNotification } from "../hooks/useNotification";
// import { supabase } from "../lib/supabase";
// import { COLORS } from "../theme/colors";
// import { generateReferralCode } from "../utils/referralUtils";
// // Animated Input Component
// function AnimatedInput({ icon, placeholder, value, onChange, secureTextEntry, rightElement, keyboardType, maxLength, autoCapitalize }: any) {
//   const [isFocused, setIsFocused] = useState(false);
//   const focusAnim = useSharedValue(0);

//   useEffect(() => {
//     focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
//   }, [isFocused]);

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       borderColor: interpolateColor(focusAnim.value, [0, 1], ["#F0F0F0", COLORS.saffron]),
//       shadowOpacity: focusAnim.value * 0.1,
//       shadowRadius: focusAnim.value * 6,
//       shadowColor: COLORS.saffron,
//       shadowOffset: { width: 0, height: 3 },
//       elevation: focusAnim.value * 3,
//       transform: [{ scale: 1 + focusAnim.value * 0.01 }]
//     };
//   });

//   return (
//     <Animated.View style={[styles.animatedInputContainer, animatedStyle]}>
//       {icon}
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#888"
//         value={value}
//         onChangeText={onChange}
//         secureTextEntry={secureTextEntry}
//         onFocus={() => setIsFocused(true)}
//         onBlur={() => setIsFocused(false)}
//         keyboardType={keyboardType}
//         maxLength={maxLength}
//         autoCapitalize={autoCapitalize}
//       />
//       {rightElement}
//     </Animated.View>
//   );
// }

// // ----------------------------------------------------
// // MAIN COMPONENT
// // ----------------------------------------------------
// export default function LoginScreen(props: any) {
//   const navigation = useNavigation<any>();
//   const { showAlert, showToast } = useNotification();
//   const { t } = useLanguage();
//   const { theme, isDark } = useTheme();
//   const insets = useSafeAreaInsets();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 768;

//   const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const [termsViewed, setTermsViewed] = useState(false);
//   const [termsAccepted, setTermsAccepted] = useState(false);
//   const [showTermsModal, setShowTermsModal] = useState(false);
//   const [showPrivacyModal, setShowPrivacyModal] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const checkProfileAndNavigate = async (userId: string, userEmail: string, userName?: string, isNewSignup: boolean = false) => {
//     try {
//       const { data: profile } = await supabase
//         .from("profile")
//         .select("id, full_name, email")
//         .eq("id", userId)
//         .maybeSingle();

//       if (!profile || isNewSignup) {
//         const myReferralCode = generateReferralCode(userName || userEmail || "User");

//         await supabase
//           .from("profile")
//           .upsert({
//             id: userId,
//             full_name: userName || profile?.full_name || "",
//             email: userEmail,
//             referral_code: myReferralCode,
//           });

//         await supabase.from("wallet").upsert({
//           user_id: userId,
//           balance: 0
//         });
//       }

//       navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     } catch (err) {
//       console.error("Profile check/create failed:", err);
//       navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     }
//   };

//   const handleAuth = async () => {
//     if (!email.trim() || !password.trim()) {
//       showAlert({ type: "warning", title: "Missing Fields", message: "Please fill in all required fields." });
//       return;
//     }

//     if (authMode === 'signup' && !fullName.trim()) {
//       showAlert({ type: "warning", title: "Missing Name", message: "Please enter your full name." });
//       return;
//     }

//     if (!termsAccepted && authMode === 'signup') {
//       showAlert({ type: "warning", title: "Terms Required", message: "Please accept the Terms & Conditions." });
//       return;
//     }

//     setLoading(true);
//     try {
//       if (authMode === 'login') {
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email: email.trim(),
//           password: password
//         });

//         if (error) throw error;
//         if (!data.user) throw new Error("Login failed");

//         await checkProfileAndNavigate(data.user.id, data.user.email || "", "", false);

//       } else {
//         const { data, error } = await supabase.auth.signUp({
//           email: email.trim(),
//           password: password,
//           options: {
//             data: {
//               full_name: fullName.trim(),
//             }
//           }
//         });

//         if (error) throw error;
//         if (!data.user) throw new Error("Signup failed");

//         // If email verification is required, you might want to show a toast here instead
//         if (data.session) {
//           await checkProfileAndNavigate(data.user.id, data.user.email || "", fullName.trim(), true);
//         } else {
//           showAlert({ type: "info", title: "Verify Email", message: "Please check your inbox to verify your email." });
//           setAuthMode('login');
//         }
//       }
//     } catch (err: any) {
//       console.error("Auth error:", err);
//       showAlert({ type: "error", title: "Authentication Failed", message: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------------------------
//   // Animations
//   // -------------------------------------
//   const characterBob = useSharedValue(0);
//   const buttonScale = useSharedValue(1);

//   useEffect(() => {
//     characterBob.value = withRepeat(
//       withSequence(
//         withTiming(-10, { duration: 1800 }),
//         withTiming(0, { duration: 1800 })
//       ),
//       -1,
//       true
//     );
//   }, []);

//   const characterAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ translateY: characterBob.value }],
//     };
//   });

//   const buttonAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//     };
//   });

//   const handlePressIn = () => { buttonScale.value = withSpring(0.96); };
//   const handlePressOut = () => { buttonScale.value = withSpring(1); };

//   // -------------------------------------
//   // Render
//   // -------------------------------------
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFDFD" }}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />

//       {/* Subtle Background Elements */}
//       <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
//         <View style={styles.bgCircleTop} />
//         <View style={styles.bgCircleBottom} />
//       </View>

//       {/* BACK BUTTON */}
//       <TouchableOpacity
//         onPress={() => { navigation.canGoBack() ? navigation.goBack() : navigation.replace("HomeDrawer"); }}
//         style={[styles.backBtn, { top: Math.max(insets.top, 10) }]}
//       >
//         <Ionicons name="arrow-back" size={24} color="#111" />
//       </TouchableOpacity>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={[
//             styles.scrollContainer,
//             isDesktop && { flexDirection: "row", alignItems: "center", justifyContent: "center" }
//           ]}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >

//           {/* DESKTOP RIGHT SIDE / MOBILE TOP: 3D Character */}
//           <View style={[isDesktop ? styles.desktopCharacterContainer : styles.mobileCharacterContainer]}>
//             <Animated.View style={characterAnimatedStyle}>
//               <Image
//                 source={require("../../assets/images/heroimg.png")}
//                 style={isDesktop ? styles.desktopCharacterImage : styles.mobileCharacterImage}
//                 contentFit="contain"
//               />
//             </Animated.View>
//           </View>

//           {/* FORM CONTAINER */}
//           <Animated.View
//             entering={FadeInUp.duration(600).delay(100)}
//             style={[styles.formContainer, isDesktop && styles.desktopFormContainer]}
//           >
//             <View style={styles.header}>
//               <Image source={NeatifyLogo} style={styles.logo} contentFit="contain" />
//               <Text style={styles.subtitle}>
//                 Welcome to The Neatify Team! Ready for a sparkling clean home?
//               </Text>
//             </View>

//             <View style={styles.form}>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400)}>
//                   <AnimatedInput
//                     icon={<User size={20} color="#888" />}
//                     placeholder="Full Name"
//                     value={fullName}
//                     onChange={setFullName}
//                     autoCapitalize="words"
//                   />
//                   <View style={{ height: 12 }} />
//                 </Animated.View>
//               )}

//               <Animated.View entering={FadeInDown.duration(400).delay(100)}>
//                 <AnimatedInput
//                   icon={<Mail size={20} color="#888" />}
//                   placeholder="Email Address"
//                   value={email}
//                   onChange={setEmail}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                 />
//               </Animated.View>

//               <View style={{ height: 12 }} />

//               <Animated.View entering={FadeInDown.duration(400).delay(200)}>
//                 <AnimatedInput
//                   icon={<Lock size={20} color="#888" />}
//                   placeholder="Password"
//                   value={password}
//                   onChange={setPassword}
//                   secureTextEntry={!showPassword}
//                   rightElement={
//                     <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
//                       <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
//                     </TouchableOpacity>
//                   }
//                 />
//                 {authMode === 'login' && (
//                   <TouchableOpacity 
//                     style={{ alignSelf: "flex-end", marginTop: 8 }}
//                     onPress={() => navigation.navigate("ResetPassword")}
//                   >
//                     <Text style={{ color: COLORS.saffron, fontWeight: "600", fontSize: 13 }}>Forgot Password?</Text>
//                   </TouchableOpacity>
//                 )}
//               </Animated.View>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400).delay(300)}>
//                   <View style={{ height: 12 }} />

//                   {/* Terms & Conditions Row */}
//                   <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8, paddingHorizontal: 4 }}>
//                     <TouchableOpacity
//                       onPress={() => {
//                         if (!termsViewed) {
//                           setShowTermsModal(true);
//                         } else {
//                           setTermsAccepted(!termsAccepted);
//                         }
//                       }}
//                       style={{ marginRight: 8, padding: 4 }}
//                     >
//                       <Ionicons
//                         name={termsAccepted ? "checkbox" : "square-outline"}
//                         size={24}
//                         color={termsAccepted ? COLORS.saffron : "#888"}
//                       />
//                     </TouchableOpacity>
//                     <Text style={{ fontSize: 13, color: "#111", flex: 1 }}>
//                       I agree to the{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowTermsModal(true)}>
//                         Terms
//                       </Text>
//                       {" "}and{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowPrivacyModal(true)}>
//                         Privacy Policy
//                       </Text>
//                     </Text>
//                   </View>
//                 </Animated.View>
//               )}

//               <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAuth} disabled={loading} style={{ marginTop: 20 }}>
//                 <Animated.View style={[styles.primaryBtn, buttonAnimatedStyle]}>
//                   {loading ? (
//                     <ActivityIndicator color="#111" />
//                   ) : (
//                     <Text style={styles.primaryText}>{authMode === 'login' ? 'Login' : 'Sign Up'}</Text>
//                   )}
//                 </Animated.View>
//               </Pressable>

//               {authMode === 'login' && (
//                 <>
//                   <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                     <Text style={{ marginHorizontal: 10, color: "#888", fontSize: 13, fontWeight: "600" }}>OR</Text>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                   </View>

//                   <Pressable 
//                     onPress={async () => {
//                       try {
//                         setLoading(true);
//                         const { signInWithGoogle } = await import('../auth/useGoogleAuth');
//                         await signInWithGoogle();
//                       } catch (err: any) {
//                         showAlert({ type: "error", title: "Google Sign-In Failed", message: err.message });
//                       } finally {
//                         setLoading(false);
//                       }
//                     }} 
//                     disabled={loading}
//                   >
//                     <View style={styles.googleBtn}>
//                       <Image 
//                         source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} 
//                         style={{ width: 22, height: 22, marginRight: 10 }} 
//                         contentFit="contain" 
//                       />
//                       <Text style={styles.googleBtnText}>Continue with Google</Text>
//                     </View>
//                   </Pressable>
//                 </>
//               )}

//               <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
//                 <Text style={{ color: "#555", fontSize: 14 }}>
//                   {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
//                 </Text>
//                 <TouchableOpacity onPress={() => {
//                   setAuthMode(authMode === 'login' ? 'signup' : 'login');
//                 }}>
//                   <Text style={styles.linkText}>{authMode === 'login' ? 'Sign Up' : 'Login'}</Text>
//                 </TouchableOpacity>
//               </View>

//             </View>
//           </Animated.View>

//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* PRIVACY POLICY MODAL */}
//       <TermsModal
//         visible={showTermsModal}
//         onClose={() => setShowTermsModal(false)}
//         onAccept={() => {
//           setTermsViewed(true);
//           setTermsAccepted(true);
//           setShowTermsModal(false);
//         }}
//       />
//       <PrivacyModal
//         visible={showPrivacyModal}
//         onClose={() => setShowPrivacyModal(false)}
//         onAccept={() => {
//           setShowPrivacyModal(false);
//         }}
//       />

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   bgCircleTop: {
//     position: "absolute",
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: COLORS.saffron + "15",
//     top: -100,
//     right: -100,
//   },
//   bgCircleBottom: {
//     position: "absolute",
//     width: 400,
//     height: 400,
//     borderRadius: 200,
//     backgroundColor: COLORS.saffron + "10",
//     bottom: -150,
//     left: -150,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: "5%",
//     paddingTop: 30,
//     paddingBottom: 40
//   },
//   backBtn: {
//     position: "absolute",
//     left: 16,
//     zIndex: 100,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFF",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   mobileCharacterContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: -45, // Deeper overlap to place character behind card
//     marginTop: 10,
//     zIndex: 1,
//   },
//   desktopCharacterContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 40,
//   },
//   mobileCharacterImage: {
//     width: 180, // Scaled down
//     height: 160,
//   },
//   desktopCharacterImage: {
//     width: "100%",
//     height: 500,
//     maxWidth: 450,
//   },
//   formContainer: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24, // reduced corners slightly
//     padding: 20, // reduced internal padding
//     paddingTop: 24, // Card top spacing
//     paddingBottom: 28,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.08,
//     shadowRadius: 24,
//     elevation: 8,
//     zIndex: 2,
//   },
//   desktopFormContainer: {
//     flex: 1,
//     maxWidth: 500,
//     marginVertical: 40,
//   },
//   header: {
//     marginBottom: 20,
//     alignItems: "center", // Center horizontally
//   },
//   logo: {
//     width: 130, // Smaller branding
//     height: 38,
//     marginBottom: 16, // Spacing between logo and heading
//   },
//   subtitle: {
//     color: "#111", // Black/dark text
//     fontSize: 16,
//     fontFamily: Platform.OS === 'android' ? 'sans-serif-rounded' : 'Arial Rounded MT Bold',
//     fontWeight: Platform.OS === 'android' ? 'normal' : '700',
//     lineHeight: 22,
//     textAlign: "center",
//     paddingHorizontal: 8,
//   },
//   form: {
//     gap: 12, // reduced gaps
//   },
//   animatedInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1.5,
//     borderColor: "#F0F0F0", // subtle grey
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14, // slightly rounder
//     paddingVertical: 12, // shorter height
//     paddingHorizontal: 14,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     marginLeft: 12,
//     color: "#111",
//     fontWeight: "500",
//   },
//   primaryBtn: {
//     backgroundColor: COLORS.saffron,
//     height: 52, // Shorter height
//     borderRadius: 14, // match input border radius
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 4,
//     shadowColor: COLORS.saffron,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2, // subtle shadow
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   primaryText: {
//     color: "#111",
//     fontWeight: "800",
//     fontSize: 15,
//     letterSpacing: 0.5,
//   },
//   googleBtn: {
//     backgroundColor: "#FFFFFF",
//     height: 52,
//     borderRadius: 14,
//     borderWidth: 1.5,
//     borderColor: "#E5E5E5",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   googleBtnText: {
//     color: "#333",
//     fontWeight: "700",
//     fontSize: 15,
//   },
//   linkText: {
//     fontWeight: "800",
//     color: COLORS.saffron,
//     fontSize: 14,
//   },
// });






















// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { Image } from "expo-image";
// import { Lock, Mail, User } from "lucide-react-native";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions
// } from "react-native";
// import Animated, {
//   FadeInDown,
//   FadeInUp,
//   interpolateColor,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withSequence,
//   withSpring,
//   withTiming
// } from "react-native-reanimated";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// import NeatifyLogo from "../../assets/images/neatifylogo.png";
// import PrivacyModal from "../components/PrivacyModal";
// import TermsModal from "../components/TermsModal";
// import { useLanguage } from "../context/LanguageContext";
// import { useTheme } from "../context/ThemeContext";
// import { useNotification } from "../hooks/useNotification";
// import { supabase } from "../lib/supabase";
// import { COLORS } from "../theme/colors";
// import { generateReferralCode } from "../utils/referralUtils";
// // Animated Input Component
// function AnimatedInput({ icon, placeholder, value, onChange, secureTextEntry, rightElement, keyboardType, maxLength, autoCapitalize }: any) {
//   const [isFocused, setIsFocused] = useState(false);
//   const focusAnim = useSharedValue(0);

//   useEffect(() => {
//     focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
//   }, [isFocused]);

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       borderColor: interpolateColor(focusAnim.value, [0, 1], ["#F0F0F0", COLORS.saffron]),
//       shadowOpacity: focusAnim.value * 0.1,
//       shadowRadius: focusAnim.value * 6,
//       shadowColor: COLORS.saffron,
//       shadowOffset: { width: 0, height: 3 },
//       elevation: focusAnim.value * 3,
//       transform: [{ scale: 1 + focusAnim.value * 0.01 }]
//     };
//   });

//   return (
//     <Animated.View style={[styles.animatedInputContainer, animatedStyle]}>
//       {icon}
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#888"
//         value={value}
//         onChangeText={onChange}
//         secureTextEntry={secureTextEntry}
//         onFocus={() => setIsFocused(true)}
//         onBlur={() => setIsFocused(false)}
//         keyboardType={keyboardType}
//         maxLength={maxLength}
//         autoCapitalize={autoCapitalize}
//       />
//       {rightElement}
//     </Animated.View>
//   );
// }

// // ----------------------------------------------------
// // MAIN COMPONENT
// // ----------------------------------------------------
// export default function LoginScreen(props: any) {
//   const navigation = useNavigation<any>();
//   const { showAlert, showToast } = useNotification();
//   const { t } = useLanguage();
//   const { theme, isDark } = useTheme();
//   const insets = useSafeAreaInsets();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 768;

//   const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const [termsViewed, setTermsViewed] = useState(false);
//   const [termsAccepted, setTermsAccepted] = useState(false);
//   const [showTermsModal, setShowTermsModal] = useState(false);
//   const [showPrivacyModal, setShowPrivacyModal] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const checkProfileAndNavigate = async (userId: string, userEmail: string, userName?: string, isNewSignup: boolean = false) => {
//     try {
//       const { data: profile } = await supabase
//         .from("profile")
//         .select("id, full_name, email")
//         .eq("id", userId)
//         .maybeSingle();

//       if (!profile || isNewSignup) {
//         const myReferralCode = generateReferralCode(userName || userEmail || "User");

//         await supabase
//           .from("profile")
//           .upsert({
//             id: userId,
//             full_name: userName || profile?.full_name || "",
//             email: userEmail,
//             referral_code: myReferralCode,
//           });

//         await supabase.from("wallet").upsert({
//           user_id: userId,
//           balance: 0
//         });
//       }

//       // navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     } catch (err) {
//       console.error("Profile check/create failed:", err);
//       // navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     }
//   };

//   const handleAuth = async () => {
//     if (!email.trim() || !password.trim()) {
//       showAlert({ type: "warning", title: "Missing Fields", message: "Please fill in all required fields." });
//       return;
//     }

//     if (authMode === 'signup' && !fullName.trim()) {
//       showAlert({ type: "warning", title: "Missing Name", message: "Please enter your full name." });
//       return;
//     }

//     if (!termsAccepted && authMode === 'signup') {
//       showAlert({ type: "warning", title: "Terms Required", message: "Please accept the Terms & Conditions." });
//       return;
//     }

//     setLoading(true);
//     try {
//       if (authMode === 'login') {
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email: email.trim(),
//           password: password
//         });

//         if (error) throw error;
//         if (!data.user) throw new Error("Login failed");

//         await checkProfileAndNavigate(data.user.id, data.user.email || "", "", false);

//       } else {
//         const { data, error } = await supabase.auth.signUp({
//           email: email.trim(),
//           password: password,
//           options: {
//             data: {
//               full_name: fullName.trim(),
//             }
//           }
//         });

//         if (error) throw error;
//         if (!data.user) throw new Error("Signup failed");

//         // If email verification is required, you might want to show a toast here instead
//         if (data.session) {
//           await checkProfileAndNavigate(data.user.id, data.user.email || "", fullName.trim(), true);
//         } else {
//           showAlert({ type: "info", title: "Verify Email", message: "Please check your inbox to verify your email." });
//           setAuthMode('login');
//         }
//       }
//     } catch (err: any) {
//       console.error("Auth error:", err);
//       showAlert({ type: "error", title: "Authentication Failed", message: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------------------------
//   // Animations
//   // -------------------------------------
//   const characterBob = useSharedValue(0);
//   const buttonScale = useSharedValue(1);

//   useEffect(() => {
//     characterBob.value = withRepeat(
//       withSequence(
//         withTiming(-10, { duration: 1800 }),
//         withTiming(0, { duration: 1800 })
//       ),
//       -1,
//       true
//     );
//   }, []);

//   const characterAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ translateY: characterBob.value }],
//     };
//   });

//   const buttonAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//     };
//   });

//   const handlePressIn = () => { buttonScale.value = withSpring(0.96); };
//   const handlePressOut = () => { buttonScale.value = withSpring(1); };

//   // -------------------------------------
//   // Render
//   // -------------------------------------
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFDFD" }}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />

//       {/* Subtle Background Elements */}
//       <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
//         <View style={styles.bgCircleTop} />
//         <View style={styles.bgCircleBottom} />
//       </View>

//       {/* BACK BUTTON */}
//       <TouchableOpacity
//         onPress={() => { navigation.canGoBack() ? navigation.goBack() : navigation.replace("HomeDrawer"); }}
//         style={[styles.backBtn, { top: Math.max(insets.top, 10) }]}
//       >
//         <Ionicons name="arrow-back" size={24} color="#111" />
//       </TouchableOpacity>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={[
//             styles.scrollContainer,
//             isDesktop && { flexDirection: "row", alignItems: "center", justifyContent: "center" }
//           ]}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >

//           {/* DESKTOP RIGHT SIDE / MOBILE TOP: 3D Character */}
//           <View style={[isDesktop ? styles.desktopCharacterContainer : styles.mobileCharacterContainer]}>
//             <Animated.View style={characterAnimatedStyle}>
//               <Image
//                 source={require("../../assets/images/heroimg.png")}
//                 style={isDesktop ? styles.desktopCharacterImage : styles.mobileCharacterImage}
//                 contentFit="contain"
//               />
//             </Animated.View>
//           </View>

//           {/* FORM CONTAINER */}
//           <Animated.View
//             entering={FadeInUp.duration(600).delay(100)}
//             style={[styles.formContainer, isDesktop && styles.desktopFormContainer]}
//           >
//             <View style={styles.header}>
//               <Image source={NeatifyLogo} style={styles.logo} contentFit="contain" />
//               <Text style={styles.subtitle}>
//                 Welcome to The Neatify Team! Ready for a sparkling clean home?
//               </Text>
//             </View>

//             <View style={styles.form}>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400)}>
//                   <AnimatedInput
//                     icon={<User size={20} color="#888" />}
//                     placeholder="Full Name"
//                     value={fullName}
//                     onChange={setFullName}
//                     autoCapitalize="words"
//                   />
//                   <View style={{ height: 12 }} />
//                 </Animated.View>
//               )}

//               <Animated.View entering={FadeInDown.duration(400).delay(100)}>
//                 <AnimatedInput
//                   icon={<Mail size={20} color="#888" />}
//                   placeholder="Email Address"
//                   value={email}
//                   onChange={setEmail}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                 />
//               </Animated.View>

//               <View style={{ height: 12 }} />

//               <Animated.View entering={FadeInDown.duration(400).delay(200)}>
//                 <AnimatedInput
//                   icon={<Lock size={20} color="#888" />}
//                   placeholder="Password"
//                   value={password}
//                   onChange={setPassword}
//                   secureTextEntry={!showPassword}
//                   rightElement={
//                     <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
//                       <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
//                     </TouchableOpacity>
//                   }
//                 />
//                 {authMode === 'login' && (
//                   <TouchableOpacity 
//                     style={{ alignSelf: "flex-end", marginTop: 8 }}
//                     onPress={() => navigation.navigate("ResetPassword")}
//                   >
//                     <Text style={{ color: COLORS.saffron, fontWeight: "600", fontSize: 13 }}>Forgot Password?</Text>
//                   </TouchableOpacity>
//                 )}
//               </Animated.View>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400).delay(300)}>
//                   <View style={{ height: 12 }} />

//                   {/* Terms & Conditions Row */}
//                   {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8, paddingHorizontal: 4 }}>
//                     <TouchableOpacity
//                       onPress={() => {
//                         if (!termsViewed) {
//                           setShowTermsModal(true);
//                         } else {
//                           setTermsAccepted(!termsAccepted);
//                         }
//                       }}
//                       style={{ marginRight: 8, padding: 4 }}
//                     >
//                       <Ionicons
//                         name={termsAccepted ? "checkbox" : "square-outline"}
//                         size={24}
//                         color={termsAccepted ? COLORS.saffron : "#888"}
//                       />
//                     </TouchableOpacity>
//                     <Text style={{ fontSize: 13, color: "#111", flex: 1 }}>
//                       I agree to the{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowTermsModal(true)}>
//                         Terms
//                       </Text>
//                       {" "}and{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowPrivacyModal(true)}>
//                         Privacy Policy
//                       </Text>
//                     </Text>
//                   </View> */}
//                 </Animated.View>
//               )}

//               <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAuth} disabled={loading} style={{ marginTop: 20 }}>
//                 <Animated.View style={[styles.primaryBtn, buttonAnimatedStyle]}>
//                   {loading ? (
//                     <ActivityIndicator color="#111" />
//                   ) : (
//                     <Text style={styles.primaryText}>{authMode === 'login' ? 'Login' : 'Sign Up'}</Text>
//                   )}
//                 </Animated.View>
//               </Pressable>

//               {authMode === 'login' && (
//                 <>
//                   <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                     <Text style={{ marginHorizontal: 10, color: "#888", fontSize: 13, fontWeight: "600" }}>OR</Text>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                   </View>

//                   <Pressable 
//                     onPress={async () => {
//                       try {
//                         setLoading(true);
//                         const { signInWithGoogle } = await import('../auth/useGoogleAuth');
//                         await signInWithGoogle();
//                       } catch (err: any) {
//                         showAlert({ type: "error", title: "Google Sign-In Failed", message: err.message });
//                       } finally {
//                         setLoading(false);
//                       }
//                     }} 
//                     disabled={loading}
//                   >
//                     <View style={styles.googleBtn}>
//                       <Image 
//                         source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} 
//                         style={{ width: 22, height: 22, marginRight: 10 }} 
//                         contentFit="contain" 
//                       />
//                       <Text style={styles.googleBtnText}>Continue with Google</Text>
//                     </View>
//                   </Pressable>
//                 </>
//               )}

//               <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
//                 <Text style={{ color: "#555", fontSize: 14 }}>
//                   {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
//                 </Text>
//                 <TouchableOpacity onPress={() => {
//                   setAuthMode(authMode === 'login' ? 'signup' : 'login');
//                 }}>
//                   <Text style={styles.linkText}>{authMode === 'login' ? 'Sign Up' : 'Login'}</Text>
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.policyFooter}>
//   <Text style={styles.policyContinueText}>
//     By continuing, you agree to our
//   </Text>

//   <View style={styles.policyLinksRow}>
//     <TouchableOpacity onPress={() => setShowTermsModal(true)}>
//       <Text style={styles.policyLink}>
//         Terms & Conditions
//       </Text>
//     </TouchableOpacity>

//     <Text style={styles.policySeparator}>|</Text>

//     <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
//       <Text style={styles.policyLink}>
//         Privacy Policy
//       </Text>
//     </TouchableOpacity>
//   </View>

//   <Text style={styles.poweredByText}>
//     Powered by The Neatify Services (OPC) Pvt. Ltd.
//   </Text>
// </View>

//             </View>
//           </Animated.View>

//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* PRIVACY POLICY MODAL */}
//       <TermsModal
//         visible={showTermsModal}
//         onClose={() => setShowTermsModal(false)}
//         onAccept={() => {
//           setTermsViewed(true);
//           setTermsAccepted(true);
//           setShowTermsModal(false);
//         }}
//       />
//       <PrivacyModal
//         visible={showPrivacyModal}
//         onClose={() => setShowPrivacyModal(false)}
//         onAccept={() => {
//           setShowPrivacyModal(false);
//         }}
//       />

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   bgCircleTop: {
//     position: "absolute",
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: COLORS.saffron + "15",
//     top: -100,
//     right: -100,
//   },
//   bgCircleBottom: {
//     position: "absolute",
//     width: 400,
//     height: 400,
//     borderRadius: 200,
//     backgroundColor: COLORS.saffron + "10",
//     bottom: -150,
//     left: -150,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: "5%",
//     paddingTop: 30,
//     paddingBottom: 40
//   },
//   backBtn: {
//     position: "absolute",
//     left: 16,
//     zIndex: 100,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFF",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   mobileCharacterContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: -45, // Deeper overlap to place character behind card
//     marginTop: 10,
//     zIndex: 1,
//   },
//   desktopCharacterContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 40,
//   },
//   mobileCharacterImage: {
//     width: 180, // Scaled down
//     height: 160,
//   },
//   desktopCharacterImage: {
//     width: "100%",
//     height: 500,
//     maxWidth: 450,
//   },
//   formContainer: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24, // reduced corners slightly
//     padding: 20, // reduced internal padding
//     paddingTop: 24, // Card top spacing
//     paddingBottom: 28,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.08,
//     shadowRadius: 24,
//     elevation: 8,
//     zIndex: 2,
//   },
//   desktopFormContainer: {
//     flex: 1,
//     maxWidth: 500,
//     marginVertical: 40,
//   },
//   header: {
//     marginBottom: 20,
//     alignItems: "center", // Center horizontally
//   },
//   logo: {
//     width: 130, // Smaller branding
//     height: 38,
//     marginBottom: 16, // Spacing between logo and heading
//   },
//   subtitle: {
//     color: "#111", // Black/dark text
//     fontSize: 16,
//     fontFamily: Platform.OS === 'android' ? 'sans-serif-rounded' : 'Arial Rounded MT Bold',
//     fontWeight: Platform.OS === 'android' ? 'normal' : '700',
//     lineHeight: 22,
//     textAlign: "center",
//     paddingHorizontal: 8,
//   },
//   form: {
//     gap: 12, // reduced gaps
//   },
//   animatedInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1.5,
//     borderColor: "#F0F0F0", // subtle grey
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14, // slightly rounder
//     paddingVertical: 12, // shorter height
//     paddingHorizontal: 14,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     marginLeft: 12,
//     color: "#111",
//     fontWeight: "500",
//   },
//   primaryBtn: {
//     backgroundColor: COLORS.saffron,
//     height: 52, // Shorter height
//     borderRadius: 14, // match input border radius
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 4,
//     shadowColor: COLORS.saffron,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2, // subtle shadow
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   primaryText: {
//     color: "#111",
//     fontWeight: "800",
//     fontSize: 15,
//     letterSpacing: 0.5,
//   },
//   googleBtn: {
//     backgroundColor: "#FFFFFF",
//     height: 52,
//     borderRadius: 14,
//     borderWidth: 1.5,
//     borderColor: "#E5E5E5",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   googleBtnText: {
//     color: "#333",
//     fontWeight: "700",
//     fontSize: 15,
//   },
// //   linkText: {
// //     fontWeight: "800",
// //     color: COLORS.saffron,
// //     fontSize: 14,
// //   },
// // });


// linkText: {
//   fontWeight: "800",
//   color: COLORS.saffron,
//   fontSize: 14,
// },

// policyFooter: {
//   alignItems: "center",
//   marginTop: 24,
//   paddingHorizontal: 10,
//   paddingBottom: 10,
// },

// policyContinueText: {
//   fontSize: 14,
//   color: "#777",
//   textAlign: "center",
//   marginBottom: 4,
// },

// policyLinksRow: {
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "center",
// },

// policyLink: {
//   fontSize: 15,
//   fontWeight: "700",
//   color: "#222",
//   textDecorationLine: "underline",
// },

// policySeparator: {
//   fontSize: 15,
//   color: "#999",
//   marginHorizontal: 10,
// },

// poweredByText: {
//   fontSize: 13,
//   color: "#999",
//   textAlign: "center",
//   marginTop: 28,
// },
// });



















// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { Image } from "expo-image";
// import { Lock, Mail, User } from "lucide-react-native";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions
// } from "react-native";
// import Animated, {
//   FadeInDown,
//   FadeInUp,
//   interpolateColor,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withSequence,
//   withSpring,
//   withTiming
// } from "react-native-reanimated";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// import NeatifyLogo from "../../assets/images/neatifylogo.png";
// import PrivacyModal from "../components/PrivacyModal";
// import TermsModal from "../components/TermsModal";
// import { useLanguage } from "../context/LanguageContext";
// import { useTheme } from "../context/ThemeContext";
// import { useNotification } from "../hooks/useNotification";
// import { supabase } from "../lib/supabase";
// import { COLORS } from "../theme/colors";
// import { generateReferralCode } from "../utils/referralUtils";
// // Animated Input Component
// function AnimatedInput({ icon, placeholder, value, onChange, secureTextEntry, rightElement, keyboardType, maxLength, autoCapitalize }: any) {
//   const [isFocused, setIsFocused] = useState(false);
//   const focusAnim = useSharedValue(0);

//   useEffect(() => {
//     focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
//   }, [isFocused]);

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       borderColor: interpolateColor(focusAnim.value, [0, 1], ["#F0F0F0", COLORS.saffron]),
//       shadowOpacity: focusAnim.value * 0.1,
//       shadowRadius: focusAnim.value * 6,
//       shadowColor: COLORS.saffron,
//       shadowOffset: { width: 0, height: 3 },
//       elevation: focusAnim.value * 3,
//       transform: [{ scale: 1 + focusAnim.value * 0.01 }]
//     };
//   });

//   return (
//     <Animated.View style={[styles.animatedInputContainer, animatedStyle]}>
//       {icon}
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#888"
//         value={value}
//         onChangeText={onChange}
//         secureTextEntry={secureTextEntry}
//         onFocus={() => setIsFocused(true)}
//         onBlur={() => setIsFocused(false)}
//         keyboardType={keyboardType}
//         maxLength={maxLength}
//         autoCapitalize={autoCapitalize}
//       />
//       {rightElement}
//     </Animated.View>
//   );
// }

// // ----------------------------------------------------
// // MAIN COMPONENT
// // ----------------------------------------------------
// export default function LoginScreen(props: any) {
//   const navigation = useNavigation<any>();
//   const { showAlert, showToast } = useNotification();
//   const { t } = useLanguage();
//   const { theme, isDark } = useTheme();
//   const insets = useSafeAreaInsets();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 768;

//   const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   // const [termsViewed, setTermsViewed] = useState(false);
//   // const [termsAccepted, setTermsAccepted] = useState(false);
//   const [showTermsModal, setShowTermsModal] = useState(false);
//   const [showPrivacyModal, setShowPrivacyModal] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const authInProgressRef = useRef(false);
//   const checkProfileAndNavigate = async (userId: string, userEmail: string, userName?: string, isNewSignup: boolean = false) => {
//     try {
//       const { data: profile } = await supabase
//         .from("profile")
//         .select("id, full_name, email")
//         .eq("id", userId)
//         .maybeSingle();

//       if (!profile || isNewSignup) {
//         const myReferralCode = generateReferralCode(userName || userEmail || "User");

//         await supabase
//           .from("profile")
//           .upsert({
//             id: userId,
//             full_name: userName || profile?.full_name || "",
//             email: userEmail,
//             referral_code: myReferralCode,
//           });

//         await supabase.from("wallet").upsert({
//           user_id: userId,
//           balance: 0
//         });
//       }

//       navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     } catch (err) {
//       console.error("Profile check/create failed:", err);
//       // navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
//     }
//   };

//   const handleAuth = async () => {
//     // Prevent duplicate signup/login requests
//     if (authInProgressRef.current) {
//       console.log("[AUTH] Request already in progress - ignoring duplicate tap");
//       return;
//     }

//     // Basic validation
//     if (!email.trim() || !password.trim()) {
//       Alert.alert("Error", "Please enter email and password.");
//       return;
//     }

//     if (authMode === "signup") {
//       if (!fullName.trim()) {
//         Alert.alert("Error", "Please enter your full name.");
//         return;
//       }

//       // if (!termsAccepted) {
//       //   Alert.alert(
//       //     "Terms Required",
//       //     "Please accept the Terms & Conditions and Privacy Policy."
//       //   );
//       //   return;
//       // }
//     }

//     // Lock immediately BEFORE starting Supabase request
//     authInProgressRef.current = true;
//     setLoading(true);

//     try {
//       const cleanEmail = email.trim().toLowerCase();

//       if (authMode === "login") {
//         console.log("[AUTH] Login started:", cleanEmail);

//         const { data, error } = await supabase.auth.signInWithPassword({
//           email: cleanEmail,
//           password,
//         });

//         if (error) {
//           throw error;
//         }

//         console.log("[AUTH] Login successful:", data.user?.id);
//       } else {
//         console.log("[AUTH] Signup started:", cleanEmail);

//         const { data, error } = await supabase.auth.signUp({
//           email: cleanEmail,
//           password,
//           options: {
//             data: {
//               full_name: fullName.trim(),
//             },
//           },
//         });

//         console.log("[AUTH] Signup response:", {
//           hasUser: !!data.user,
//           userId: data.user?.id,
//           hasSession: !!data.session,
//           error: error?.message,
//         });

//         if (error) {
//           throw error;
//         }

//         if (data.session && data.user) {
//           console.log("[AUTH] Signup successful - session created");

//           showToast("Terms & Conditions accepted");
//           //         showAlert({
//           //   title: "Signup Successful",
//           //   message: "Your account has been created successfully.",
//           //   type: "success",
//           // });

//           await new Promise(resolve => setTimeout(resolve, 1500));


//           await checkProfileAndNavigate(
//             data.user.id,
//             cleanEmail,
//             fullName.trim(),
//             true
//           );
//         } else {
//           Alert.alert(
//             "Verify Email",
//             "Please check your email and verify your account before logging in."
//           );

//           setAuthMode("login");
//         }
//       }
//     } catch (err: any) {
//       console.error("[AUTH] Error:", err);

//       Alert.alert(
//         "Authentication Error",
//         err?.message || "Something went wrong. Please try again."
//       );
//     } finally {
//       // Unlock after request completely finishes
//       authInProgressRef.current = false;
//       setLoading(false);
//     }
//   };

//   // -------------------------------------
//   // Animations
//   // -------------------------------------
//   const characterBob = useSharedValue(0);
//   const buttonScale = useSharedValue(1);

//   useEffect(() => {
//     characterBob.value = withRepeat(
//       withSequence(
//         withTiming(-10, { duration: 1800 }),
//         withTiming(0, { duration: 1800 })
//       ),
//       -1,
//       true
//     );
//   }, []);

//   const characterAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ translateY: characterBob.value }],
//     };
//   });

//   const buttonAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//     };
//   });

//   const handlePressIn = () => { buttonScale.value = withSpring(0.96); };
//   const handlePressOut = () => { buttonScale.value = withSpring(1); };

//   // -------------------------------------
//   // Render
//   // -------------------------------------
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFDFD" }}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />

//       {/* Subtle Background Elements */}
//       <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
//         <View style={styles.bgCircleTop} />
//         <View style={styles.bgCircleBottom} />
//       </View>

//       {/* BACK BUTTON */}
//       <TouchableOpacity
//         onPress={() => { navigation.canGoBack() ? navigation.goBack() : navigation.replace("HomeDrawer"); }}
//         style={[styles.backBtn, { top: Math.max(insets.top, 10) }]}
//       >
//         <Ionicons name="arrow-back" size={24} color="#111" />
//       </TouchableOpacity>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={[
//             styles.scrollContainer,
//             isDesktop && { flexDirection: "row", alignItems: "center", justifyContent: "center" }
//           ]}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >

//           {/* DESKTOP RIGHT SIDE / MOBILE TOP: 3D Character */}
//           <View style={[isDesktop ? styles.desktopCharacterContainer : styles.mobileCharacterContainer]}>
//             <Animated.View style={characterAnimatedStyle}>
//               <Image
//                 source={require("../../assets/images/heroimg.png")}
//                 style={isDesktop ? styles.desktopCharacterImage : styles.mobileCharacterImage}
//                 contentFit="contain"
//               />
//             </Animated.View>
//           </View>

//           {/* FORM CONTAINER */}
//           <Animated.View
//             entering={FadeInUp.duration(600).delay(100)}
//             style={[styles.formContainer, isDesktop && styles.desktopFormContainer]}
//           >
//             <View style={styles.header}>
//               <Image source={NeatifyLogo} style={styles.logo} contentFit="contain" />
//               <Text style={styles.subtitle}>
//                 Welcome to The Neatify Team! Ready for a sparkling clean home?
//               </Text>
//             </View>

//             <View style={styles.form}>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400)}>
//                   <AnimatedInput
//                     icon={<User size={20} color="#888" />}
//                     placeholder="Full Name"
//                     value={fullName}
//                     onChange={setFullName}
//                     autoCapitalize="words"
//                   />
//                   <View style={{ height: 12 }} />
//                 </Animated.View>
//               )}

//               <Animated.View entering={FadeInDown.duration(400).delay(100)}>
//                 <AnimatedInput
//                   icon={<Mail size={20} color="#888" />}
//                   placeholder="Email Address"
//                   value={email}
//                   onChange={setEmail}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                 />
//               </Animated.View>

//               <View style={{ height: 12 }} />

//               <Animated.View entering={FadeInDown.duration(400).delay(200)}>
//                 <AnimatedInput
//                   icon={<Lock size={20} color="#888" />}
//                   placeholder="Password"
//                   value={password}
//                   onChange={setPassword}
//                   secureTextEntry={!showPassword}
//                   rightElement={
//                     <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
//                       <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
//                     </TouchableOpacity>
//                   }
//                 />
//                 {authMode === 'login' && (
//                   <TouchableOpacity
//                     style={{ alignSelf: "flex-end", marginTop: 8 }}
//                     onPress={() => navigation.navigate("ResetPassword")}
//                   >
//                     <Text style={{ color: COLORS.saffron, fontWeight: "600", fontSize: 13 }}>Forgot Password?</Text>
//                   </TouchableOpacity>
//                 )}
//               </Animated.View>

//               {authMode === 'signup' && (
//                 <Animated.View entering={FadeInDown.duration(400).delay(300)}>
//                   <View style={{ height: 12 }} />

//                   {/* Terms & Conditions Row */}
//                   {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8, paddingHorizontal: 4 }}>
//                     <TouchableOpacity
//                       onPress={() => {
//                         if (!termsViewed) {
//                           setShowTermsModal(true);
//                         } else {
//                           setTermsAccepted(!termsAccepted);
//                         }
//                       }}
//                       style={{ marginRight: 8, padding: 4 }}
//                     >
//                       <Ionicons
//                         name={termsAccepted ? "checkbox" : "square-outline"}
//                         size={24}
//                         color={termsAccepted ? COLORS.saffron : "#888"}
//                       />
//                     </TouchableOpacity>
//                     <Text style={{ fontSize: 13, color: "#111", flex: 1 }}>
//                       I agree to the{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowTermsModal(true)}>
//                         Terms
//                       </Text>
//                       {" "}and{" "}
//                       <Text style={{ color: COLORS.saffron, fontWeight: "700" }} onPress={() => setShowPrivacyModal(true)}>
//                         Privacy Policy
//                       </Text>
//                     </Text>
//                   </View> */}
//                 </Animated.View>
//               )}

//               <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleAuth} disabled={loading} style={{ marginTop: 20 }}>
//                 <Animated.View style={[styles.primaryBtn, buttonAnimatedStyle]}>
//                   {loading ? (
//                     <ActivityIndicator color="#111" />
//                   ) : (
//                     <Text style={styles.primaryText}>{authMode === 'login' ? 'Login' : 'Sign Up'}</Text>
//                   )}
//                 </Animated.View>
//               </Pressable>

//               {authMode === 'login' && (
//                 <>
//                   <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                     <Text style={{ marginHorizontal: 10, color: "#888", fontSize: 13, fontWeight: "600" }}>OR</Text>
//                     <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
//                   </View>

//                   <Pressable
//                     onPress={async () => {
//                       try {
//                         setLoading(true);
//                         const { signInWithGoogle } = await import('../auth/useGoogleAuth');
//                         const authResult = await signInWithGoogle();

//                         if (authResult && authResult.user) {
//                           await checkProfileAndNavigate(
//                             authResult.user.id,
//                             authResult.user.email || "",
//                             authResult.user.user_metadata?.full_name || "",
//                             authResult.isNewUser // This triggers your promotional banner!
//                           );
//                         }
//                       } catch (err: any) {
//                         showAlert({ type: "error", title: "Google Sign-In Failed", message: err.message });
//                       } finally {
//                         setLoading(false);
//                       }
//                     }}
//                     disabled={loading}
//                   >
//                     <View style={styles.googleBtn}>
//                       <Image
//                         source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
//                         style={{ width: 22, height: 22, marginRight: 10 }}
//                         contentFit="contain"
//                       />
//                       <Text style={styles.googleBtnText}>Continue with Google</Text>
//                     </View>
//                   </Pressable>
//                 </>
//               )}

//               <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
//                 <Text style={{ color: "#555", fontSize: 14 }}>
//                   {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
//                 </Text>
//                 <TouchableOpacity onPress={() => {
//                   setAuthMode(authMode === 'login' ? 'signup' : 'login');
//                 }}>
//                   <Text style={styles.linkText}>{authMode === 'login' ? 'Sign Up' : 'Login'}</Text>
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.policyFooter}>
//                 <Text style={styles.policyContinueText}>
//                   By continuing, you agree to our
//                 </Text>

//                 <View style={styles.policyLinksRow}>
//                   <TouchableOpacity onPress={() => setShowTermsModal(true)}>
//                     <Text style={styles.policyLink}>
//                       Terms & Conditions
//                     </Text>
//                   </TouchableOpacity>

//                   <Text style={styles.policySeparator}>|</Text>

//                   <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
//                     <Text style={styles.policyLink}>
//                       Privacy Policy
//                     </Text>
//                   </TouchableOpacity>
//                 </View>

//                 <Text style={styles.poweredByText}>
//                   Powered by The Neatify Services (OPC) Pvt. Ltd.
//                 </Text>
//               </View>

//             </View>
//           </Animated.View>

//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* PRIVACY POLICY MODAL */}
//       <TermsModal
//         visible={showTermsModal}
//         onClose={() => setShowTermsModal(false)}
//         onAccept={() => {
//           // setTermsViewed(true);
//           // setTermsAccepted(true);
//           setShowTermsModal(false);
//         }}
//       />
//       <PrivacyModal
//         visible={showPrivacyModal}
//         onClose={() => setShowPrivacyModal(false)}
//         onAccept={() => {
//           setShowPrivacyModal(false);
//         }}
//       />

//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   bgCircleTop: {
//     position: "absolute",
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: COLORS.saffron + "15",
//     top: -100,
//     right: -100,
//   },
//   bgCircleBottom: {
//     position: "absolute",
//     width: 400,
//     height: 400,
//     borderRadius: 200,
//     backgroundColor: COLORS.saffron + "10",
//     bottom: -150,
//     left: -150,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: "5%",
//     paddingTop: 30,
//     paddingBottom: 40
//   },
//   backBtn: {
//     position: "absolute",
//     left: 16,
//     zIndex: 100,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFF",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   mobileCharacterContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: -45, // Deeper overlap to place character behind card
//     marginTop: 10,
//     zIndex: 1,
//   },
//   desktopCharacterContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 40,
//   },
//   mobileCharacterImage: {
//     width: 180, // Scaled down
//     height: 160,
//   },
//   desktopCharacterImage: {
//     width: "100%",
//     height: 500,
//     maxWidth: 450,
//   },
//   formContainer: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24, // reduced corners slightly
//     padding: 20, // reduced internal padding
//     paddingTop: 24, // Card top spacing
//     paddingBottom: 28,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.08,
//     shadowRadius: 24,
//     elevation: 8,
//     zIndex: 2,
//   },
//   desktopFormContainer: {
//     flex: 1,
//     maxWidth: 500,
//     marginVertical: 40,
//   },
//   header: {
//     marginBottom: 20,
//     alignItems: "center", // Center horizontally
//   },
//   logo: {
//     width: 130, // Smaller branding
//     height: 38,
//     marginBottom: 16, // Spacing between logo and heading
//   },
//   subtitle: {
//     color: "#111", // Black/dark text
//     fontSize: 16,
//     fontFamily: Platform.OS === 'android' ? 'sans-serif-rounded' : 'Arial Rounded MT Bold',
//     fontWeight: Platform.OS === 'android' ? 'normal' : '700',
//     lineHeight: 22,
//     textAlign: "center",
//     paddingHorizontal: 8,
//   },
//   form: {
//     gap: 12, // reduced gaps
//   },
//   animatedInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1.5,
//     borderColor: "#F0F0F0", // subtle grey
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14, // slightly rounder
//     paddingVertical: 12, // shorter height
//     paddingHorizontal: 14,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     marginLeft: 12,
//     color: "#111",
//     fontWeight: "500",
//   },
//   primaryBtn: {
//     backgroundColor: COLORS.saffron,
//     height: 52, // Shorter height
//     borderRadius: 14, // match input border radius
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 4,
//     shadowColor: COLORS.saffron,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2, // subtle shadow
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   primaryText: {
//     color: "#111",
//     fontWeight: "800",
//     fontSize: 15,
//     letterSpacing: 0.5,
//   },
//   googleBtn: {
//     backgroundColor: "#FFFFFF",
//     height: 52,
//     borderRadius: 14,
//     borderWidth: 1.5,
//     borderColor: "#E5E5E5",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   googleBtnText: {
//     color: "#333",
//     fontWeight: "700",
//     fontSize: 15,
//   },
//   //   linkText: {
//   //     fontWeight: "800",
//   //     color: COLORS.saffron,
//   //     fontSize: 14,
//   //   },
//   // });


//   linkText: {
//     fontWeight: "800",
//     color: COLORS.saffron,
//     fontSize: 14,
//   },

//   policyFooter: {
//     alignItems: "center",
//     marginTop: 24,
//     paddingHorizontal: 10,
//     paddingBottom: 10,
//   },

//   policyContinueText: {
//     fontSize: 14,
//     color: "#777",
//     textAlign: "center",
//     marginBottom: 4,
//   },

//   policyLinksRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   policyLink: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#222",
//     textDecorationLine: "underline",
//   },

//   policySeparator: {
//     fontSize: 15,
//     color: "#999",
//     marginHorizontal: 10,
//   },

//   poweredByText: {
//     fontSize: 13,
//     color: "#999",
//     textAlign: "center",
//     marginTop: 28,
//   },
// });




















import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { KeyRound, Phone } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import NeatifyLogo from "../../assets/images/neatifylogo.png";
import PrivacyModal from "../components/PrivacyModal";
import TermsModal from "../components/TermsModal";
import { useNotification } from "../hooks/useNotification";
import { supabase } from "../lib/supabase";
import { COLORS } from "../theme/colors";

// Animated Input Component
function AnimatedInput({ icon, placeholder, value, onChange, secureTextEntry, rightElement, keyboardType, maxLength, autoCapitalize }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(focusAnim.value, [0, 1], ["#F0F0F0", COLORS.saffron]),
      shadowOpacity: focusAnim.value * 0.1,
      shadowRadius: focusAnim.value * 6,
      shadowColor: COLORS.saffron,
      shadowOffset: { width: 0, height: 3 },
      elevation: focusAnim.value * 3,
      transform: [{ scale: 1 + focusAnim.value * 0.01 }]
    };
  });

  return (
    <Animated.View style={[styles.animatedInputContainer, animatedStyle]}>
      {icon}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
      {rightElement}
    </Animated.View>
  );
}

export default function LoginScreen(props: any) {
  const navigation = useNavigation<any>();
  const { showAlert, showToast } = useNotification();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const authInProgressRef = useRef(false);

  // 1. Profile Routing & Creation (Native)
  const checkProfileAndNavigate = async (userId: string, userPhone: string) => {
    try {
      // 1. Check if the user already exists in the profile table
      const { data: profile, error: fetchError } = await supabase
        .from("profile")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (profile) {
        // 2. EXISTING USER: Profile found, route directly to Home
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
        }, 100);
      } else {
        // 3. NEW USER: No profile found, route to Complete Profile Screen
        // We pass the userId and userPhone as route parameters
        navigation.navigate("CompleteProfile", {
          userId: userId,
          userPhone: userPhone
        });
      }

    } catch (err: any) {
      console.error("[AUTH] Profile Check Error:", err);
      Alert.alert("Profile Error", err.message);
    }
  };

  // 2. Send OTP (Triggers the Hook)
  const handleSendOTP = async () => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (authInProgressRef.current) return;
    authInProgressRef.current = true;
    setLoading(true);

    try {
      const formattedPhone = `+91${cleanNumber}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      showToast("OTP Sent Successfully!");
      setOtpSent(true);

    } catch (err: any) {
      console.error("[AUTH] Send OTP Error:", err);
      Alert.alert("Error Sending OTP", err.message);
    } finally {
      setLoading(false);
      authInProgressRef.current = false;
    }
  };

  // 3. Verify OTP (Native Validation)
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter the OTP sent to your phone.");
      return;
    }

    if (authInProgressRef.current) return;
    authInProgressRef.current = true;
    setLoading(true);

    try {
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `+91${cleanNumber}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;

      if (data.session && data.user) {
        // 1. Immediately check the profile table using the MOBILE NUMBER
        const { data: profile, error: profileError } = await supabase
          .from("profile")
          .select("*")
          .eq("phone", cleanNumber) // Searching specifically by the phone column
          .maybeSingle();

        if (profileError) throw profileError;

        // 2. Route based on whether the profile row exists
        if (profile && profile.full_name) {
          // EXISTING USER: We found their row and name. Route directly to Home.
          navigation.reset({ index: 0, routes: [{ name: "HomeDrawer" }] });
        } else {
          // NEW USER: No row found with this phone number. Route to Complete Profile.
          navigation.navigate("CompleteProfile", { 
            userId: data.user.id, 
            userPhone: cleanNumber 
          });
        }
      } else {
        throw new Error("Failed to establish secure session.");
      }

    } catch (err: any) {
      console.error("[AUTH] Verify OTP Error:", err);
      Alert.alert("Verification Failed", err.message);
    } finally {
      // The crucial finally block to prevent infinite loading in production APKs
      setLoading(false);
      authInProgressRef.current = false;
    }
  };
  // Animations
  const characterBob = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    characterBob.value = withRepeat(
      withSequence(withTiming(-10, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1,
      true
    );
  }, []);

  const characterAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: characterBob.value }] }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const handlePressIn = () => { buttonScale.value = withSpring(0.96); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFDFD" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.bgCircleTop} />
        <View style={styles.bgCircleBottom} />
      </View>

      <TouchableOpacity
        onPress={() => {
          if (otpSent) {
            setOtpSent(false);
            setOtp("");
          } else {
            navigation.canGoBack() ? navigation.goBack() : navigation.replace("HomeDrawer");
          }
        }}
        style={[styles.backBtn, { top: Math.max(insets.top, 10) }]}
      >
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, isDesktop && { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[isDesktop ? styles.desktopCharacterContainer : styles.mobileCharacterContainer]}>
            <Animated.View style={characterAnimatedStyle}>
              <Image source={require("../../assets/images/heroimg.png")} style={isDesktop ? styles.desktopCharacterImage : styles.mobileCharacterImage} contentFit="contain" />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.duration(600).delay(100)} style={[styles.formContainer, isDesktop && styles.desktopFormContainer]}>
            <View style={styles.header}>
              <Image source={NeatifyLogo} style={styles.logo} contentFit="contain" />
              <Text style={styles.subtitle}>Welcome to The Neatify Team! Ready for a sparkling clean home?</Text>
            </View>

            <View style={styles.form}>
              {!otpSent ? (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <AnimatedInput
                    icon={<Phone size={20} color="#888" />}
                    placeholder="Mobile Number (e.g. 9876543210)"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Text style={{ textAlign: 'center', marginBottom: 10, color: '#555' }}>
                    OTP sent to +91 {phoneNumber}
                  </Text>
                  <AnimatedInput
                    icon={<KeyRound size={20} color="#888" />}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </Animated.View>
              )}

              <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={!otpSent ? handleSendOTP : handleVerifyOTP} disabled={loading} style={{ marginTop: 20 }}>
                <Animated.View style={[styles.primaryBtn, buttonAnimatedStyle]}>
                  {loading ? (
                    <ActivityIndicator color="#111" />
                  ) : (
                    <Text style={styles.primaryText}>{!otpSent ? 'Send OTP' : 'Verify & Login'}</Text>
                  )}
                </Animated.View>
              </Pressable>

              {!otpSent && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
                    <Text style={{ marginHorizontal: 10, color: "#888", fontSize: 13, fontWeight: "600" }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: "#E5E5E5" }} />
                  </View>

                  <Pressable onPress={async () => {
                    try {
                      setLoading(true);
                      const { signInWithGoogle } = await import('../auth/useGoogleAuth');
                      const authResult = await signInWithGoogle();
                      if (authResult && authResult.user) {
                        // Pass empty string for phone if they use google
                        await checkProfileAndNavigate(authResult.user.id, "");
                      }
                    } catch (err: any) {
                      showAlert({ type: "error", title: "Google Sign-In Failed", message: err.message });
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    <View style={styles.googleBtn}>
                      <Image source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} style={{ width: 22, height: 22, marginRight: 10 }} contentFit="contain" />
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </View>
                  </Pressable>
                </>
              )}

              <View style={styles.policyFooter}>
                <Text style={styles.policyContinueText}>By continuing, you agree to our</Text>
                <View style={styles.policyLinksRow}>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}><Text style={styles.policyLink}>Terms & Conditions</Text></TouchableOpacity>
                  <Text style={styles.policySeparator}>|</Text>
                  <TouchableOpacity onPress={() => setShowPrivacyModal(true)}><Text style={styles.policyLink}>Privacy Policy</Text></TouchableOpacity>
                </View>
              </View>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bgCircleTop: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: COLORS.saffron + "15", top: -100, right: -100 },
  bgCircleBottom: { position: "absolute", width: 400, height: 400, borderRadius: 200, backgroundColor: COLORS.saffron + "10", bottom: -150, left: -150 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: "5%", paddingTop: 30, paddingBottom: 40 },
  backBtn: { position: "absolute", left: 16, zIndex: 100, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  mobileCharacterContainer: { alignItems: "center", justifyContent: "center", marginBottom: -45, marginTop: 10, zIndex: 1 },
  desktopCharacterContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  mobileCharacterImage: { width: 180, height: 160 },
  desktopCharacterImage: { width: "100%", height: 500, maxWidth: 450 },
  formContainer: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, paddingTop: 24, paddingBottom: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8, zIndex: 2 },
  desktopFormContainer: { flex: 1, maxWidth: 500, marginVertical: 40 },
  header: { marginBottom: 20, alignItems: "center" },
  logo: { width: 130, height: 38, marginBottom: 16 },
  subtitle: { color: "#111", fontSize: 16, fontFamily: Platform.OS === 'android' ? 'sans-serif-rounded' : 'Arial Rounded MT Bold', fontWeight: Platform.OS === 'android' ? 'normal' : '700', lineHeight: 22, textAlign: "center", paddingHorizontal: 8 },
  form: { gap: 12 },
  animatedInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#F0F0F0", backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, marginLeft: 12, color: "#111", fontWeight: "500" },
  primaryBtn: { backgroundColor: COLORS.saffron, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4, shadowColor: COLORS.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryText: { color: "#111", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  googleBtn: { backgroundColor: "#FFFFFF", height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E5E5", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  googleBtnText: { color: "#333", fontWeight: "700", fontSize: 15 },
  policyFooter: { alignItems: "center", marginTop: 24, paddingHorizontal: 10, paddingBottom: 10 },
  policyContinueText: { fontSize: 14, color: "#777", textAlign: "center", marginBottom: 4 },
  policyLinksRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  policyLink: { fontSize: 15, fontWeight: "700", color: "#222", textDecorationLine: "underline" },
  policySeparator: { fontSize: 15, color: "#999", marginHorizontal: 10 },
  poweredByText: { fontSize: 13, color: "#999", textAlign: "center", marginTop: 28 },
});