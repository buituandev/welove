import RnGoogleSignin from "@novastera-oss/rn-google-signin";
import { mmkvSupabaseAdapter } from "./supabase-storage-adapter";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useMovieTrackerStore } from "@/stores/movieTracker";
import { useSearchHistoryStore } from "@/stores/searchHistory";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { storage } from "./storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        flowType: "pkce",
        storage: mmkvSupabaseAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export async function getCurrentSession() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }
    return session ?? null;
}


export async function signInWithGoogle() {
    try {
        await RnGoogleSignin.hasPlayServices({});
        const userInfo = await RnGoogleSignin.signIn({});

        if (userInfo.idToken) {
            const { error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.idToken,
            });

            if (error) throw error;
            console.log('Successfully signed in to Supabase');
            return getCurrentSession();
        }
    } catch (error) {
        console.warn('Sign-in error:', error);
        throw error;
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    await RnGoogleSignin.signOut();

    // 1. MMKV: all user-specific keys (query cache, watchlists, history, etc.)
    //    This now also covers Supabase auth tokens (sb-*-auth-token keys)
    //    since the Supabase adapter writes to the same MMKV instance.
    storage.clearAll();

    // ─── Reset React Query client cache ─────────────────────────────────────
    try {
        const { queryClient } = await import("@/services/client");
        queryClient.clear();
    } catch (e) {
        console.error("Failed to clear queryClient cache:", e);
    }

    // ─── Reset in-memory Zustand stores ─────────────────────────────────────
    // MMKV clearAll() wipes the persistence layer but the running store keeps
    // its last-hydrated state. Explicitly reset each store so the next user
    // starts fresh without restarting the app.
    useSearchHistoryStore.getState().clearHistory();
    useMovieTrackerStore.getState().reset();

    try {
        const { useSettingsStore } = await import("@/stores/settings");
        useSettingsStore.getState().reset();
    } catch (e) {
        console.error("Failed to reset settings store:", e);
    }

    try {
        const { useAudioStore } = await import("@/stores/audio");
        useAudioStore.getState().stopPlayback();
    } catch (e) {
        console.error("Failed to stop audio playback:", e);
    }

    if (error) {
        throw error;
    }
}
