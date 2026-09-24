import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: "theneatifyteam",
    path: "google-auth",
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  if (data?.url) {
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (res.type === "success") {
      // Wait a brief moment to allow Supabase to process the deep-link session
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Grab the authenticated user session
      const { data: authData } = await supabase.auth.getSession();
      const user = authData?.session?.user;

      if (user) {
        // Check if user is brand new by comparing timestamps
        const createdAt = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at || user.created_at).getTime();

        // If the times are within a few seconds of each other, it's a new signup!
        const isNewUser = Math.abs(lastSignIn - createdAt) < 5000;

        return { user, isNewUser };
      }
    }
  }
  return null;
}