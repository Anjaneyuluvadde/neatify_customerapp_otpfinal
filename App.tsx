// import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
// import * as Linking from "expo-linking";
// import React, { useEffect, useState } from "react";
// import { StatusBar, StyleSheet } from "react-native";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import { LanguageProvider } from "./src/context/LanguageContext";
// import { NotificationProvider } from "./src/context/NotificationContext";
// import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import { supabase } from "./src/lib/supabase";
// import AppNavigator from "./src/navigation/AppNavigator";
// import * as Notifications from 'expo-notifications';
// import { registerForPushNotificationsAsync, savePushTokenToSupabase } from "./src/utils/pushNotifications";
// import RNRestart from "react-native-restart";
// import { BookingCartProvider } from "./src/context/BookingCartContext";

// import { GestureHandlerRootView } from "react-native-gesture-handler";

// export default function App() {
//   const [initialRoute, setInitialRoute] = useState<"LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile">("HomeDrawer");
//   const [loading, setLoading] = useState(true);
//   const navigationRef = React.useRef<any>(null);
//   const skipAuthRedirect = React.useRef(false);

//   const handlePushToken = async (userId: string) => {
//     try {
//       const token = await registerForPushNotificationsAsync();
//       if (token) {
//         await savePushTokenToSupabase(userId, token);
//       }
//     } catch (err) {
//       console.error("Push token registration failed:", err);
//     }
//   };

//   useEffect(() => {
//     // Flag to prevent re-triggering on token refreshes
//     let hasCheckedOnce = false;

//     // Helper: check DB + Auth completeness
//     // Returns false and redirects if profile is incomplete
//     // useNav=true  → reset live navigation (post-mount, e.g. deep links)
//     // useNav=false → return result so caller can set initialRoute before mount
//     const checkCompleteness = async (userId: string, useNav = true): Promise<boolean> => {
//       console.log("[AUTH DEBUG] checkCompleteness START for user:", userId);
//       if (!userId) {
//         console.log("[AUTH DEBUG] No userId, returning true");
//         return true;
//       }

//       const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
//         return Promise.race([
//           Promise.resolve(promise),
//           new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms))
//         ]);
//       };

//       try {
//         console.log("[AUTH DEBUG] supabase.auth.getUser() START");
//         const { data: { user }, error: userError } = await withTimeout<any>(
//           supabase.auth.getUser(),
//           8000,
//           "supabase.auth.getUser"
//         );
//         console.log("[AUTH DEBUG] supabase.auth.getUser() RESULT", { hasUser: !!user, hasError: !!userError });

//         if (userError || !user) {
//           if (userError?.message?.includes("Refresh Token") || userError?.status === 401) {
//             console.log("[AUTH DEBUG] Session invalid, signing out START");
//             await supabase.auth.signOut();
//             console.log("[AUTH DEBUG] Session invalid, signing out RESULT");
//           }
//           console.log("[AUTH DEBUG] Returning true due to userError/no user");
//           return true;
//         }

//         console.log("[AUTH DEBUG] profile query START");
//         console.log("[App Startup] Fetching user profile");
//         const { data: profile } = await withTimeout<any>(
//           supabase.from("profile").select("full_name, phone").eq("id", userId).maybeSingle(),
//           8000,
//           "profile query"
//         );
//         console.log("[AUTH DEBUG] profile query RESULT", profile);
//         console.log("[App Startup] User profile fetched successfully");

//         if (profile && profile.full_name && profile.full_name.trim().length > 0) {
//           console.log("[AUTH DEBUG] Profile complete, returning true");
//           return true;
//         }

//         if (useNav) {
//           const rawPhone = profile?.phone || user.phone || user.user_metadata?.phone_number || "";
//           const digits = rawPhone.replace(/\D/g, "").slice(-10);
//           console.log("[AUTH DEBUG] Incomplete profile detected! Navigating to CompleteProfile screen...");
//           navigationRef.current?.reset({
//             index: 0,
//             routes: [
//               {
//                 name: "CompleteProfile",
//                 params: { initialData: { phone: digits } }
//               }
//             ],
//           });
//         }
//         console.log("[AUTH DEBUG] checkCompleteness END returning false");
//         return false;
//       } catch (err) {
//         console.error("[AUTH DEBUG] checkCompleteness catch error:", err);
//         return true;
//       }
//     };

//     // 1. Initial Launch Check (cold start / app kill recovery)
//     const initApp = async () => {
//       try {
//         console.log("[App Startup] Initializing auth");
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();

//         if (sessionError) {
//           if (sessionError.message?.includes("Refresh Token") || sessionError.status === 400) {
//             console.warn("Broken session detected on init. Clearing...");
//             await supabase.auth.signOut();
//             setInitialRoute("LocationAccess");
//             setLoading(false);
//             return;
//           }
//           throw sessionError;
//         }

//         if (session?.user) {
//           console.log("[App Startup] Existing Supabase session found");
//           console.log(`[App Startup] User ID: ${session.user.id}`);
//           handlePushToken(session.user.id);
//           hasCheckedOnce = true;
//         }

//         setInitialRoute("LocationAccess");
//       } catch (err) {
//         console.error("App init failed:", err);
//         setInitialRoute("LocationAccess");
//       } finally {
//         setLoading(false);
//       }
//     };
//     initApp();

//     // 2. Auth state changes — check completeness before navigating to HomeDrawer
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         console.log("🌐 [App Debug] onAuthStateChange event:", event, "session user:", session?.user?.id);
//         if (event === "SIGNED_OUT") {
//           skipAuthRedirect.current = false;
//           hasCheckedOnce = false;
//           return;
//         }
//         if (skipAuthRedirect.current && event === "SIGNED_IN") {
//           console.log("Skipping auth redirect (password reset in progress)");
//           return;
//         }
//         if (event === "SIGNED_IN" && session?.user && !hasCheckedOnce) {
//           hasCheckedOnce = true;
//           handlePushToken(session.user.id);
//           setTimeout(async () => {
//             console.log("🌐 [App Debug] Checking profile completeness for SIGNED_IN user...");
//             const isComplete = await checkCompleteness(session.user.id, true);
//             if (isComplete) {
//               console.log("🌐 [App Debug] Profile complete -> Navigating to HomeDrawer");
//               console.log("[App Startup] Navigating to Home/Profile");
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [{ name: "HomeDrawer" }],
//               });
//             }
//           }, 300);
//         }
//       }
//     );

//     // 3. Deep link handler
//     const handleDeepLink = async ({ url }: { url: string }) => {
//       if (!url) return;
//       console.log("Deep link received:", url);

//       if (url.includes("google-auth")) {
//         const fragment = url.split("#")[1];
//         if (fragment) {
//           const params = new URLSearchParams(fragment);
//           const accessToken = params.get("access_token");
//           const refreshToken = params.get("refresh_token");
//           if (accessToken && refreshToken) {
//             console.log("[Google Auth] Starting Google login");
//             hasCheckedOnce = false;

//             // Check if we already restarted for this session to prevent infinite loop
//             const hasRestarted = await AsyncStorage.getItem("google_auth_restarted");

//             console.log("[Google Auth] Authentication successful");

//             // setSession automatically triggers onAuthStateChange("SIGNED_IN")
//             // which will handle handlePushToken, checkCompleteness, and navigation
//             const { data, error } = await supabase.auth.setSession({
//               access_token: accessToken,
//               refresh_token: refreshToken,
//             });

//             if (!error && data?.session) {
//               console.log("[Google Auth] Supabase session created");
//               console.log(`[Google Auth] User ID: ${data.session.user.id}`);

//               if (hasRestarted !== "true") {
//                 console.log("[Google Auth] Preparing temporary app restart");
//                 await AsyncStorage.setItem("google_auth_restarted", "true");
//                 console.log("[Google Auth] Restarting app");

//                 // Set flag to skip normal auth redirect since we are restarting
//                 skipAuthRedirect.current = true;

//                 setTimeout(() => {
//                   try {
//                     RNRestart.restart();
//                   } catch (err) {
//                     console.error("Failed to restart app", err);
//                   }
//                 }, 1000);

//                 return; // Stop further processing in this handler
//               } else {
//                 // Clear the flag so future logins work normally
//                 await AsyncStorage.removeItem("google_auth_restarted");
//               }
//             }
//           }
//         }
//       } else if (url.includes("reset-password") || url.includes("type=recovery")) {
//         // Set flag to prevent onAuthStateChange from redirecting to Home
//         skipAuthRedirect.current = true;

//         // Supabase tokens can be in the fragment (#) or query (?)
//         const searchPart = url.includes("#") ? url.split("#")[1] : url.split("?")[1];

//         if (searchPart) {
//           const params = new URLSearchParams(searchPart);
//           const accessToken = params.get("access_token");
//           const refreshToken = params.get("refresh_token");

//           if (accessToken && refreshToken) {
//             console.log("✅ Reset tokens detected. Navigating to ResetPassword...");

//             // Add a small delay for navigation to ensure navigationRef is ready
//             setTimeout(() => {
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "ResetPassword",
//                     params: {
//                       access_token: accessToken,
//                       refresh_token: refreshToken,
//                     },
//                   },
//                 ],
//               });
//             }, 800);
//           }
//         }
//       }
//     };

//     // Check for initial URL (Cold Start)
//     Linking.getInitialURL().then((url) => {
//       if (url) handleDeepLink({ url });
//     });

//     const subscription = Linking.addEventListener("url", handleDeepLink);

