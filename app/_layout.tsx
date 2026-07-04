import '@/i18n';
import { GiphySDK } from '@giphy/react-native-sdk';
import * as Sentry from '@sentry/react-native';
import { BottomSheetProvider } from "@swmansion/react-native-bottom-sheet";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { Observe, ObserveRoot } from 'expo-observe';
import { usePathname } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native/provider";
import React, { useEffect } from "react";
import { AppState, AppStateStatus, Easing, StatusBar, StyleSheet, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { fetch as nitroFetch } from 'react-native-nitro-fetch';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppLockOverlay } from "../components/AppLockOverlay";
import { GlobalAudioPlayer } from "../components/GlobalAudioPlayer";
import { SessionProvider } from "../context/SessionContext";
import { StatusBarProvider, useStatusBar } from "../context/StatusBarContext";
import { ThemeProvider, useThemeContext } from "../context/ThemeContext";
import { VideoPlayerProvider } from "../context/VideoPlayerContext";
import '../global.css';
import { clientPersister, queryClient } from "../services/client";
import { useAppLockStore } from "../stores/appLock";
import { useAutoLanguageSync } from "../stores/language";
import { useRootLayoutViewModel } from "../viewmodels/RootLayoutViewModel";

Sentry.init({
  dsn: 'https://1ef88f34edcb93fd745ae50c49114de5@o4511278698397696.ingest.de.sentry.io/4511278700494928',

  // Disabled in development — no events sent during local/dev builds
  enabled: !__DEV__,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: false,

  spotlight: __DEV__,
});
global.fetch = nitroFetch;

GiphySDK.configure({ apiKey: process.env.EXPO_PUBLIC_GIPHY_API_KEY || '' });

// Configure EAS Observe
Observe.configure({
  integrations: {
    'expo-router': true,
  },
});

SplashScreen.preventAutoHideAsync();

const StatusBarFade = () => {
  const { theme } = useThemeContext();
  const { showStatusBarFade } = useStatusBar();
  const insets = useSafeAreaInsets();

  const pathname = usePathname();
  const isShots = pathname === "/shots";

  if (!showStatusBarFade && !isShots) return null;

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color: isShots
          ? "rgba(0,0,0,0.6)"
          : theme === "light"
            ? "rgba(255,255,255,0.5)"
            : "rgba(0,0,0,1)",
        easing: Easing.linear,
      },
      1: {
        color: 'transparent',
      },
    },
    easing: Easing.linear,
    extraColorStopsPerTransition: 16,
  });

  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors as [string, string, ...string[]]}
      locations={locations as [number, number, ...number[]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insets.top + 24,
        zIndex: 10,
      }}
    />
  );
};

const FakeSplashScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <ExpoImage
        source={require("../assets/images/bg.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
        animated
      />
    </View>
  );
};

const RootContent = () => {
  const { theme, colors } = useThemeContext();
  const pathname = usePathname();
  const isShots = pathname === "/shots";

  const { isReady, session, hasProfile } = useRootLayoutViewModel();
  useAutoLanguageSync();

  const { appLockEnabled, setLocked, setLastBackgroundTime } = useAppLockStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!appLockEnabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setLastBackgroundTime(Date.now());
      } else if (nextAppState === 'active') {
        const bgTime = useAppLockStore.getState().lastBackgroundTime;
        if (bgTime > 0) {
          const elapsed = Date.now() - bgTime;
          if (elapsed >= 5000) {
            setLocked(true);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [appLockEnabled]);

  if (!isReady) {
    return <FakeSplashScreen />;
  }

  return (
    <SessionProvider session={session} hasProfile={hasProfile}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          key={`${theme}-${isShots}`}
          animated={false}
          translucent
          backgroundColor="transparent"
          barStyle={
            isShots
              ? "light-content"
              : theme === "light"
                ? "dark-content"
                : "light-content"
          }
        />
        <StatusBarFade />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="video_player" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="image_poster" />
          <Stack.Screen
            name="settings"
          />
          <Stack.Screen
            name="bookmarks"
          />
          <Stack.Screen name="language-settings" />
          <Stack.Screen name="security-settings" />
          <Stack.Screen name="search" />
          <Stack.Screen name="hashtag/[tag]" />
          <Stack.Screen name="hashtag-list" />
          <Stack.Screen name="create" />
          <Stack.Screen name="inapp_browser" />
          <Stack.Screen name="movie_detail" />
          <Stack.Screen name="tv_detail" />
          <Stack.Screen name="person_detail" />
          <Stack.Screen name="movie_list" />
          <Stack.Screen name="search_movies" />
          <Stack.Screen name="webview" />
          <Stack.Screen name="bulletinboard" />
        </Stack>
        <GlobalAudioPlayer />
        <AppLockOverlay />
      </View>
    </SessionProvider>
  );
};

// In dev, skip Sentry.wrap to avoid error-boundary overhead and noise
const withSentry = __DEV__ ? (fn: () => React.ReactElement) => fn : Sentry.wrap;
export default withSentry(function RootLayout() {
  return (
    <ObserveRoot>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>

          <HeroUINativeProvider>
            <BottomSheetProvider>
              <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{
                  persister: clientPersister,
                  maxAge: 1000 * 60 * 60, // 1 hour max cache age allowed on boot
                  buster: "v1.1", // cache buster to invalidate stale layouts
                }}
              >
                <SafeAreaProvider>
                  <ThemeProvider>
                    <StatusBarProvider>
                      <VideoPlayerProvider>
                        <RootContent />
                      </VideoPlayerProvider>
                    </StatusBarProvider>
                  </ThemeProvider>
                </SafeAreaProvider>
              </PersistQueryClientProvider>
            </BottomSheetProvider>
          </HeroUINativeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ObserveRoot>
  );
});
