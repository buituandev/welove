import i18n, {
    LANGUAGE_KEY,
    LANGUAGE_MODE_KEY,
    SUPPORTED_LANGUAGES,
    SupportedLanguage,
    getDeviceLanguage,
    languageStorage,
} from '@/i18n';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LanguageMode = 'auto' | 'manual';

export const TRANSLATION_LANGUAGE_KEY = 'translation-language';

interface LanguageStore {
    mode: LanguageMode;
    /** The resolved language that is currently active in i18n. */
    language: SupportedLanguage;
    /** The preferred language for translating posts in feed. */
    translationLanguage: SupportedLanguage;
    /** Switch to auto mode — language tracks the device locale. */
    setAuto: () => void;
    /** Pin to a specific language regardless of device locale. */
    setManual: (lang: SupportedLanguage) => void;
    /** Set translation target language. */
    setTranslationLanguage: (lang: SupportedLanguage) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPersistedMode = (): LanguageMode =>
    languageStorage.getString(LANGUAGE_MODE_KEY) === 'manual' ? 'manual' : 'auto';

const getPersistedLanguage = (): SupportedLanguage => {
    const mode = getPersistedMode();
    if (mode === 'manual') {
        const saved = languageStorage.getString(LANGUAGE_KEY);
        if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
            return saved as SupportedLanguage;
        }
    }
    return i18n.language as SupportedLanguage;
};

const getPersistedTranslationLanguage = (): SupportedLanguage => {
    const saved = languageStorage.getString(TRANSLATION_LANGUAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
        return saved as SupportedLanguage;
    }
    return getPersistedLanguage();
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLanguageStore = create<LanguageStore>()((set) => ({
    mode: getPersistedMode(),
    language: getPersistedLanguage(),
    translationLanguage: getPersistedTranslationLanguage(),

    setAuto: () => {
        const resolved = getDeviceLanguage();
        languageStorage.set(LANGUAGE_MODE_KEY, 'auto');
        languageStorage.remove(LANGUAGE_KEY);
        i18n.changeLanguage(resolved);
        
        const hasSavedTranslation = languageStorage.contains(TRANSLATION_LANGUAGE_KEY);
        const transLang = hasSavedTranslation 
            ? (languageStorage.getString(TRANSLATION_LANGUAGE_KEY) as SupportedLanguage) 
            : resolved;

        set({ mode: 'auto', language: resolved, translationLanguage: transLang });
    },

    setManual: (lang) => {
        languageStorage.set(LANGUAGE_MODE_KEY, 'manual');
        languageStorage.set(LANGUAGE_KEY, lang);
        i18n.changeLanguage(lang);

        const hasSavedTranslation = languageStorage.contains(TRANSLATION_LANGUAGE_KEY);
        const transLang = hasSavedTranslation 
            ? (languageStorage.getString(TRANSLATION_LANGUAGE_KEY) as SupportedLanguage) 
            : lang;

        set({ mode: 'manual', language: lang, translationLanguage: transLang });
    },

    setTranslationLanguage: (lang) => {
        languageStorage.set(TRANSLATION_LANGUAGE_KEY, lang);
        set({ translationLanguage: lang });
    },
}));

// ─── Android AppState sync ────────────────────────────────────────────────────
// On iOS the app fully restarts on a locale change, so init covers it.
// On Android the app stays alive — we re-detect the device language each time
// the app comes back to the foreground (per the expo-localization docs).

export function useAutoLanguageSync() {
    const { mode, language, setAuto } = useLanguageStore();

    useEffect(() => {
        if (mode !== 'auto') return;

        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                const newLang = getDeviceLanguage();
                if (newLang !== language) {
                    setAuto();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [mode, language, setAuto]);
}