//     // Listen for notification taps to handle navigation
//     const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
//       const data = response.notification.request.content.data;
//       if (data?.screen === 'bookings') {
//         navigationRef.current?.navigate('HomeDrawer', {
//           screen: 'AuthenticatedScreens',
//           params: {
//             screen: 'MainTabs',
//             params: { screen: 'MyBookingsTab' }
//           }
//         });
//       }
//     });

//     return () => {
//       listener.subscription.unsubscribe();
//       subscription.remove();
//       notificationResponseSubscription.remove();
//     };
//   }, []);



//   const linking: any = {
//     prefixes: [
//       Linking.createURL("/"),
//       "neatifynation://",
//       "theneatifyteam://",
//       "https://www.theneatifyteam.in",
//       "https://theneatifyteam.in"
//     ],
//     config: {
//       screens: {
//         HomeDrawer: {
//           screens: {
//             AuthenticatedScreens: {
//               screens: {
//                 MainTabs: {
//                   screens: {
//                     HomeTab: {
//                       screens: {
//                         ServiceDetail: "service/:serviceId",
//                         HomeMain: "*"
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//     },
//     // Handle unmatched URLs gracefully
//     async getInitialURL() {
//       const url = await Linking.getInitialURL();
//       if (url) {
//         console.log("Deep link opened app:", url);
//         console.log("Parsing serviceId from URL:", url.match(/service\/([^/?]+)/)?.[1]);
//       }
//       return url;
//     },
//     subscribe(listener: (url: string) => void) {
//       const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
//         console.log("Deep link received:", url);
//         const serviceIdMatch = url.match(/service\/([^/?]+)/);
//         if (serviceIdMatch) {
//           console.log("Extracted serviceId:", serviceIdMatch[1]);
//         } else {
//           console.log("Deep link: No serviceId found, will navigate to Home");
//         }
//         listener(url);
//       });

//       return () => {
//         linkingSubscription.remove();
//       };
//     },
//   };


//   if (loading) return null;

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaProvider>
//         <ThemeProvider>
//           <LanguageProvider>
//             <NotificationProvider>
//               <BookingCartProvider>
//                 <ThemedAppContent
//                   linking={linking}
//                   navigationRef={navigationRef}
//                   initialRoute={initialRoute}
//                 />
//               </BookingCartProvider>
//             </NotificationProvider>
//           </LanguageProvider>
//         </ThemeProvider>
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

// function ThemedAppContent({ linking, navigationRef, initialRoute }: any) {
//   const { theme, isDark } = useTheme();

//   const navTheme = {
//     ...(isDark ? DarkTheme : DefaultTheme),
//     colors: {
//       ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
//       background: theme.background,
//       card: theme.background,
//       text: theme.text,
//       border: theme.border,
//       notification: theme.primary,
//     },
//   };

//   return (
//     <>
//       <StatusBar
//         barStyle={isDark ? "light-content" : "dark-content"}
//         backgroundColor={theme.background}
//       />
//       <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme}>
//         <AppNavigator initialRouteName={initialRoute} />
//       </NavigationContainer>
//     </>
//   );
// }

// // Force rebuild 1


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });













// import {
//   DarkTheme,
//   DefaultTheme,
//   NavigationContainer,
// } from "@react-navigation/native";
// import * as Linking from "expo-linking";
// import React, { useEffect, useState } from "react";
// import { StatusBar, StyleSheet } from "react-native";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// import * as Notifications from "expo-notifications";
// import { BookingCartProvider } from "./src/context/BookingCartContext";
// import { LanguageProvider } from "./src/context/LanguageContext";
// import { NotificationProvider } from "./src/context/NotificationContext";
// import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import { supabase } from "./src/lib/supabase";
// import AppNavigator from "./src/navigation/AppNavigator";
// import {
//   registerForPushNotificationsAsync,
//   savePushTokenToSupabase,
// } from "./src/utils/pushNotifications";

// import { GestureHandlerRootView } from "react-native-gesture-handler";

// export default function App() {
//   const [initialRoute, setInitialRoute] = useState<
//     "LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile"
//   >("HomeDrawer");

//   const [loading, setLoading] = useState(true);

//   const navigationRef = React.useRef<any>(null);

//   // Used for password recovery flow.
//   // It prevents the normal SIGNED_IN handler from navigating
//   // to Home while password reset is being processed.
//   const skipAuthRedirect = React.useRef(false);

//   /**
//    * Register push notification token for the authenticated user.
//    * This is intentionally not awaited by the auth navigation flow.
//    */
//   const handlePushToken = async (userId: string) => {
//     try {
//       if (!userId) return;

//       const token = await registerForPushNotificationsAsync();

//       if (token) {
//         await savePushTokenToSupabase(userId, token);
//       }
//     } catch (err) {
//       console.error("Push token registration failed:", err);
//     }
//   };

//   useEffect(() => {
//     // Prevent multiple SIGNED_IN events from processing
//     // the same authentication session.
//     let hasCheckedOnce = false;

//     /**
//      * Check whether the user's profile is complete.
//      *
//      * IMPORTANT:
//      * We intentionally DO NOT call:
//      *
//      *     supabase.auth.getUser()
//      *
//      * here.
//      *
//      * During the Google OAuth callback, setSession() already gives us
//      * the authenticated user ID. Calling getUser() immediately inside
//      * the SIGNED_IN flow can cause an auth-lock/re-entrancy problem
//      * in React Native.
//      */
//     const checkCompleteness = async (
//       userId: string,
//       useNav = true
//     ): Promise<boolean> => {
//       console.log(
//         "[AUTH DEBUG] checkCompleteness START for user:",
//         userId
//       );

//       if (!userId) {
//         console.log("[AUTH DEBUG] No userId");
//         return false;
//       }

//       try {
//         /**
//          * IMPORTANT:
//          * Directly query the profile table using the user ID
//          * that came from the authenticated session.
//          */
//         console.log("[AUTH DEBUG] profile query START");

//         const { data: profile, error: profileError } = await supabase
//           .from("profile")
//           .select("full_name, phone")
//           .eq("id", userId)
//           .maybeSingle();

//         console.log("[AUTH DEBUG] profile query RESULT:", {
//           hasProfile: !!profile,
//           hasError: !!profileError,
//           error: profileError?.message,
//         });

//         if (profileError) {
//           console.error(
//             "[AUTH DEBUG] Profile query failed:",
//             profileError
//           );

//           // IMPORTANT:
//           // Do NOT return true when the query fails.
//           // The previous code was masking failures here.
//           return false;
//         }

//         /**
//          * Profile exists and has a name.
//          * Consider the profile complete.
//          */
//         if (
//           profile &&
//           profile.full_name &&
//           profile.full_name.trim().length > 0
//         ) {
//           console.log(
//             "[AUTH DEBUG] Profile COMPLETE"
//           );

//           return true;
//         }

//         /**
//          * Profile doesn't exist or is incomplete.
//          */
//         if (useNav) {
//           const rawPhone = profile?.phone || "";

//           const digits = rawPhone
//             .replace(/\D/g, "")
//             .slice(-10);

//           console.log(
//             "[AUTH DEBUG] Profile INCOMPLETE -> CompleteProfile"
//           );

//           navigationRef.current?.reset({
//             index: 0,
//             routes: [
//               {
//                 name: "CompleteProfile",
//                 params: {
//                   initialData: {
//                     phone: digits,
//                   },
//                 },
//               },
//             ],
//           });
//         }

//         console.log(
//           "[AUTH DEBUG] checkCompleteness END -> false"
//         );

//         return false;
//       } catch (err) {
//         console.error(
//           "[AUTH DEBUG] checkCompleteness ERROR:",
//           err
//         );

//         /**
//          * IMPORTANT:
//          *
//          * If profile checking fails, don't pretend that
//          * the profile is complete.
//          */
//         return false;
//       }
//     };

//     /**
//      * ============================================================
//      * 1. INITIAL APP LAUNCH
//      * ============================================================
//      *
//      * This handles:
//      *
//      * - Normal app startup
//      * - Existing Supabase session
//      * - App killed and opened again
//      */
//     const initApp = async () => {
//       try {
//         console.log("[App Startup] Initializing auth");

//         const {
//           data: { session },
//           error: sessionError,
//         } = await supabase.auth.getSession();

//         if (sessionError) {
//           if (
//             sessionError.message?.includes("Refresh Token") ||
//             sessionError.status === 400
//           ) {
//             console.warn(
//               "[App Startup] Broken session detected. Clearing..."
//             );

//             await supabase.auth.signOut();

//             setInitialRoute("LocationAccess");
//             setLoading(false);

//             return;
//           }

//           throw sessionError;
//         }

//         if (session?.user) {
//           console.log(
//             "[App Startup] Existing Supabase session found"
//           );

//           console.log(
//             `[App Startup] User ID: ${session.user.id}`
//           );

//           // Push token registration is independent of navigation.
//           handlePushToken(session.user.id);

//           /**
//            * Existing session is already restored.
//            *
//            * We don't want the SIGNED_IN handler to run again
//            * for this startup session.
//            */
//           hasCheckedOnce = true;
//         }

//         /**
//          * Keep your existing application startup behavior.
//          */
//         setInitialRoute("LocationAccess");
//       } catch (err) {
//         console.error(
//           "[App Startup] Initialization failed:",
//           err
//         );

//         setInitialRoute("LocationAccess");
//       } finally {
//         setLoading(false);
//       }
//     };

