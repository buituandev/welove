import RnGoogleSignin from '@novastera-oss/rn-google-signin';
import { focusManager } from '@tanstack/react-query';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import { supabase } from '../services/login';
import {
    checkProfileFromServer,
    getLocalHasProfile,
    onboardingMmkv,
    PROFILE_KEY,
} from '../services/onboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RootLayoutViewModel {
    isReady: boolean;
    fontsLoaded: boolean;
    loaded: boolean;
    session: any;
    hasProfile: boolean | undefined;
}

// ─── ViewModel Hook ───────────────────────────────────────────────────────────

export const useRootLayoutViewModel = (): RootLayoutViewModel => {
    const router = useRouter();
    const segments = useSegments();

    const fontsLoaded = true;

    const [session, setSession] = useState<any>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);

    // Reactively watch MMKV for changes so Onboarding form submission triggers an instant update
    const [hasProfile, setHasProfile] = useMMKVBoolean(PROFILE_KEY, onboardingMmkv);

    // Track if getSession() has resolved. This prevents reacting to the redundant
    // SIGNED_IN event that Supabase often fires right after getSession() on startup.
    const initialSessionCheckDoneRef = useRef(false);

    useEffect(() => {
        RnGoogleSignin.configure({
            webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
        });
    }, []);

    useEffect(() => {
        async function onFetchUpdateAsync() {
            // expo-updates is unavailable in dev builds / Expo Go.
            if (__DEV__ || !Updates.isEnabled) {
                return;
            }
            try {
                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    // Download the new bundle
                    await Updates.fetchUpdateAsync();

                    // Force the app to reload immediately
                    await Updates.reloadAsync();
                }
            } catch (error) {
                console.error("Error fetching updates:", error);
            }
        }

        onFetchUpdateAsync();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
            focusManager.setFocused(status === 'active');
        });
        return () => subscription.remove();
    }, []);

    // ─── Session + profile check ───────────────────────────────────────────────
    useEffect(() => {
        // App startup: restore session from AsyncStorage, then check profile.
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);

            if (session) {
                // Read directly from MMKV here to avoid stale closure state
                const local = getLocalHasProfile();

                if (local !== undefined) {
                    setHasProfile(local);
                } else {
                    try {
                        const result = await checkProfileFromServer();
                        setHasProfile(result);
                    } catch {
                        setHasProfile(true);
                    }
                }
            }

            // Important: Mark the initial startup check as done, even if NO session was found.
            // This ensures that true future sign-ins aren't mistakenly ignored.
            initialSessionCheckDoneRef.current = true;
            setIsSessionReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);

                if (event === 'SIGNED_IN' && session) {
                    // Supabase fires SIGNED_IN both when manually logging in AND sometimes
                    // implicitly alongside getSession on startup.
                    if (!initialSessionCheckDoneRef.current) {
                        return; // Ignore implicit event; getSession logic is handling it.
                    }

                    // A new manually-triggered login: fetch from server to clear any stale MMKV
                    try {
                        const result = await checkProfileFromServer();
                        setHasProfile(result);
                    } catch {
                        setHasProfile(true);
                    }
                } else if (!session) {
                    // SIGNED_OUT or TOKEN_REFRESHED to null
                    onboardingMmkv.remove(PROFILE_KEY);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [setHasProfile]);

    // ─── Route protection ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isSessionReady) return;

        const inAuthGroup = segments[0] === 'login';
        const inOnboarding = segments[0] === 'onboarding';

        if (!session) {
            if (!inAuthGroup) router.replace('/login');
        } else if (hasProfile === false) {
            if (!inOnboarding) router.replace('/onboarding');
        } else if (hasProfile === true) {
            if (inAuthGroup || inOnboarding) router.replace('/');
        }
        // hasProfile === undefined while still checking: don't redirect yet.
    }, [isSessionReady, segments, session, hasProfile, router]);

    // ─── Splash screen ─────────────────────────────────────────────────────────
    // Wait for both the session AND (when logged in) the profile flag before
    // revealing the app, so the user never sees a flash of the wrong screen.
    const isReady =
        isSessionReady &&
        fontsLoaded &&
        (session ? hasProfile !== undefined : true);

    useEffect(() => {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);

    return {
        isReady,
        fontsLoaded,
        loaded: true,
        session,
        hasProfile,
    };
};
