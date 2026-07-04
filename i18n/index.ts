import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languageStorage } from '../services/storage';

import en from './locales/en';
import vi from './locales/vi';
import zh from './locales/zh';
import zhHant from './locales/zhHant';

// ─── Supported languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'vi', 'zh', 'zh-Hant'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    zh: '简体中文',
    'zh-Hant': '繁體中文',
};

const DAYJS_LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
    en: 'en',
    vi: 'vi',
    zh: 'zh-cn',
    'zh-Hant': 'zh-tw',
};

// ─── MMKV storage (shared with language store) ────────────────────────────────

export const LANGUAGE_KEY = 'app-language';
export const LANGUAGE_MODE_KEY = 'app-language-mode';
export { languageStorage };

// ─── Resolve the device locale to a supported language ───────────────────────

export const getDeviceLanguage = (): SupportedLanguage => {
    const locale = getLocales()[0];
    const code = locale?.languageCode ?? 'en';
    const tag = locale?.languageTag ?? '';
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
        return code as SupportedLanguage;
    }
    if (code.startsWith('zh')) {
        if (tag.toLowerCase().includes('hant') || tag.toLowerCase().includes('tw') || tag.toLowerCase().includes('hk') || tag.toLowerCase().includes('mo')) {
            return 'zh-Hant';
        }
        return 'zh';
    }
    return 'en';
};

// ─── Resolve the language to boot with ───────────────────────────────────────
// Priority: 1) manual selection in MMKV  2) auto (device locale)  3) 'en'

const getInitialLanguage = (): SupportedLanguage => {
    const mode = languageStorage.getString(LANGUAGE_MODE_KEY);
    if (mode === 'manual') {
        const saved = languageStorage.getString(LANGUAGE_KEY);
        if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
            return saved as SupportedLanguage;
        }
    }
    return getDeviceLanguage();
};

const applyDayjsLocale = (language: SupportedLanguage) => {
    dayjs.locale(DAYJS_LOCALE_BY_LANGUAGE[language]);
};

// ─── i18next initialisation ───────────────────────────────────────────────────

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        vi: { translation: vi },
        zh: { translation: zh },
        'zh-Hant': { translation: zhHant },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

// Keep dayjs locale in sync with app language globally.
applyDayjsLocale(getInitialLanguage());
i18n.on('languageChanged', (lng) => {
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lng)) {
        applyDayjsLocale(lng as SupportedLanguage);
    }
});

export default i18n;

// ─── TypeScript: full autocomplete for t() ───────────────────────────────────

type EnTranslation = typeof en;

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: EnTranslation;
        };
    }
}