//     initApp();

//     /**
//      * ============================================================
//      * 2. SUPABASE AUTH STATE LISTENER
//      * ============================================================
//      *
//      * Google flow:
//      *
//      * Google
//      *   ↓
//      * Deep link
//      *   ↓
//      * setSession()
//      *   ↓
//      * SIGNED_IN
//      *   ↓
//      * session.user.id
//      *   ↓
//      * profile query
//      *   ↓
//      * HomeDrawer / CompleteProfile
//      *
//      * IMPORTANT:
//      * We NEVER call supabase.auth.getUser() here.
//      */
//     const {
//       data: { subscription: authSubscription },
//     } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         console.log(
//           "🌐 [App Debug] onAuthStateChange:",
//           event,
//           "session user:",
//           session?.user?.id
//         );

//         /**
//          * --------------------------------------------------------
//          * SIGNED OUT
//          * --------------------------------------------------------
//          */
//         if (event === "SIGNED_OUT") {
//           skipAuthRedirect.current = false;
//           hasCheckedOnce = false;

//           console.log(
//             "[AUTH] User signed out"
//           );

//           return;
//         }

//         /**
//          * --------------------------------------------------------
//          * PASSWORD RESET
//          * --------------------------------------------------------
//          *
//          * Don't navigate to Home while reset-password
//          * flow is active.
//          */
//         if (
//           skipAuthRedirect.current &&
//           event === "SIGNED_IN"
//         ) {
//           console.log(
//             "[AUTH] Skipping SIGNED_IN redirect because password reset is active"
//           );

//           return;
//         }

//         /**
//          * --------------------------------------------------------
//          * SIGNED IN
//          * --------------------------------------------------------
//          */
//         if (
//           event === "SIGNED_IN" &&
//           session?.user &&
//           !hasCheckedOnce
//         ) {
//           hasCheckedOnce = true;

//           /**
//            * IMPORTANT:
//            *
//            * Use the user directly from the session.
//            *
//            * DO NOT:
//            *
//            *     await supabase.auth.getUser()
//            *
//            * here.
//            */
//           const user = session.user;

//           console.log(
//             "[AUTH] SIGNED_IN user:",
//             user.id
//           );

//           // Push notification registration does not block auth.
//           handlePushToken(user.id);

//           /**
//            * Small delay allows React Navigation to finish
//            * mounting before reset() is called.
//            *
//            * This is NOT an auth retry.
//            */
//           setTimeout(async () => {
//             console.log(
//               "[AUTH] Checking profile for authenticated user..."
//             );

//             const isComplete =
//               await checkCompleteness(
//                 user.id,
//                 true
//               );

//             if (isComplete) {
//               console.log(
//                 "[AUTH] Profile COMPLETE -> HomeDrawer"
//               );

//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "HomeDrawer",
//                   },
//                 ],
//               });
//             } else {
//               console.log(
//                 "[AUTH] Profile incomplete or profile check failed"
//               );
//             }
//           }, 0);
//         }
//       }
//     );

//     /**
//      * ============================================================
//      * 3. DEEP LINK HANDLER
//      * ============================================================
//      *
//      * Handles:
//      *
//      * - Google authentication
//      * - Password reset
//      */
//     const handleDeepLink = async ({
//       url,
//     }: {
//       url: string;
//     }) => {
//       if (!url) return;

//       /**
//        * SECURITY:
//        *
//        * Don't print the complete URL because Google/Supabase
//        * authentication tokens can be present in the URL fragment.
//        */
//       console.log(
//         "[Deep Link] Authentication/deep link received"
//       );

//       /**
//        * ========================================================
//        * GOOGLE AUTH
//        * ========================================================
//        */
//       if (url.includes("google-auth")) {
//         const fragment = url.split("#")[1];

//         if (!fragment) {
//           console.log(
//             "[Google Auth] No authentication fragment found"
//           );

//           return;
//         }

//         const params = new URLSearchParams(
//           fragment
//         );

//         const accessToken =
//           params.get("access_token");

//         const refreshToken =
//           params.get("refresh_token");

//         if (!accessToken || !refreshToken) {
//           console.log(
//             "[Google Auth] Missing authentication tokens"
//           );

//           return;
//         }

//         console.log(
//           "[Google Auth] Starting Supabase session creation"
//         );

//         /**
//          * IMPORTANT:
//          *
//          * Do NOT reset hasCheckedOnce here.
//          *
//          * The previous code did:
//          *
//          *     hasCheckedOnce = false;
//          *
//          * which could cause duplicate SIGNED_IN processing.
//          */

//         /**
//          * Create Supabase session from Google OAuth tokens.
//          *
//          * setSession() automatically triggers:
//          *
//          *     onAuthStateChange("SIGNED_IN")
//          *
//          * The auth listener above handles profile checking.
//          */
//         const {
//           data,
//           error,
//         } = await supabase.auth.setSession({
//           access_token: accessToken,
//           refresh_token: refreshToken,
//         });

//         if (error) {
//           console.error(
//             "[Google Auth] setSession ERROR:",
//             error.message
//           );

//           return;
//         }

//         if (!data?.session?.user) {
//           console.error(
//             "[Google Auth] Session/user missing after setSession"
//           );

//           return;
//         }

//         /**
//          * Authentication was successful.
//          *
//          * We already have the user here.
//          */
//         const user = data.session.user;

//         console.log(
//           "[Google Auth] Supabase session created successfully"
//         );

//         console.log(
//           "[Google Auth] User ID:",
//           user.id
//         );

//         /**
//          * IMPORTANT:
//          *
//          * NO RNRestart.restart()
//          *
//          * NO AsyncStorage restart flag
//          *
//          * NO supabase.auth.getUser()
//          *
//          * The SIGNED_IN listener will now process the user.
//          */
//       }

//       /**
//        * ========================================================
//        * PASSWORD RESET
//        * ========================================================
//        */
//       else if (
//         url.includes("reset-password") ||
//         url.includes("type=recovery")
//       ) {
//         /**
//          * Prevent normal SIGNED_IN auth handler from
//          * redirecting to Home during password recovery.
//          */
//         skipAuthRedirect.current = true;

//         /**
//          * Supabase tokens can be in:
//          *
//          * #access_token=...
//          *
//          * OR
//          *
//          * ?access_token=...
//          */
//         const searchPart = url.includes("#")
//           ? url.split("#")[1]
//           : url.split("?")[1];

//         if (searchPart) {
//           const params = new URLSearchParams(
//             searchPart
//           );

//           const accessToken =
//             params.get("access_token");

//           const refreshToken =
//             params.get("refresh_token");

//           if (accessToken && refreshToken) {
//             console.log(
//               "[Password Reset] Reset tokens detected"
//             );

//             /**
//              * Small delay so NavigationContainer is ready.
//              */
//             setTimeout(() => {
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "ResetPassword",
//                     params: {
//                       access_token: accessToken,
//                       refresh_token: refreshToken,
//                     },
//                   },
//                 ],
//               });
//             }, 800);
//           }
//         }
//       }
//     };

//     /**
//      * ============================================================
//      * 4. INITIAL DEEP LINK
//      * ============================================================
//      *
//      * Handles app opened directly from:
//      *
//      * Google callback
//      * Password reset
//      * Other deep links
//      */
//     Linking.getInitialURL().then((url) => {
//       if (url) {
//         handleDeepLink({ url });
//       }
//     });

//     /**
//      * Listen for deep links while app is already running.
//      */
//     const deepLinkSubscription =
//       Linking.addEventListener(
//         "url",
//         handleDeepLink
//       );

//     /**
//      * ============================================================
//      * 5. NOTIFICATION TAP HANDLER
//      * ============================================================
//      */
//     const notificationResponseSubscription =
//       Notifications.addNotificationResponseReceivedListener(
//         (response) => {
//           const data =
//             response.notification.request.content
//               .data;

//           if (data?.screen === "bookings") {
//             navigationRef.current?.navigate(
//               "HomeDrawer",
//               {
//                 screen: "AuthenticatedScreens",
//                 params: {
//                   screen: "MainTabs",
//                   params: {
//                     screen: "MyBookingsTab",
//                   },
//                 },
//               }
//             );
//           }
//         }
//       );

//     /**
//      * ============================================================
//      * CLEANUP
//      * ============================================================
//      */
//     return () => {
//       authSubscription.unsubscribe();
//       deepLinkSubscription.remove();
//       notificationResponseSubscription.remove();
//     };
//   }, []);

//   /**
//    * ============================================================
//    * REACT NAVIGATION DEEP LINK CONFIG
//    * ============================================================
//    */
//   const linking: any = {
//     prefixes: [
//       Linking.createURL("/"),

//       /**
//        * Keep your existing HTTPS website deep links.
//        *
//        * IMPORTANT:
//        * app.json should eventually use only
//        * "theneatifyteam" as the native scheme.
//        */
//       "theneatifyteam://",

//       "https://www.theneatifyteam.in",
//       "https://theneatifyteam.in",
//     ],

//     config: {
//       screens: {
//         HomeDrawer: {
//           screens: {
//             AuthenticatedScreens: {
//               screens: {
//                 MainTabs: {
//                   screens: {
//                     HomeTab: {
//                       screens: {
//                         ServiceDetail:
//                           "service/:serviceId",

//                         HomeMain: "*",
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },

