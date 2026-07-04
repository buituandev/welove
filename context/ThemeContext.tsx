import { requireNativeModule } from 'expo-modules-core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform, useColorScheme } from 'react-native';
import { Uniwind } from "uniwind";
import { ThemePreference, useSettingsStore } from "../stores/settings";
import { createTypography, TypographyScale } from "../styles/typography";

export type ThemeMode = "light" | "dark";
export type { ThemePreference };

export type ThemeColors = {
  // --- Material 3 Core Color Roles ---
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  outline: string;
  outlineVariant: string;

  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  scrim: string;

  // --- Deprecated Aliases for Backward Compatibility ---
  /** @deprecated Use `surface` or `surfaceContainerLow` instead */
  background: string;
  /** @deprecated Use `onSurface` instead */
  text: string;
  /** @deprecated Use `surfaceContainerHigh` instead */
  card: string;
  /** @deprecated Use `surfaceContainerLow` instead */
  tabBar: string;
  /** @deprecated Use `primary` instead */
  tabActive: string;
  /** @deprecated Use `onSurfaceVariant` instead */
  tabInactive: string;
  /** @deprecated Use `surfaceContainer` instead */
  containerContent: string;
  /** @deprecated Use `outlineVariant` instead */
  divider: string;
  /** @deprecated Use `onSurfaceVariant` instead */
  muted: string;
  /** @deprecated Use `primary` or `tertiary` instead */
  verify: string;
  /** @deprecated Use `secondaryContainer` instead */
  secondaryMuted: string;
  /** @deprecated Use standard buttons/chips with M3 container colors */
  pillTab: {
    activeBg: string;
    activeText: string;
    inactiveBg: string;
    inactiveText: string;
  };
};

type ThemeContextValue = {
  theme: ThemeMode;
  themePreference: ThemePreference;
  colors: ThemeColors;
  typography: ReturnType<typeof createTypography>;
  typographyScale: TypographyScale;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setTypographyScale: (scale: TypographyScale) => void;
};

const lightColors: ThemeColors = {
  // M3 Core Colors
  primary: "#111827",
  onPrimary: "#ffffff",
  primaryContainer: "#E7F3FF",
  onPrimaryContainer: "#0866FF",

  secondary: "#0e64f6",
  onSecondary: "#ffffff",
  secondaryContainer: "#ecf4fe",
  onSecondaryContainer: "#0e64f6",

  tertiary: "#1c94e6",
  onTertiary: "#ffffff",
  tertiaryContainer: "#E2F3FF",
  onTertiaryContainer: "#1c94e6",

  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#410002",

  surface: "#f6f6f6",
  onSurface: "#0F172A",
  surfaceVariant: "#e0e0e2",
  onSurfaceVariant: "#888888",

  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f1f3",
  surfaceContainer: "#ffffff",
  surfaceContainerHigh: "#e0e0e2",
  surfaceContainerHighest: "#d5d5d7",

  outline: "#79747e",
  outlineVariant: "#e0e0e2",

  inverseSurface: "#2f3033",
  inverseOnSurface: "#f1f0f4",
  inversePrimary: "#d0bcff",
  scrim: "#f1f1f3",

  // Legacy Aliases
  background: "#f6f6f6",
  text: "#0F172A",
  card: "#e0e0e2",
  tabBar: "#f1f1f3",
  tabActive: "#111827",
  tabInactive: "#000000",
  containerContent: "#ffffff",
  divider: "#e0e0e2",
  muted: "#888888",
  verify: "#1c94e6",
  secondaryMuted: "#ecf4fe",
  pillTab: {
    activeBg: "#E7F3FF",
    activeText: "#0866FF",
    inactiveBg: "transparent",
    inactiveText: "#1C1E21",
  },
};

const darkColors: ThemeColors = {
  // M3 Core Colors
  primary: "#E5E7EB",
  onPrimary: "#1f2937",
  primaryContainer: "#263951",
  onPrimaryContainer: "#5890FF",

  secondary: "#0e64f6",
  onSecondary: "#ffffff",
  secondaryContainer: "#263951",
  onSecondaryContainer: "#0866FF",

  tertiary: "#1c94e6",
  onTertiary: "#ffffff",
  tertiaryContainer: "#001b3a",
  onTertiaryContainer: "#5890FF",

  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",

  surface: "#000000",
  onSurface: "#E5E7EB",
  surfaceVariant: "#4a4a4c",
  onSurfaceVariant: "#888888",

  surfaceContainerLowest: "#0d0d0d",
  surfaceContainerLow: "#171719",
  surfaceContainer: "#171719",
  surfaceContainerHigh: "#242426",
  surfaceContainerHighest: "#363638",

  outline: "#938f99",
  outlineVariant: "#363638",

  inverseSurface: "#e3e2e6",
  inverseOnSurface: "#2f3033",
  inversePrimary: "#6750a4",
  scrim: "#171719",

  // Legacy Aliases
  background: "#000000",
  text: "#E5E7EB",
  card: "#4a4a4c",
  tabBar: "#363638",
  tabActive: "#E5E7EB",
  tabInactive: "#ffffff",
  containerContent: "#171719",
  divider: "#363638",
  muted: "#888888",
  verify: "#1c94e6",
  secondaryMuted: "#001b3a",
  pillTab: {
    activeBg: "#263951",
    activeText: "#5890FF",
    inactiveBg: "transparent",
    inactiveText: "#E4E6EB",
  },
};

