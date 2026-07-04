import CheckCircle from "@/assets/images/svg/check-circle.svg";
import { CustomSurface } from "@/components/CustomSurface";
import { FlexText } from "@/components/FlexText";
import { TranslationLanguageSheet } from "@/components/post/TranslationLanguageSheet";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n";
import { LanguageMode, useLanguageStore } from "@/stores/language";
import { useTranslationStore } from "@/stores/translation";
import { createCommonStyles } from "@/styles/common";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Option definitions ───────────────────────────────────────────────────────

type LanguageOption =
    | { kind: 'auto' }
    | { kind: 'manual'; lang: SupportedLanguage };

const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    zh: '简体中文',
    'zh-Hant': '繁體中文',
};

const LANGUAGE_SHORT_CODES: Record<SupportedLanguage, string> = {
    en: 'EN',
    vi: 'VI',
    zh: '简',
    'zh-Hant': '繁',
};

const isOptionActive = (
    option: LanguageOption,
    mode: LanguageMode,
    language: SupportedLanguage,
) => {
    if (option.kind === 'auto') return mode === 'auto';
    return mode === 'manual' && language === option.lang;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const LanguageSettingsScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();

    const { mode, language, translationLanguage, setAuto, setManual } = useLanguageStore();
    const { setActivePost } = useTranslationStore();

    const options: LanguageOption[] = [
        { kind: 'auto' },
        ...SUPPORTED_LANGUAGES.map((lang) => ({ kind: 'manual' as const, lang })),
    ];

    const handleSelect = (option: LanguageOption) => {
        if (option.kind === 'auto') {
            setAuto();
        } else {
            setManual(option.lang);
        }
    };

    return (
        <ScrollView style={[common.screenPadding, { backgroundColor: colors.background }]}>
            <View style={{ position: 'absolute', top: inset.top, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View style={{ marginTop: inset.top + 50 }} />

            <FlexText style={styles.title}>{t('languageSettings.title')}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t('languageSettings.subtitle')}
            </FlexText>

            <View style={{ gap: 3, marginBottom: 24 }}>
                {options.map((option, index) => {
                    const active = isOptionActive(option, mode, language);
                    const label =
                        option.kind === 'auto'
                            ? t('languageSettings.autoOption')
                            : LANGUAGE_LABELS[option.lang];
                    const description =
                        option.kind === 'auto'
                            ? `${t('languageSettings.autoOptionDesc')} (${LANGUAGE_LABELS[language]})`
                            : `${LANGUAGE_NATIVE_NAMES[option.lang]} (${option.lang.toUpperCase()})`;

                    return (
                        <CustomSurface
                            key={option.kind === 'auto' ? 'auto' : option.lang}
                            isFirst={index === 0}
                            isLast={index === options.length - 1}
                            onPress={() => handleSelect(option)}
                            style={styles.option}
                        >
                            <View style={styles.optionLeft}>
                                <SquircleView
                                    cornerSmoothing={100}
                                    preserveSmoothing
                                    style={[
                                        styles.iconContainer,
                                        active && styles.iconContainerActive,
                                    ]}
                                >
                                    {option.kind === 'auto' ? (
                                        <Ionicons
                                            name="phone-portrait-outline"
                                            size={22}
                                            color={active ? '#fff' : colors.text}
                                        />
                                    ) : (
                                        <FlexText
                                            style={[
                                                styles.langCode,
                                                { color: active ? '#fff' : colors.text },
                                            ]}
                                        >
                                            {LANGUAGE_SHORT_CODES[option.lang]}
                                        </FlexText>
                                    )}
                                </SquircleView>
                                <View style={styles.optionText}>
                                    <FlexText style={common.body}>{label}</FlexText>
                                    <FlexText
                                        style={[common.bodySmall, { color: colors.muted }]}
                                    >
                                        {description}
                                    </FlexText>
                                </View>
                            </View>
                            {active && <CheckCircle width={24} height={24} color="#54d340" />}
                        </CustomSurface>
                    );
                })}
            </View>

            {/* Translation Language Settings */}
            <FlexText style={styles.title}>{t('languageSettings.translationTitle', 'Translation Language')}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t('languageSettings.translationSubtitle', 'Select your preferred language for translations in your feed.')}
            </FlexText>

            <View style={{ gap: 3, marginBottom: inset.bottom + 32 }}>
                <CustomSurface
                    position="single"
                    onPress={() => {
                        setActivePost(null, null);
                        TrueSheet.present('translation-language-sheet');
                    }}
                    style={styles.option}
                >
                    <View style={styles.optionLeft}>
                        <View style={styles.optionText}>
                            <FlexText style={common.body}>
                                {LANGUAGE_LABELS[translationLanguage] || translationLanguage}
                            </FlexText>
                            <FlexText
                                style={[common.bodySmall, { color: colors.muted }]}
                            >
                                {LANGUAGE_NATIVE_NAMES[translationLanguage] || translationLanguage}
                            </FlexText>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </CustomSurface>
            </View>
            <TranslationLanguageSheet />
        </ScrollView>
    );
};

const style = (colors: ThemeColors, common: any) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.containerContent,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
        },
        title: {
            ...common.title,
            marginBottom: 4,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        optionLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        optionText: {
            marginLeft: 12,
            flex: 1,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.card,
            justifyContent: 'center',
            alignItems: 'center',
        },
        iconContainerActive: {
            backgroundColor: '#54d340',
        },
        langCode: {
            fontWeight: '700',
            fontSize: 13,
        },
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 8,
        },
    });

export default LanguageSettingsScreen;