//     /**
//      * ==========================================================
//      * HANDLE UNMATCHED INITIAL URL
//      * ==========================================================
//      */
//     async getInitialURL() {
//       const url =
//         await Linking.getInitialURL();

//       if (url) {
//         console.log(
//           "[Deep Link] App opened from deep link"
//         );

//         const serviceId =
//           url.match(
//             /service\/([^/?]+)/
//           )?.[1];

//         if (serviceId) {
//           console.log(
//             "[Deep Link] Service ID detected:",
//             serviceId
//           );
//         }
//       }

//       return url;
//     },

//     /**
//      * ==========================================================
//      * HANDLE NAVIGATION DEEP LINKS
//      * ==========================================================
//      */
//     subscribe(
//       listener: (url: string) => void
//     ) {
//       const linkingSubscription =
//         Linking.addEventListener(
//           "url",
//           ({ url }) => {
//             console.log(
//               "[Navigation Deep Link] Received"
//             );

//             const serviceIdMatch =
//               url.match(
//                 /service\/([^/?]+)/
//               );

//             if (serviceIdMatch) {
//               console.log(
//                 "[Navigation Deep Link] Service ID:",
//                 serviceIdMatch[1]
//               );
//             }

//             listener(url);
//           }
//         );

//       return () => {
//         linkingSubscription.remove();
//       };
//     },
//   };

//   /**
//    * Don't render NavigationContainer until
//    * initial auth check has finished.
//    */
//   if (loading) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView
//       style={{ flex: 1 }}
//     >
//       <SafeAreaProvider>
//         <ThemeProvider>
//           <LanguageProvider>
//             <NotificationProvider>
//               <BookingCartProvider>
//                 <ThemedAppContent
//                   linking={linking}
//                   navigationRef={navigationRef}
//                   initialRoute={initialRoute}
//                 />
//               </BookingCartProvider>
//             </NotificationProvider>
//           </LanguageProvider>
//         </ThemeProvider>
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

// /**
//  * ==============================================================
//  * THEMED APP CONTENT
//  * ==============================================================
//  */
// function ThemedAppContent({
//   linking,
//   navigationRef,
//   initialRoute,
// }: any) {
//   const {
//     theme,
//     isDark,
//   } = useTheme();

//   const navTheme = {
//     ...(isDark
//       ? DarkTheme
//       : DefaultTheme),

//     colors: {
//       ...(isDark
//         ? DarkTheme.colors
//         : DefaultTheme.colors),

//       background:
//         theme.background,

//       card:
//         theme.background,

//       text:
//         theme.text,

//       border:
//         theme.border,

//       notification:
//         theme.primary,
//     },
//   };

//   return (
//     <>
//       <StatusBar
//         barStyle={
//           isDark
//             ? "light-content"
//             : "dark-content"
//         }
//         backgroundColor={
//           theme.background
//         }
//       />

//       <NavigationContainer
//         linking={linking}
//         ref={navigationRef}
//         theme={navTheme}
//       >
//         <AppNavigator
//           initialRouteName={
//             initialRoute
//           }
//         />
//       </NavigationContainer>
//     </>
//   );
// }

// /**
//  * Force rebuild
//  */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

















// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {
//   DarkTheme,
//   DefaultTheme,
//   NavigationContainer,
// } from "@react-navigation/native";
// import * as Linking from "expo-linking";
// // import React, { useEffect, useState } from "react";
// // import { StatusBar, StyleSheet } from "react-native";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   StatusBar,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// import { SafeAreaProvider } from "react-native-safe-area-context";

// import * as Notifications from "expo-notifications";
// import RNRestart from "react-native-restart";
// import { BookingCartProvider } from "./src/context/BookingCartContext";
// import { LanguageProvider } from "./src/context/LanguageContext";
// import { NotificationProvider } from "./src/context/NotificationContext";
// import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import { supabase } from "./src/lib/supabase";
// import AppNavigator from "./src/navigation/AppNavigator";
// import {
//   registerForPushNotificationsAsync,
//   savePushTokenToSupabase,
// } from "./src/utils/pushNotifications";

// import { GestureHandlerRootView } from "react-native-gesture-handler";

// export default function App() {
//   const [initialRoute, setInitialRoute] = useState<
//     "LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile"
//   >("HomeDrawer");

//   const [loading, setLoading] = useState(true);

//   const navigationRef = React.useRef<any>(null);

//   const skipAuthRedirect = React.useRef(false);

//   // ------------------------------------------------------------
//   // GOOGLE AUTH CONTROL
//   // ------------------------------------------------------------
//   // This becomes true only during the Google callback flow.
//   //
//   // We use this to prevent SIGNED_IN from immediately starting
//   // the profile request while the Google session is being created.
//   // ------------------------------------------------------------
//   const googleAuthInProgress = React.useRef(false);

//   // ------------------------------------------------------------
//   // PUSH TOKEN
//   // ------------------------------------------------------------

//   const handlePushToken = async (userId: string) => {
//     try {
//       const token = await registerForPushNotificationsAsync();

//       if (token) {
//         await savePushTokenToSupabase(userId, token);
//       }
//     } catch (err) {
//       console.error("Push token registration failed:", err);
//     }
//   };

//   // ------------------------------------------------------------
//   // AUTH / APP INITIALIZATION
//   // ------------------------------------------------------------

//   useEffect(() => {
//     // Prevent repeated SIGNED_IN handling.
//     let hasCheckedOnce = false;

//     // ----------------------------------------------------------
//     // TIMEOUT HELPER
//     // ----------------------------------------------------------

//     const withTimeout = <T,>(
//       promise: PromiseLike<T>,
//       ms: number,
//       label: string
//     ): Promise<T> => {
//       return Promise.race([
//         Promise.resolve(promise),
//         new Promise<T>((_, reject) =>
//           setTimeout(
//             () =>
//               reject(
//                 new Error(
//                   `Timeout: ${label} took longer than ${ms}ms`
//                 )
//               ),
//             ms
//           )
//         ),
//       ]);
//     };

//     // ----------------------------------------------------------
//     // CHECK PROFILE COMPLETENESS
//     // ----------------------------------------------------------

//     const checkCompleteness = async (
//       userId: string,
//       useNav = true
//     ): Promise<boolean> => {
//       console.log(
//         "[AUTH DEBUG] checkCompleteness START for user:",
//         userId
//       );

//       if (!userId) {
//         console.log(
//           "[AUTH DEBUG] No userId, returning true"
//         );

//         return true;
//       }

//       try {
//         // ------------------------------------------------------
//         // IMPORTANT:
//         // We still use getUser for normal app/profile checks.
//         // But it has an 8 second protection.
//         // ------------------------------------------------------

//         console.log(
//           "[AUTH DEBUG] supabase.auth.getUser() START"
//         );

//         const {
//           data: { user },
//           error: userError,
//         } = await withTimeout<any>(
//           supabase.auth.getUser(),
//           8000,
//           "supabase.auth.getUser"
//         );

//         console.log(
//           "[AUTH DEBUG] supabase.auth.getUser() RESULT",
//           {
//             hasUser: !!user,
//             hasError: !!userError,
//           }
//         );

//         if (userError || !user) {
//           if (
//             userError?.message?.includes("Refresh Token") ||
//             userError?.status === 401
//           ) {
//             console.log(
//               "[AUTH DEBUG] Session invalid, signing out START"
//             );

//             await supabase.auth.signOut();

//             console.log(
//               "[AUTH DEBUG] Session invalid, signing out RESULT"
//             );
//           }

//           console.log(
//             "[AUTH DEBUG] Returning true due to userError/no user"
//           );

//           return true;
//         }

//         // ------------------------------------------------------
//         // PROFILE QUERY
//         // ------------------------------------------------------

//         console.log(
//           "[AUTH DEBUG] profile query START"
//         );

//         console.log(
//           "[App Startup] Fetching user profile"
//         );

//         const { data: profile } = await withTimeout<any>(
//           supabase
//             .from("profile")
//             .select("full_name, phone")
//             .eq("id", userId)
//             .maybeSingle(),
//           8000,
//           "profile query"
//         );

//         console.log(
//           "[AUTH DEBUG] profile query RESULT",
//           profile
//         );

//         console.log(
//           "[App Startup] User profile fetched successfully"
//         );

//         // ------------------------------------------------------
//         // PROFILE COMPLETE
//         // ------------------------------------------------------

//         if (
//           profile &&
//           profile.full_name &&
//           profile.full_name.trim().length > 0
//         ) {
//           console.log(
//             "[AUTH DEBUG] Profile complete, returning true"
//           );

//           return true;
//         }

//         // ------------------------------------------------------
//         // PROFILE INCOMPLETE
//         // ------------------------------------------------------

//         if (useNav) {
//           const rawPhone =
//             profile?.phone ||
//             user.phone ||
//             user.user_metadata?.phone_number ||
//             "";

//           const digits = rawPhone
//             .replace(/\D/g, "")
//             .slice(-10);

//           console.log(
//             "[AUTH DEBUG] Incomplete profile detected! Navigating to CompleteProfile screen..."
//           );

//           navigationRef.current?.reset({
//             index: 0,
//             routes: [
//               {
//                 name: "CompleteProfile",
//                 params: {
//                   initialData: {
//                     phone: digits,
//                   },
//                 },
//               },
//             ],
//           });
//         }

//         console.log(
//           "[AUTH DEBUG] checkCompleteness END returning false"
//         );

//         return false;
//       } catch (err) {
//         console.error(
//           "[AUTH DEBUG] checkCompleteness catch error:",
//           err
//         );

