import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { LANGUAGE_LABELS } from "../../i18n";
import { LANGUAGES } from "../../i18n/languages";
import { useLanguageStore } from "../../stores/language";
import { useTranslationStore } from "../../stores/translation";
import { createCommonStyles } from "../../styles/common";
import { FlexText } from "../FlexText";

export interface TranslationLanguageSheetHandle {
    present: () => void;
    dismiss: () => void;
}

// ─── Deduplicated and sorted language list (Lazy-loaded and cached) ───────────
let cachedTranslationLanguages: { code: string; name: string; nativeName: string }[] | null = null;

const getTranslationLanguages = () => {
    if (cachedTranslationLanguages) return cachedTranslationLanguages;

    cachedTranslationLanguages = [
        ...LANGUAGES.filter(
            (lang, index, self) =>
                lang.code2 &&
                index === self.findIndex((t) => t.code2 === lang.code2)
        ).map(lang => {
            const label = (LANGUAGE_LABELS as Record<string, string>)[lang.code2] || lang.name;
            return {
                code: lang.code2,
                name: label,
                nativeName: lang.name,
            };
        }),
        { code: 'zh-Hant', name: LANGUAGE_LABELS['zh-Hant'] || '繁體中文', nativeName: 'Traditional Chinese' }
    ].sort((a, b) => a.name.localeCompare(b.name));

    return cachedTranslationLanguages;
};

export const TranslationLanguageSheet = memo(forwardRef<TranslationLanguageSheetHandle, unknown>(
    (_, ref) => {
        const { colors, typography } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const insets = useSafeAreaInsets();

        const sheetRef = useRef<TrueSheet>(null);
        const translationLangs = React.useMemo(() => getTranslationLanguages(), []);

        const { translationLanguage } = useLanguageStore();
        const { activePostId, activePostContent, translations, translate } = useTranslationStore();
        const currentTargetLanguage = activePostId ? (translations[activePostId]?.targetLanguage || translationLanguage) : translationLanguage;

        useImperativeHandle(ref, () => ({
            present: () => {
                sheetRef.current?.present();
            },
            dismiss: () => {
                sheetRef.current?.dismiss();
            },
        }), []);

        const { setTranslationLanguage } = useLanguageStore();

        const handleLanguageSelect = useCallback(async (lang: string) => {
            sheetRef.current?.dismiss();
            if (activePostId && activePostContent) {
                await translate(activePostId, activePostContent, lang);
            } else {
                setTranslationLanguage(lang as any);
            }
        }, [activePostId, activePostContent, translate, setTranslationLanguage]);

        return (
            <TrueSheet
                ref={sheetRef}
                name="translation-language-sheet"
                scrollable={true}
                backgroundColor={colors.surfaceContainer}
                grabberOptions={{
                    color: colors.onSurfaceVariant || "#C4C4C4",
                    height: 5,
                    width: 40,
                }}
                cornerRadius={32}
                detents={[1]}
            >
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
                    <FlexText style={[common.heading, { marginBottom: 12 }]}>{t('post.selectLanguage', 'Select Translation Language')}</FlexText>
                    <FlatList
                        nestedScrollEnabled={true}
                        data={translationLangs}
                        keyExtractor={(item) => item.code}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                        renderItem={({ item }) => {
                            const isSelected = currentTargetLanguage === item.code;
                            return (
                                <TouchableOpacity
                                    onPress={() => handleLanguageSelect(item.code)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                    }}
                                >
                                    <View style={{ marginRight: 12 }}>
                                        <Ionicons
                                            name={isSelected ? "radio-button-on" : "radio-button-off"}
                                            size={20}
                                            color={isSelected ? colors.primary : colors.onSurfaceVariant || "#888888"}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <FlexText style={[
                                            common.body,
                                            {
                                                color: colors.onSurface,
                                                fontWeight: isSelected ? '600' : '400'
                                            }
                                        ]}>
                                            {item.name}
                                        </FlexText>
                                        {item.nativeName !== item.name && (
                                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }]}>
                                                {item.nativeName}
                                            </FlexText>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </TrueSheet>
        );
    }
));

TranslationLanguageSheet.displayName = "TranslationLanguageSheet";