let ExpoRouter: any = null;
try {
  ExpoRouter = requireNativeModule('ExpoRouter');
} catch {
  // Silent fallback for non-Android / non-expo environments
}

const getMaterialYouColor = (name: string, scheme: ThemeMode, fallback: string): string => {
  if (Platform.OS !== 'android') return fallback;
  try {
    if (!ExpoRouter) {
      ExpoRouter = requireNativeModule('ExpoRouter');
    }
    const color = ExpoRouter.Material3DynamicColor(name, scheme);
    return color || fallback;
  } catch (e) {
    console.warn(`[ThemeContext] Failed to get Material You color for ${name}:`, e);
    return fallback;
  }
};

const getAdaptiveTheme = (): ThemeMode => {
  const hours = new Date().getHours();
  return (hours >= 6 && hours < 18) ? "light" : "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Use persisted settings store for theme preference
  const { themePreference, setThemePreference } = useSettingsStore();
  const colorScheme = useColorScheme();
  const systemTheme: ThemeMode = colorScheme === "dark" ? "dark" : "light";
  const [adaptiveTheme, setAdaptiveTheme] = useState<ThemeMode>(getAdaptiveTheme());
  const [typographyScale, setTypographyScale] = useState<TypographyScale>("m3");

  // Check time for adaptive theme
  useEffect(() => {
    if (themePreference !== 'adaptive') return;

    // Check every minute
    const interval = setInterval(() => {
      setAdaptiveTheme(getAdaptiveTheme());
    }, 60000);

    return () => clearInterval(interval);
  }, [themePreference]);

  // Derive the actual theme from preference
  const theme: ThemeMode =
    themePreference === "system" ? systemTheme :
      themePreference === "adaptive" ? adaptiveTheme :
        themePreference === "material-you" ? systemTheme :
          themePreference;

  // Sync theme with Uniwind (HeroUI Native)
  useEffect(() => {
    if (themePreference === 'system' || themePreference === 'material-you') {
      Uniwind.setTheme('system');
    } else {
      Uniwind.setTheme(theme);
    }
  }, [theme, themePreference]);

  const toggleTheme = useCallback(() => {
    // Toggle between light and dark (not system)
    setThemePreference(theme === "light" ? "dark" : "light");
  }, [theme, setThemePreference]);

  const typography = useMemo(
    () => createTypography(typographyScale),
    [typographyScale]
  );

  const colors = useMemo<ThemeColors>(() => {
    if (Platform.OS === "android" && themePreference === "material-you") {
      const primary = getMaterialYouColor("primary", systemTheme, systemTheme === "light" ? lightColors.primary : darkColors.primary);
      const onPrimary = getMaterialYouColor("onPrimary", systemTheme, systemTheme === "light" ? lightColors.onPrimary : darkColors.onPrimary);
      const primaryContainer = getMaterialYouColor("primaryContainer", systemTheme, systemTheme === "light" ? lightColors.primaryContainer : darkColors.primaryContainer);
      const onPrimaryContainer = getMaterialYouColor("onPrimaryContainer", systemTheme, systemTheme === "light" ? lightColors.onPrimaryContainer : darkColors.onPrimaryContainer);

      const secondary = getMaterialYouColor("secondary", systemTheme, systemTheme === "light" ? lightColors.secondary : darkColors.secondary);
      const onSecondary = getMaterialYouColor("onSecondary", systemTheme, systemTheme === "light" ? lightColors.onSecondary : darkColors.onSecondary);
      const secondaryContainer = getMaterialYouColor("secondaryContainer", systemTheme, systemTheme === "light" ? lightColors.secondaryContainer : darkColors.secondaryContainer);
      const onSecondaryContainer = getMaterialYouColor("onSecondaryContainer", systemTheme, systemTheme === "light" ? lightColors.onSecondaryContainer : darkColors.onSecondaryContainer);

      const tertiary = getMaterialYouColor("tertiary", systemTheme, systemTheme === "light" ? lightColors.tertiary : darkColors.tertiary);
      const onTertiary = getMaterialYouColor("onTertiary", systemTheme, systemTheme === "light" ? lightColors.onTertiary : darkColors.onTertiary);
      const tertiaryContainer = getMaterialYouColor("tertiaryContainer", systemTheme, systemTheme === "light" ? lightColors.tertiaryContainer : darkColors.tertiaryContainer);
      const onTertiaryContainer = getMaterialYouColor("onTertiaryContainer", systemTheme, systemTheme === "light" ? lightColors.onTertiaryContainer : darkColors.onTertiaryContainer);

      const error = getMaterialYouColor("error", systemTheme, systemTheme === "light" ? lightColors.error : darkColors.error);
      const onError = getMaterialYouColor("onError", systemTheme, systemTheme === "light" ? lightColors.onError : darkColors.onError);
      const errorContainer = getMaterialYouColor("errorContainer", systemTheme, systemTheme === "light" ? lightColors.errorContainer : darkColors.errorContainer);
      const onErrorContainer = getMaterialYouColor("onErrorContainer", systemTheme, systemTheme === "light" ? lightColors.onErrorContainer : darkColors.onErrorContainer);

      const surface = getMaterialYouColor("background", systemTheme, systemTheme === "light" ? lightColors.surface : darkColors.surface);
      const onSurface = getMaterialYouColor("onSurface", systemTheme, systemTheme === "light" ? lightColors.onSurface : darkColors.onSurface);
      const surfaceVariant = getMaterialYouColor("surfaceVariant", systemTheme, systemTheme === "light" ? lightColors.surfaceVariant : darkColors.surfaceVariant);
      const onSurfaceVariant = getMaterialYouColor("onSurfaceVariant", systemTheme, systemTheme === "light" ? lightColors.onSurfaceVariant : darkColors.onSurfaceVariant);

      const surfaceContainerLowest = getMaterialYouColor("surfaceContainerLowest", systemTheme, systemTheme === "light" ? lightColors.surfaceContainerLowest : darkColors.surfaceContainerLowest);
      const surfaceContainerLow = getMaterialYouColor("surfaceContainerLow", systemTheme, systemTheme === "light" ? lightColors.surfaceContainerLow : darkColors.surfaceContainerLow);
      const surfaceContainer = getMaterialYouColor("surfaceContainer", systemTheme, systemTheme === "light" ? lightColors.surfaceContainer : darkColors.surfaceContainer);
      const surfaceContainerHigh = getMaterialYouColor("surfaceContainerHigh", systemTheme, systemTheme === "light" ? lightColors.surfaceContainerHigh : darkColors.surfaceContainerHigh);
      const surfaceContainerHighest = getMaterialYouColor("surfaceContainerHighest", systemTheme, systemTheme === "light" ? lightColors.surfaceContainerHighest : darkColors.surfaceContainerHighest);

      const outline = getMaterialYouColor("outline", systemTheme, systemTheme === "light" ? lightColors.outline : darkColors.outline);
      const outlineVariant = getMaterialYouColor("outlineVariant", systemTheme, systemTheme === "light" ? lightColors.outlineVariant : darkColors.outlineVariant);

      const inverseSurface = getMaterialYouColor("inverseSurface", systemTheme, systemTheme === "light" ? lightColors.inverseSurface : darkColors.inverseSurface);
      const inverseOnSurface = getMaterialYouColor("inverseOnSurface", systemTheme, systemTheme === "light" ? lightColors.inverseOnSurface : darkColors.inverseOnSurface);
      const inversePrimary = getMaterialYouColor("inversePrimary", systemTheme, systemTheme === "light" ? lightColors.inversePrimary : darkColors.inversePrimary);
      const scrim = getMaterialYouColor("scrim", systemTheme, systemTheme === "light" ? lightColors.scrim : darkColors.scrim);
      return {
        primary,
        onPrimary,
        primaryContainer,
        onPrimaryContainer,
        secondary,
        onSecondary,
        secondaryContainer,
        onSecondaryContainer,
        tertiary,
        onTertiary,
        tertiaryContainer,
        onTertiaryContainer,
        error,
        onError,
        errorContainer,
        onErrorContainer,
        surface,
        onSurface,
        surfaceVariant,
        onSurfaceVariant,
        surfaceContainerLowest,
        surfaceContainerLow,
        surfaceContainer,
        surfaceContainerHigh,
        surfaceContainerHighest,
        outline,
        outlineVariant,
        inverseSurface,
        inverseOnSurface,
        inversePrimary,
        scrim,

        // Legacy Aliases mapped directly to standard M3 roles
        background: surface,
        text: onSurface,
        card: surfaceContainerHigh,
        tabBar: surfaceContainerLow,
        tabActive: primary,
        tabInactive: onSurfaceVariant,
        containerContent: surfaceContainer,
        divider: outlineVariant,
        muted: onSurfaceVariant,
        verify: primary,
        secondaryMuted: secondaryContainer,
        pillTab: {
          activeBg: primaryContainer,
          activeText: onPrimaryContainer,
          inactiveBg: "transparent",
          inactiveText: onSurfaceVariant,
        },
      };
    }
    return theme === "light" ? lightColors : darkColors;
  }, [theme, themePreference, systemTheme]);

  const value = useMemo(
    () => ({
      theme,
      themePreference,
      colors,
      typography,
      typographyScale,
      toggleTheme,
      setThemePreference,
      setTypographyScale,
    }),
    [theme, themePreference, colors, typography, typographyScale, toggleTheme, setThemePreference, setTypographyScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
};