//         // Returning true preserves the existing behavior.
//         return true;
//       }
//     };

//     // ----------------------------------------------------------
//     // INITIAL APP LAUNCH
//     // ----------------------------------------------------------

//     const initApp = async () => {
//       try {
//         console.log(
//           "[App Startup] Initializing auth"
//         );

//         const {
//           data: { session },
//           error: sessionError,
//         } = await supabase.auth.getSession();

//         // ------------------------------------------------------
//         // SESSION ERROR
//         // ------------------------------------------------------

//         if (sessionError) {
//           if (
//             sessionError.message?.includes("Refresh Token") ||
//             sessionError.status === 400
//           ) {
//             console.warn(
//               "Broken session detected on init. Clearing..."
//             );

//             await supabase.auth.signOut();

//             setInitialRoute("LocationAccess");
//             setLoading(false);

//             return;
//           }

//           throw sessionError;
//         }

//         // ------------------------------------------------------
//         // EXISTING SESSION
//         // ------------------------------------------------------

//         if (session?.user) {
//           console.log(
//             "[App Startup] Existing Supabase session found"
//           );

//           console.log(
//             `[App Startup] User ID: ${session.user.id}`
//           );

//           // ----------------------------------------------------
//           // IMPORTANT:
//           // If this app was restarted because of the Google
//           // authentication watchdog, clear the flag NOW.
//           //
//           // This prevents another restart loop.
//           // ----------------------------------------------------

//           const googleRestartFlag =
//             await AsyncStorage.getItem(
//               "google_auth_restarted"
//             );

//           if (googleRestartFlag === "true") {
//             console.log(
//               "[Google Auth] Restart recovery detected"
//             );

//             console.log(
//               "[Google Auth] Clearing restart flag"
//             );

//             await AsyncStorage.removeItem(
//               "google_auth_restarted"
//             );
//           }

//           handlePushToken(session.user.id);

//           hasCheckedOnce = true;
//         }

//         // ------------------------------------------------------
//         // INITIAL ROUTE
//         // ------------------------------------------------------

//         setInitialRoute("LocationAccess");
//       } catch (err) {
//         console.error(
//           "App init failed:",
//           err
//         );

//         setInitialRoute("LocationAccess");
//       } finally {
//         setLoading(false);
//       }
//     };

//     initApp();

//     // ----------------------------------------------------------
//     // AUTH STATE LISTENER
//     // ----------------------------------------------------------

//     const {
//       data: listener,
//     } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         console.log(
//           "🌐 [App Debug] onAuthStateChange event:",
//           event,
//           "session user:",
//           session?.user?.id
//         );

//         // ------------------------------------------------------
//         // SIGNED OUT
//         // ------------------------------------------------------

//         if (event === "SIGNED_OUT") {
//           skipAuthRedirect.current = false;

//           hasCheckedOnce = false;

//           googleAuthInProgress.current = false;

//           console.log(
//             "[AUTH] User signed out"
//           );

//           return;
//         }

//         // ------------------------------------------------------
//         // PASSWORD RESET
//         // ------------------------------------------------------

//         if (
//           skipAuthRedirect.current &&
//           event === "SIGNED_IN"
//         ) {
//           console.log(
//             "Skipping auth redirect (password reset in progress)"
//           );

//           return;
//         }

//         // ------------------------------------------------------
//         // SIGNED IN
//         // ------------------------------------------------------

//         if (
//           event === "SIGNED_IN" &&
//           session?.user &&
//           !hasCheckedOnce
//         ) {
//           hasCheckedOnce = true;

//           const userId = session.user.id;

//           console.log(
//             "[AUTH] SIGNED_IN user:",
//             userId
//           );

//           handlePushToken(userId);

//           // ----------------------------------------------------
//           // IMPORTANT GOOGLE FIX
//           // ----------------------------------------------------
//           //
//           // During Google callback:
//           //
//           // setSession()
//           //      ↓
//           // SIGNED_IN
//           //      ↓
//           // profile query
//           //
//           // The profile query is what your ADB shows getting
//           // stuck.
//           //
//           // Therefore DO NOT start checkCompleteness here
//           // during Google authentication.
//           //
//           // The Google deep-link flow has its own watchdog.
//           // ----------------------------------------------------

//           if (googleAuthInProgress.current) {
//             console.log(
//               "[AUTH] Google SIGNED_IN detected"
//             );

//             console.log(
//               "[AUTH] Skipping immediate profile check for Google login"
//             );

//             return;
//           }

//           // ----------------------------------------------------
//           // NORMAL EMAIL/PASSWORD LOGIN
//           // ----------------------------------------------------

//           setTimeout(async () => {
//             console.log(
//               "🌐 [App Debug] Checking profile completeness for SIGNED_IN user..."
//             );

//             const isComplete =
//               await checkCompleteness(
//                 userId,
//                 true
//               );

//             if (isComplete) {
//               console.log(
//                 "🌐 [App Debug] Profile complete -> Navigating to HomeDrawer"
//               );

//               console.log(
//                 "[App Startup] Navigating to Home/Profile"
//               );

//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "HomeDrawer",
//                   },
//                 ],
//               });
//             }
//           }, 300);
//         }
//       }
//     );

//     // ----------------------------------------------------------
//     // DEEP LINK HANDLER
//     // ----------------------------------------------------------

//     const handleDeepLink = async ({
//       url,
//     }: {
//       url: string;
//     }) => {
//       if (!url) {
//         return;
//       }

//       console.log(
//         "[Deep Link] Authentication/deep link received"
//       );

//       console.log(
//         "Deep link received:",
//         url
//       );

//       // ========================================================
//       // GOOGLE AUTH
//       // ========================================================

//       if (url.includes("google-auth")) {
//         const fragment = url.split("#")[1];

//         if (!fragment) {
//           console.log(
//             "[Google Auth] No URL fragment found"
//           );

//           return;
//         }

//         const params = new URLSearchParams(
//           fragment
//         );

//         const accessToken =
//           params.get("access_token");

//         const refreshToken =
//           params.get("refresh_token");

//         if (
//           !accessToken ||
//           !refreshToken
//         ) {
//           console.log(
//             "[Google Auth] Access or refresh token missing"
//           );

//           return;
//         }

//         console.log(
//           "[Google Auth] Google callback received"
//         );

//         // ------------------------------------------------------
//         // Tell SIGNED_IN listener this is Google authentication.
//         // IMPORTANT: Set BEFORE setSession().
//         // ------------------------------------------------------

//         googleAuthInProgress.current = true;

//         hasCheckedOnce = false;

//         // ------------------------------------------------------
//         // Check restart flag
//         // ------------------------------------------------------

//         const hasRestarted =
//           await AsyncStorage.getItem(
//             "google_auth_restarted"
//           );

//         // ======================================================
//         // SECOND START / RECOVERY
//         // ======================================================

//         if (hasRestarted === "true") {
//           console.log(
//             "[Google Auth] Restart recovery flow detected"
//           );

//           // Clear flag so future Google logins work normally.
//           await AsyncStorage.removeItem(
//             "google_auth_restarted"
//           );

//           try {
//             console.log(
//               "[Google Auth] Restoring Supabase session"
//             );

//             const {
//               data,
//               error,
//             } = await supabase.auth.setSession({
//               access_token: accessToken,
//               refresh_token: refreshToken,
//             });

//             if (error) {
//               console.error(
//                 "[Google Auth] Session restore error:",
//                 error.message
//               );

//               googleAuthInProgress.current = false;

//               return;
//             }

//             if (data?.session?.user) {
//               console.log(
//                 "[Google Auth] Session restored successfully"
//               );

//               console.log(
//                 "[Google Auth] User ID:",
//                 data.session.user.id
//               );
//             }
//           } catch (err) {
//             console.error(
//               "[Google Auth] Session restore exception:",
//               err
//             );
//           } finally {
//             googleAuthInProgress.current = false;
//           }

//           return;
//         }

//         // ======================================================
//         // FIRST GOOGLE LOGIN
//         // ======================================================

//         console.log(
//           "[Google Auth] First Google login detected"
//         );

//         // ------------------------------------------------------
//         // IMPORTANT:
//         // Set restart flag BEFORE setSession().
//         //
//         // If setSession/profile gets stuck, the watchdog will
//         // restart the app.
//         // ------------------------------------------------------

//         await AsyncStorage.setItem(
//           "google_auth_restarted",
//           "true"
//         );

//         console.log(
//           "[Google Auth] Restart flag saved"
//         );

//         // ------------------------------------------------------
//         // START WATCHDOG BEFORE setSession()
//         // ------------------------------------------------------

//         console.log(
//           "[Google Auth] Starting 8-second restart watchdog"
//         );

//         const restartTimer =
//           setTimeout(() => {
//             try {
//               console.log(
//                 "[Google Auth] Authentication/profile flow appears stuck"
//               );

//               console.log(
//                 "[Google Auth] Automatically restarting app..."
//               );

//               RNRestart.restart();
//             } catch (err) {
//               console.error(
//                 "[Google Auth] Failed to restart app:",
//                 err
//               );
//             }
//           }, 8000);

//         // ------------------------------------------------------
//         // CREATE SUPABASE SESSION
//         // ------------------------------------------------------

//         try {
//           console.log(
//             "[Google Auth] Starting Supabase session creation"
//           );

