import { create } from 'zustand';
import { guessLanguageAsync } from "@bsky.app/expo-guess-language";
import { onTranslateTask } from "@bsky.app/expo-translate-text";

import i18n from '../i18n';

export interface TranslationState {
    translatedText: string | null;
    isTranslating: boolean;
    translationError: string | null;
    detectedLanguage: string | null;
    targetLanguage: string;
}

interface TranslationStore {
    translations: Record<string, TranslationState>;
    translate: (postId: string, text: string, targetLanguage: string) => Promise<void>;
    clearTranslation: (postId: string) => void;
    
    // Active post details for the global language selector sheet
    activePostId: string | null;
    activePostContent: string | null;
    setActivePost: (postId: string | null, content: string | null) => void;
}

export const useTranslationStore = create<TranslationStore>((set, get) => ({
    translations: {},
    activePostId: null,
    activePostContent: null,

    translate: async (postId, text, targetLanguage) => {
        set((state) => ({
            translations: {
                ...state.translations,
                [postId]: {
                    translatedText: null,
                    isTranslating: true,
                    translationError: null,
                    detectedLanguage: null,
                    targetLanguage,
                }
            }
        }));

        try {
            const guessed = await guessLanguageAsync(text) as any;
            const sourceLang = guessed?.[0]?.language || 'auto';
            
            const formattedTarget = targetLanguage.split('-')[0];
            const formattedSource = sourceLang === 'auto' ? undefined : sourceLang.split('-')[0];

            if (formattedSource && formattedSource === formattedTarget) {
                throw new Error("same_language");
            }

            const res = await onTranslateTask({
                input: text,
                targetLangCode: formattedTarget,
                sourceLangCode: formattedSource,
            }) as any;

            const translated = typeof res.translatedTexts === 'string' ? res.translatedTexts : ((res.translatedTexts as any)?.[0] || '');
            if (translated) {
                set((state) => ({
                    translations: {
                        ...state.translations,
                        [postId]: {
                            translatedText: translated,
                            isTranslating: false,
                            translationError: null,
                            detectedLanguage: sourceLang,
                            targetLanguage,
                        }
                    }
                }));
            } else {
                throw new Error("Empty translation result");
            }
        } catch (error: any) {
            console.error("Translation failed", error);
            let errMsg = error.message || "Translation failed";
            if (error.message === "same_language") {
                errMsg = i18n.t('post.sameLanguageError', 'The text/caption is already in your selected language');
            }
            set((state) => ({
                translations: {
                    ...state.translations,
                    [postId]: {
                        translatedText: null,
                        isTranslating: false,
                        translationError: errMsg,
                        detectedLanguage: null,
                        targetLanguage,
                    }
                }
            }));
        }
    },

    clearTranslation: (postId) => {
        set((state) => {
            const copy = { ...state.translations };
            delete copy[postId];
            return { translations: copy };
        });
    },

    setActivePost: (postId, content) => {
        set({ activePostId: postId, activePostContent: content });
    }
}));
