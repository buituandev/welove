import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { settingsStorage as mmkv } from '../services/storage';

export type ThemePreference = 'light' | 'dark' | 'system' | 'adaptive' | 'material-you';

// Cache size options in bytes
export const CACHE_SIZE_OPTIONS = [
    { label: '200 MB', value: 200 * 1024 * 1024 },
    { label: '500 MB', value: 500 * 1024 * 1024 },
    { label: '1 GB', value: 1024 * 1024 * 1024 },
    { label: '2 GB', value: 2 * 1024 * 1024 * 1024 },
] as const;

interface SettingsStore {
    showSensitiveContent: boolean;
    setShowSensitiveContent: (show: boolean) => void;
    toggleShowSensitiveContent: () => void;
    // Carousel settings
    showCarousel: boolean;
    setShowCarousel: (show: boolean) => void;
    toggleCarousel: () => void;
    // Theme settings
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;

    // Video cache settings
    videoCacheSizeLimit: number; // in bytes
    setVideoCacheSizeLimit: (sizeBytes: number) => void;

    // Profile Design   
    profileDesign: 'v3' | 'classic';
    setProfileDesign: (design: 'v3' | 'classic') => void;

    // Bottom bar design
    makeBottomBarCurve: boolean;
    setMakeBottomBarCurve: (curve: boolean) => void;
    toggleMakeBottomBarCurve: () => void;

    // Autoplay setting
    disableAutoplay: boolean;
    setDisableAutoplay: (disable: boolean) => void;
    toggleDisableAutoplay: () => void;

    // Gemini Nano support
    isGeminiNanoAvailable: boolean;
    setGeminiNanoAvailable: (available: boolean) => void;
    checkGeminiNanoAvailability: () => Promise<boolean>;

    // Third-party upload keys and settings
    imgbbApiKey: string;
    setImgbbApiKey: (key: string) => void;
    x02ApiKey: string;
    setX02ApiKey: (key: string) => void;
    reset: () => void;
}

const mmkvZustandStorage = createJSONStorage(() => ({
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string): void => mmkv.set(name, value),
    removeItem: (name: string): boolean => mmkv.remove(name),
}));

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            showSensitiveContent: false,
            setShowSensitiveContent: (show) => set({ showSensitiveContent: show }),
            toggleShowSensitiveContent: () => set((state) => ({ showSensitiveContent: !state.showSensitiveContent })),
            // Carousel settings
            showCarousel: true, // Default to showing carousel
            setShowCarousel: (show) => set({ showCarousel: show }),
            toggleCarousel: () => set((state) => ({ showCarousel: !state.showCarousel })),
            // Theme settings
            themePreference: 'system', // Default to system
            setThemePreference: (preference) => set({ themePreference: preference }),

            // Video cache
            videoCacheSizeLimit: 500 * 1024 * 1024, // Default 500 MB
            setVideoCacheSizeLimit: (sizeBytes) => set({ videoCacheSizeLimit: sizeBytes }),
            // Profile Design
            profileDesign: 'v3',
            setProfileDesign: (design) => set({ profileDesign: design }),

            // Bottom bar design
            makeBottomBarCurve: false,
            setMakeBottomBarCurve: (curve) => set({ makeBottomBarCurve: curve }),
            toggleMakeBottomBarCurve: () => set((state) => ({ makeBottomBarCurve: !state.makeBottomBarCurve })),

            // Autoplay setting
            disableAutoplay: false, // Default is false (autoplay is active)
            setDisableAutoplay: (disable) => set({ disableAutoplay: disable }),
            toggleDisableAutoplay: () => set((state) => ({ disableAutoplay: !state.disableAutoplay })),

            // Gemini Nano support
            isGeminiNanoAvailable: false,
            setGeminiNanoAvailable: (available) => set({ isGeminiNanoAvailable: available }),
            checkGeminiNanoAvailability: async () => {
                try {
                    const { isAvailable } = require('react-native-gemini-nano');
                    const available = await isAvailable();
                    set({ isGeminiNanoAvailable: available });
                    return available;
                } catch (e) {
                    console.warn('Error checking Gemini Nano availability:', e);
                    set({ isGeminiNanoAvailable: false });
                    return false;
                }
            },

            // Third-party upload settings
            imgbbApiKey: '',
            setImgbbApiKey: (key) => set({ imgbbApiKey: key }),
            x02ApiKey: '',
            setX02ApiKey: (key) => set({ x02ApiKey: key }),
            reset: () => set({
                showSensitiveContent: false,
                showCarousel: true,
                themePreference: 'system',
                videoCacheSizeLimit: 500 * 1024 * 1024,
                profileDesign: 'v3',
                makeBottomBarCurve: false,
                disableAutoplay: false,
                isGeminiNanoAvailable: false,
                imgbbApiKey: '',
                x02ApiKey: '',
            }),
        }),
        {
            name: 'settings-storage',
            storage: mmkvZustandStorage,
        }
    )
);

// Trigger check on load asynchronously
useSettingsStore.getState().checkGeminiNanoAvailability().catch(() => {});