//           const {
//             data,
//             error,
//           } = await supabase.auth.setSession({
//             access_token: accessToken,
//             refresh_token: refreshToken,
//           });

//           // ----------------------------------------------------
//           // IMPORTANT:
//           //
//           // If setSession completes successfully, cancel the
//           // watchdog.
//           //
//           // However, the Google SIGNED_IN listener will NOT
//           // start the profile request because
//           // googleAuthInProgress.current is true.
//           // ----------------------------------------------------

//           clearTimeout(
//             restartTimer
//           );

//           if (error) {
//             console.error(
//               "[Google Auth] setSession error:",
//               error.message
//             );

//             await AsyncStorage.removeItem(
//               "google_auth_restarted"
//             );

//             googleAuthInProgress.current =
//               false;

//             return;
//           }

//           if (data?.session?.user) {
//             console.log(
//               "[Google Auth] Supabase session created successfully"
//             );

//             console.log(
//               "[Google Auth] User ID:",
//               data.session.user.id
//             );

//             // --------------------------------------------------
//             // IMPORTANT:
//             //
//             // We intentionally DO NOT call checkCompleteness()
//             // here.
//             //
//             // The reason is the first-login profile request is
//             // the operation that is hanging in your ADB log.
//             //
//             // If this flow hangs, the watchdog above restarts
//             // the application.
//             // --------------------------------------------------

//             console.log(
//               "[Google Auth] Waiting for normal app recovery"
//             );

//             // Give the auth event a little time to finish.
//             setTimeout(() => {
//               googleAuthInProgress.current = false;
//             }, 1000);
//           } else {
//             googleAuthInProgress.current =
//               false;
//           }
//         } catch (err) {
//           clearTimeout(
//             restartTimer
//           );

//           console.error(
//             "[Google Auth] setSession exception:",
//             err
//           );

//           googleAuthInProgress.current =
//             false;
//         }

//         return;
//       }

//       // ========================================================
//       // PASSWORD RESET
//       // ========================================================

//       if (
//         url.includes("reset-password") ||
//         url.includes("type=recovery")
//       ) {
//         // Prevent auth listener from navigating to Home.
//         skipAuthRedirect.current = true;

//         // Supabase tokens can be in the fragment (#)
//         // or query (?).
//         const searchPart = url.includes("#")
//           ? url.split("#")[1]
//           : url.split("?")[1];

//         if (searchPart) {
//           const params =
//             new URLSearchParams(
//               searchPart
//             );

//           const accessToken =
//             params.get("access_token");

//           const refreshToken =
//             params.get("refresh_token");

//           if (
//             accessToken &&
//             refreshToken
//           ) {
//             console.log(
//               "✅ Reset tokens detected. Navigating to ResetPassword..."
//             );

//             // Small delay to ensure NavigationContainer
//             // is ready.
//             setTimeout(() => {
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "ResetPassword",
//                     params: {
//                       access_token:
//                         accessToken,
//                       refresh_token:
//                         refreshToken,
//                     },
//                   },
//                 ],
//               });
//             }, 800);
//           }
//         }
//       }
//     };

//     // ----------------------------------------------------------
//     // INITIAL URL / COLD START
//     // ----------------------------------------------------------

//     Linking.getInitialURL().then(
//       (url) => {
//         if (url) {
//           handleDeepLink({
//             url,
//           });
//         }
//       }
//     );

//     // ----------------------------------------------------------
//     // URL EVENT LISTENER
//     // ----------------------------------------------------------

//     const subscription =
//       Linking.addEventListener(
//         "url",
//         handleDeepLink
//       );

//     // ----------------------------------------------------------
//     // NOTIFICATION TAP
//     // ----------------------------------------------------------

//     const notificationResponseSubscription =
//       Notifications.addNotificationResponseReceivedListener(
//         (response) => {
//           const data =
//             response.notification.request
//               .content.data;

//           if (
//             data?.screen === "bookings"
//           ) {
//             navigationRef.current?.navigate(
//               "HomeDrawer",
//               {
//                 screen:
//                   "AuthenticatedScreens",
//                 params: {
//                   screen: "MainTabs",
//                   params: {
//                     screen:
//                       "MyBookingsTab",
//                   },
//                 },
//               }
//             );
//           }
//         }
//       );

//     // ----------------------------------------------------------
//     // CLEANUP
//     // ----------------------------------------------------------

//     return () => {
//       listener.subscription.unsubscribe();

//       subscription.remove();

//       notificationResponseSubscription.remove();
//     };
//   }, []);

//   // ============================================================
//   // REACT NAVIGATION DEEP LINK CONFIG
//   // ============================================================

//   const linking: any = {
//     prefixes: [
//       Linking.createURL("/"),
//       "neatifynation://",
//       "theneatifyteam://",
//       "https://www.theneatifyteam.in",
//       "https://theneatifyteam.in",
//     ],

//     config: {
//       screens: {
//         HomeDrawer: {
//           screens: {
//             AuthenticatedScreens: {
//               screens: {
//                 MainTabs: {
//                   screens: {
//                     HomeTab: {
//                       screens: {
//                         ServiceDetail:
//                           "service/:serviceId",

//                         HomeMain: "*",
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },

//     // ----------------------------------------------------------
//     // Handle unmatched URLs gracefully
//     // ----------------------------------------------------------

//     async getInitialURL() {
//       const url =
//         await Linking.getInitialURL();

//       if (url) {
//         console.log(
//           "Deep link opened app:",
//           url
//         );

//         console.log(
//           "Parsing serviceId from URL:",
//           url.match(
//             /service\/([^/?]+)/
//           )?.[1]
//         );
//       }

//       return url;
//     },

//     // ----------------------------------------------------------
//     // React Navigation URL subscription
//     // ----------------------------------------------------------

//     subscribe(
//       listener: (url: string) => void
//     ) {
//       const linkingSubscription =
//         Linking.addEventListener(
//           "url",
//           ({ url }) => {
//             console.log(
//               "Deep link received:",
//               url
//             );

//             const serviceIdMatch =
//               url.match(
//                 /service\/([^/?]+)/
//               );

//             if (serviceIdMatch) {
//               console.log(
//                 "Extracted serviceId:",
//                 serviceIdMatch[1]
//               );
//             } else {
//               console.log(
//                 "Deep link: No serviceId found, will navigate to Home"
//               );
//             }

//             listener(url);
//           }
//         );

//       return () => {
//         linkingSubscription.remove();
//       };
//     },
//   };

//   // ============================================================
//   // LOADING
//   // ============================================================

//   // if (loading) {
//   //   return null;
//   // }

//   // ============================================================
// // LOADING
// // ============================================================

// if (loading) {
//   return (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" />

//       <Text style={styles.loadingText}>
//         Signing you in...
//       </Text>

//       <Text style={styles.loadingSubText}>
//         Please wait while we finish setting up your account.
//       </Text>
//     </View>
//   );
// }

//   // ============================================================
//   // APP
//   // ============================================================

//   return (
//     <GestureHandlerRootView
//       style={{ flex: 1 }}
//     >
//       <SafeAreaProvider>
//         <ThemeProvider>
//           <LanguageProvider>
//             <NotificationProvider>
//               <BookingCartProvider>
//                 <ThemedAppContent
//                   linking={linking}
//                   navigationRef={
//                     navigationRef
//                   }
//                   initialRoute={
//                     initialRoute
//                   }
//                 />
//               </BookingCartProvider>
//             </NotificationProvider>
//           </LanguageProvider>
//         </ThemeProvider>
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

// // ============================================================
// // THEMED APP CONTENT
// // ============================================================

// function ThemedAppContent({
//   linking,
//   navigationRef,
//   initialRoute,
// }: any) {
//   const {
//     theme,
//     isDark,
//   } = useTheme();

//   const navTheme = {
//     ...(isDark
//       ? DarkTheme
//       : DefaultTheme),

//     colors: {
//       ...(isDark
//         ? DarkTheme.colors
//         : DefaultTheme.colors),

//       background:
//         theme.background,

//       card:
//         theme.background,

//       text:
//         theme.text,

//       border:
//         theme.border,

//       notification:
//         theme.primary,
//     },
//   };

//   return (
//     <>
//       <StatusBar
//         barStyle={
//           isDark
//             ? "light-content"
//             : "dark-content"
//         }
//         backgroundColor={
//           theme.background
//         }
//       />

//       <NavigationContainer
//         linking={linking}
//         ref={navigationRef}
//         theme={navTheme}
//       >
//         <AppNavigator
//           initialRouteName={
//             initialRoute
//           }
//         />
//       </NavigationContainer>
//     </>
//   );
// }

// // Force rebuild 2

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// // });


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },

//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 30,
//   },

//   loadingText: {
//     marginTop: 16,
//     fontSize: 18,
//     fontWeight: "600",
//     textAlign: "center",
//   },

//   loadingSubText: {
//     marginTop: 8,
//     fontSize: 14,
//     textAlign: "center",
//     opacity: 0.7,
//   },
// });




















import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as Notifications from "expo-notifications";
// import RNRestart from "react-native-restart";
import { BookingCartProvider } from "./src/context/BookingCartContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { supabase } from "./src/lib/supabase";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  registerForPushNotificationsAsync,
  savePushTokenToSupabase,
} from "./src/utils/pushNotifications";

import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    "LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile"
  >("HomeDrawer");

  const [loading, setLoading] = useState(true);
  const [showGoogleLoadingPopup, setShowGoogleLoadingPopup] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const navigationRef = React.useRef<any>(null);

  const skipAuthRedirect = React.useRef(false);

  // ------------------------------------------------------------
  // GOOGLE AUTH CONTROL
  // ------------------------------------------------------------
  // This becomes true only during the Google callback flow.
  //
  // We use this to prevent SIGNED_IN from immediately starting
  // the profile request while the Google session is being created.
  // ------------------------------------------------------------
  const googleAuthInProgress = React.useRef(false);

  // ------------------------------------------------------------
  // PUSH TOKEN
  // ------------------------------------------------------------

  const handlePushToken = async (userId: string) => {
    try {
      const token = await registerForPushNotificationsAsync();

      if (token) {
        await savePushTokenToSupabase(userId, token);
      }
    } catch (err) {
      console.error("Push token registration failed:", err);
    }
  };

  // ------------------------------------------------------------
  // AUTH / APP INITIALIZATION
  // ------------------------------------------------------------

  useEffect(() => {
    if (showGoogleLoadingPopup) {
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [showGoogleLoadingPopup]);

  useEffect(() => {
    // Prevent repeated SIGNED_IN handling.
    let hasCheckedOnce = false;

    // ----------------------------------------------------------
    // TIMEOUT HELPER
    // ----------------------------------------------------------

    const withTimeout = <T,>(
      promise: PromiseLike<T>,
      ms: number,
      label: string,
    ): Promise<T> => {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)),
            ms,
          ),
        ),
      ]);
    };

    // ----------------------------------------------------------
    // CHECK PROFILE COMPLETENESS
    // ----------------------------------------------------------

    const checkCompleteness = async (
      userId: string,
      useNav = true,
    ): Promise<boolean> => {
      console.log("[AUTH DEBUG] checkCompleteness START for user:", userId);

      if (!userId) {
        console.log("[AUTH DEBUG] No userId, returning true");

        return true;
      }

      try {
        // ------------------------------------------------------
        // IMPORTANT:
        // We still use getUser for normal app/profile checks.
        // But it has an 8 second protection.
        // ------------------------------------------------------

        console.log("[AUTH DEBUG] supabase.auth.getUser() START");

        const {
          data: { user },
          error: userError,
        } = await withTimeout<any>(
          supabase.auth.getUser(),
          8000,
          "supabase.auth.getUser",
        );

        console.log("[AUTH DEBUG] supabase.auth.getUser() RESULT", {
          hasUser: !!user,
          hasError: !!userError,
        });

        if (userError || !user) {
          if (
            userError?.message?.includes("Refresh Token") ||
            userError?.status === 401
          ) {
            console.log("[AUTH DEBUG] Session invalid, signing out START");

            await supabase.auth.signOut();

            console.log("[AUTH DEBUG] Session invalid, signing out RESULT");
          }

          console.log("[AUTH DEBUG] Returning true due to userError/no user");

          return true;
        }

        // ------------------------------------------------------
        // PROFILE QUERY
        // ------------------------------------------------------

        console.log("[AUTH DEBUG] profile query START");

        console.log("[App Startup] Fetching user profile");

        const { data: profile } = await withTimeout<any>(
          supabase
            .from("profile")
            .select("full_name, phone")
            .eq("id", userId)
            .maybeSingle(),
          8000,
          "profile query",
        );

        console.log("[AUTH DEBUG] profile query RESULT", profile);

        console.log("[App Startup] User profile fetched successfully");

        // ------------------------------------------------------
        // PROFILE COMPLETE
        // ------------------------------------------------------

        if (
          profile &&
          profile.full_name &&
          profile.full_name.trim().length > 0
        ) {
          console.log("[AUTH DEBUG] Profile complete, returning true");

          return true;
        }

        // ------------------------------------------------------
        // PROFILE INCOMPLETE
        // ------------------------------------------------------

        if (useNav) {
          const rawPhone =
            profile?.phone ||
            user.phone ||
            user.user_metadata?.phone_number ||
            "";

          const digits = rawPhone.replace(/\D/g, "").slice(-10);

          console.log(
            "[AUTH DEBUG] Incomplete profile detected! Navigating to CompleteProfile screen...",
          );

          navigationRef.current?.reset({
            index: 0,
            routes: [
              {
                name: "CompleteProfile",
                params: {
                  initialData: {
                    phone: digits,
                  },
                },
              },
            ],
          });
        }

        console.log("[AUTH DEBUG] checkCompleteness END returning false");

        return false;
      } catch (err) {
        console.error("[AUTH DEBUG] checkCompleteness catch error:", err);

        // Returning true preserves the existing behavior.
        return true;
      }
    };

    // ----------------------------------------------------------
    // INITIAL APP LAUNCH
    // ----------------------------------------------------------

    const initApp = async () => {
      try {
        console.log("[App Startup] Initializing auth");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        // ------------------------------------------------------
        // SESSION ERROR
        // ------------------------------------------------------

        if (sessionError) {
          if (
            sessionError.message?.includes("Refresh Token") ||
            sessionError.status === 400
          ) {
            console.warn("Broken session detected on init. Clearing...");

            await supabase.auth.signOut();

            setInitialRoute("LocationAccess");
            setLoading(false);

            return;
          }

          throw sessionError;
        }

        // ------------------------------------------------------
        // EXISTING SESSION
        // ------------------------------------------------------

        if (session?.user) {
          console.log("[App Startup] Existing Supabase session found");

          console.log(`[App Startup] User ID: ${session.user.id}`);

          // ----------------------------------------------------
          // IMPORTANT:
          // If this app was restarted because of the Google
          // authentication watchdog, clear the flag NOW.
          //
          // This prevents another restart loop.
          // ----------------------------------------------------

          // const googleRestartFlag = await AsyncStorage.getItem(
          //   "google_auth_restarted",
          // );

          // if (googleRestartFlag === "true") {
          //   console.log("[Google Auth] Restart recovery detected");

          //   console.log("[Google Auth] Clearing restart flag");

          //   await AsyncStorage.removeItem("google_auth_restarted");
          // }

          handlePushToken(session.user.id);

          hasCheckedOnce = true;
        }

        // ------------------------------------------------------
        // INITIAL ROUTE
        // ------------------------------------------------------

        setInitialRoute("LocationAccess");
      } catch (err) {
        console.error("App init failed:", err);

        setInitialRoute("LocationAccess");
      } finally {
        setLoading(false);
      }
    };

    initApp();

    // ----------------------------------------------------------
    // AUTH STATE LISTENER
    // ----------------------------------------------------------

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "🌐 [App Debug] onAuthStateChange event:",
          event,
          "session user:",
          session?.user?.id,
        );

        // ------------------------------------------------------
        // SIGNED OUT
        // ------------------------------------------------------

        if (event === "SIGNED_OUT") {
          skipAuthRedirect.current = false;

          hasCheckedOnce = false;

          googleAuthInProgress.current = false;

          console.log("[AUTH] User signed out");

          return;
        }

        // ------------------------------------------------------
        // PASSWORD RESET
        // ------------------------------------------------------

        if (skipAuthRedirect.current && event === "SIGNED_IN") {
          console.log("Skipping auth redirect (password reset in progress)");

          return;
        }

        // ------------------------------------------------------
        // SIGNED IN
        // ------------------------------------------------------

        if (event === "SIGNED_IN" && session?.user && !hasCheckedOnce) {
          hasCheckedOnce = true;

          const userId = session.user.id;

          console.log("[AUTH] SIGNED_IN user:", userId);

          handlePushToken(userId);


          // ----------------------------------------------------
          // IMPORTANT GOOGLE FIX
          // ----------------------------------------------------
          //
          // During Google callback:
          //
          // setSession()
          //      ↓
          // SIGNED_IN
          //      ↓
          // profile query
          //
          // The profile query is what your ADB shows getting
          // stuck.
          //
          // Therefore DO NOT start checkCompleteness here
          // during Google authentication.
          //
          // The Google deep-link flow has its own watchdog.
          // ----------------------------------------------------

          if (googleAuthInProgress.current) {
            console.log("[AUTH] Google SIGNED_IN detected");

            console.log(
              "[AUTH] Skipping immediate profile check for Google login",
            );

            return;
          }

          // ----------------------------------------------------
          // NORMAL EMAIL/PASSWORD LOGIN
          // ----------------------------------------------------

          setTimeout(async () => {
            console.log(
              "🌐 [App Debug] Checking profile completeness for SIGNED_IN user...",
            );

            const isComplete = await checkCompleteness(userId, true);

            if (isComplete) {
              console.log(
                "🌐 [App Debug] Profile complete -> Navigating to HomeDrawer",
              );

              console.log("[App Startup] Navigating to Home/Profile");

              navigationRef.current?.reset({
                index: 0,
                routes: [
                  {
                    name: "HomeDrawer",
                  },
                ],
              });
            }
          }, 300);
        }
      },
    );

    // ----------------------------------------------------------
    // DEEP LINK HANDLER
    // ----------------------------------------------------------

    const handleDeepLink = async ({ url }: { url: string }) => {
      if (!url) {
        return;
      }

      console.log("[Deep Link] Authentication/deep link received");

      console.log("Deep link received:", url);

      // ========================================================
      // GOOGLE AUTH
      // ========================================================

      if (url.includes("google-auth")) {
        const fragment = url.split("#")[1];

        if (!fragment) {
          console.log("[Google Auth] No URL fragment found");

          return;
        }

        const params = new URLSearchParams(fragment);

        const accessToken = params.get("access_token");

        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          console.log("[Google Auth] Access or refresh token missing");

          return;
        }

        console.log("[Google Auth] Google callback received");

        // ------------------------------------------------------
        // Tell SIGNED_IN listener this is Google authentication.
        // IMPORTANT: Set BEFORE setSession().
        // ------------------------------------------------------

        googleAuthInProgress.current = true;

        hasCheckedOnce = false;

        // ------------------------------------------------------
        // Check restart flag
        // ------------------------------------------------------

        // const hasRestarted = await AsyncStorage.getItem(
        //   "google_auth_restarted",
        // );

        // ======================================================
        // SECOND START / RECOVERY
        // ======================================================

        // if (hasRestarted === "true") {
        //   console.log("[Google Auth] Restart recovery flow detected");

        //   // Clear flag so future Google logins work normally.
        //   await AsyncStorage.removeItem("google_auth_restarted");

        //   try {
        //     console.log("[Google Auth] Restoring Supabase session");

        //     const { data, error } = await supabase.auth.setSession({
        //       access_token: accessToken,
        //       refresh_token: refreshToken,
        //     });

        //     if (error) {
        //       console.error(
        //         "[Google Auth] Session restore error:",
        //         error.message,
        //       );

        //       googleAuthInProgress.current = false;

        //       return;
        //     }

        //     if (data?.session?.user) {
        //       console.log("[Google Auth] Session restored successfully");

        //       console.log("[Google Auth] User ID:", data.session.user.id);
        //     }
        //   } catch (err) {
        //     console.error("[Google Auth] Session restore exception:", err);
        //   } finally {
        //     googleAuthInProgress.current = false;
        //   }

        //   return;
        // }

        // ======================================================
        // FIRST GOOGLE LOGIN
        // ======================================================

        console.log("[Google Auth] First Google login detected");

        setShowGoogleLoadingPopup(true);

        // ------------------------------------------------------
        // IMPORTANT:
        // Set restart flag BEFORE setSession().
        //
        // If setSession/profile gets stuck, the watchdog will
        // restart the app.
        // ------------------------------------------------------

        // await AsyncStorage.setItem("google_auth_restarted", "true");

        // console.log("[Google Auth] Restart flag saved");

        // ------------------------------------------------------
        // START WATCHDOG BEFORE setSession()
        // ------------------------------------------------------

        // console.log("[Google Auth] Starting 3-second restart watchdog");

        // const restartTimer = setTimeout(() => {
        //   try {
        //     console.log(
        //       "[Google Auth] Authentication/profile flow appears stuck",
        //     );

        //     console.log("[Google Auth] Automatically restarting app...");

        //     RNRestart.restart();
        //   } catch (err) {
        //     console.error("[Google Auth] Failed to restart app:", err);
        //   }
        // }, 3000);

        // ------------------------------------------------------
        // CREATE SUPABASE SESSION
        // ------------------------------------------------------

        try {
          console.log("[Google Auth] Starting Supabase session creation");

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // ----------------------------------------------------
          // IMPORTANT:
          //
          // If setSession completes successfully, cancel the
          // watchdog.
          //
          // However, the Google SIGNED_IN listener will NOT
          // start the profile request because
          // googleAuthInProgress.current is true.
          // ----------------------------------------------------

          // clearTimeout(restartTimer);

          if (error) {
            console.error("[Google Auth] setSession error:", error.message);

            await AsyncStorage.removeItem("google_auth_restarted");

            googleAuthInProgress.current = false;

            return;
          }

          if (data?.session?.user) {
            console.log("[Google Auth] Supabase session created successfully");

            console.log("[Google Auth] User ID:", data.session.user.id);

            // ==========================================
            // CREATE PROFILE ROW
            // ==========================================

            const user = data.session.user;

            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Customer";

            const { error: profileError } = await supabase
              .from("profile")
              .upsert({
                id: user.id,
                email: user.email,
                full_name: fullName,
                phone: null,
                address: null,
                pincode: null,
              });

            if (profileError) {
              console.error(
                "[Google Auth] Profile creation error:",
                profileError.message
              );
            } else {
              console.log("[Google Auth] Profile row created");
            }

            // 1. CLEAR THE LOADING MODAL
            setShowGoogleLoadingPopup(false);

            // 2. MANUALLY RUN PROFILE CHECK AND NAVIGATE
            console.log("[Google Auth] Checking completeness & navigating...");
            const isComplete = await checkCompleteness(user.id, true);

            if (isComplete) {
              navigationRef.current?.reset({
                index: 0,
                routes: [
                  {
                    name: "HomeDrawer",
                  },
                ],
              });
            }

            // 3. CLEAN UP FLAG IMMEDIATELY
            googleAuthInProgress.current = false;

          } else {
            googleAuthInProgress.current = false;
            setShowGoogleLoadingPopup(false);
          }

        } catch (err) {
          // clearTimeout(restartTimer);
          console.error("[Google Auth] setSession exception:", err);
          googleAuthInProgress.current = false;
          setShowGoogleLoadingPopup(false);
        }

        return;
      }

      // ========================================================
      // PASSWORD RESET
      // ========================================================

      if (url.includes("reset-password") || url.includes("type=recovery")) {
        // Prevent auth listener from navigating to Home.
        skipAuthRedirect.current = true;

        // Supabase tokens can be in the fragment (#)
        // or query (?).
        const searchPart = url.includes("#")
          ? url.split("#")[1]
          : url.split("?")[1];

        if (searchPart) {
          const params = new URLSearchParams(searchPart);

          const accessToken = params.get("access_token");

          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            console.log(
              "✅ Reset tokens detected. Navigating to ResetPassword...",
            );

            // Small delay to ensure NavigationContainer
            // is ready.
            setTimeout(() => {
              navigationRef.current?.reset({
                index: 0,
                routes: [
                  {
                    name: "ResetPassword",
                    params: {
                      access_token: accessToken,
                      refresh_token: refreshToken,
                    },
                  },
                ],
              });
            }, 800);
          }
        }
      }
    };

    // ----------------------------------------------------------
    // INITIAL URL / COLD START
    // ----------------------------------------------------------

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({
          url,
        });
      }
    });

    // ----------------------------------------------------------
    // URL EVENT LISTENER
    // ----------------------------------------------------------

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // ----------------------------------------------------------
    // NOTIFICATION TAP
    // ----------------------------------------------------------

    const notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.screen === "bookings") {
          navigationRef.current?.navigate("HomeDrawer", {
            screen: "AuthenticatedScreens",
            params: {
              screen: "MainTabs",
              params: {
                screen: "MyBookingsTab",
              },
            },
          });
        }
      });

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      listener.subscription.unsubscribe();

      subscription.remove();

      notificationResponseSubscription.remove();
    };
  }, []);

  // ============================================================
  // REACT NAVIGATION DEEP LINK CONFIG
  // ============================================================

  const linking: any = {
    prefixes: [
      Linking.createURL("/"),
      "neatifynation://",
      "theneatifyteam://",
      "https://www.theneatifyteam.in",
      "https://theneatifyteam.in",
    ],

    config: {
      screens: {
        HomeDrawer: {
          screens: {
            AuthenticatedScreens: {
              screens: {
                MainTabs: {
                  screens: {
                    HomeTab: {
                      screens: {
                        ServiceDetail: "service/:serviceId",

                        HomeMain: "*",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ----------------------------------------------------------
    // Handle unmatched URLs gracefully
    // ----------------------------------------------------------

    async getInitialURL() {
      const url = await Linking.getInitialURL();

      if (url) {
        console.log("Deep link opened app:", url);

        console.log(
          "Parsing serviceId from URL:",
          url.match(/service\/([^/?]+)/)?.[1],
        );
      }

      return url;
    },

    // ----------------------------------------------------------
    // React Navigation URL subscription
    // ----------------------------------------------------------

    subscribe(listener: (url: string) => void) {
      const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
        console.log("Deep link received:", url);

        const serviceIdMatch = url.match(/service\/([^/?]+)/);

        if (serviceIdMatch) {
          console.log("Extracted serviceId:", serviceIdMatch[1]);
        } else {
          console.log("Deep link: No serviceId found, will navigate to Home");
        }

        listener(url);
      });

      return () => {
        linkingSubscription.remove();
      };
    },
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return null;
  }

  // ============================================================
  // APP
  // ============================================================

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <BookingCartProvider>
                <ThemedAppContent
                  linking={linking}
                  navigationRef={navigationRef}
                  initialRoute={initialRoute}
                />
              </BookingCartProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
      <Modal visible={showGoogleLoadingPopup} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 320,
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Please wait while we fetch your location...
            </Text>

            <View
              style={{
                width: 220,
                height: 6,
                backgroundColor: "#E5E7EB",
                overflow: "hidden",
                borderRadius: 4,
              }}
            >
              <Animated.View
                style={{
                  width: 80,
                  height: 6,
                  backgroundColor: "#007BFF",
                  transform: [
                    {
                      translateX: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-80, 220],
                      }),
                    },
                  ],
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

// ============================================================
// THEMED APP CONTENT
// ============================================================

function ThemedAppContent({ linking, navigationRef, initialRoute }: any) {
  const { theme, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),

    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),

      background: theme.background,

      card: theme.background,

      text: theme.text,

      border: theme.border,

      notification: theme.primary,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        theme={navTheme}
      >
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </>
  );
}

// Force rebuild 2

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});