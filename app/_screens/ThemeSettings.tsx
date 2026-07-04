import { CustomSurface } from "@/components/CustomSurface";
import { FlexText } from "@/components/FlexText";
import { ThemeColors, ThemePreference, useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import Palette from "@/assets/images/svg/palette.svg";
import LightMode from "@/assets/images/svg/mode-light.svg";
import DarkMode from "@/assets/images/svg/mode-dark.svg";
import MobileMode from "@/assets/images/svg/mobile.svg";
import Time from "@/assets/images/svg/time.svg";
import CheckCircle from "@/assets/images/svg/check-circle.svg";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Only static, non-translatable data lives outside the component.
// Translatable strings (label, description) are fetched via t() at render time.
type ThemeOption = {
    id: ThemePreference;
    icon: React.ComponentType<any>;
};

const ThemeSettingsScreen = () => {
    const { colors, themePreference, setThemePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();

    const themeOptions = useMemo<ThemeOption[]>(() => [
        { id: "light", icon: LightMode },
        { id: "dark", icon: DarkMode },
        { id: "system", icon: MobileMode },
        { id: "adaptive", icon: Time },
        ...(Platform.OS === 'android' ? [{ id: "material-you" as ThemePreference, icon: Palette }] : []),
    ], []);

    return (
        <ScrollView style={[common.screenPadding, { backgroundColor: colors.background }]}>
            <View style={{ position: 'absolute', top: inset.top, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Ionicons name='chevron-back' size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </View>
            <View style={{ marginTop: inset.top + 50 }}></View>

            <FlexText style={[styles.title]}>{t('themeSettings.title')}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t('themeSettings.subtitle')}
            </FlexText>

            <View style={{ gap: 3 }}>
                {themeOptions.map((option, index) => (
                    <CustomSurface
                        key={option.id}
                        isFirst={index === 0}
                        isLast={index === themeOptions.length - 1}
                        onPress={() => setThemePreference(option.id)}
                        style={styles.option}
                    >
                        <View style={styles.optionLeft}>
                            <SquircleView cornerSmoothing={100} preserveSmoothing={true} style={[styles.iconContainer, themePreference === option.id && styles.iconContainerActive]}>
                                <option.icon
                                    width={24}
                                    height={24}
                                    color={themePreference === option.id ? "#fff" : colors.text}
                                />
                            </SquircleView>
                            <View style={styles.optionText}>
                                <FlexText style={[common.body]}>
                                    {t(`themeSettings.options.${option.id}.label`)}
                                </FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                    {t(`themeSettings.options.${option.id}.description`)}
                                </FlexText>
                            </View>
                        </View>
                        {themePreference === option.id && (
                            <CheckCircle width={24} height={24} color="#54d340" />
                        )}
                    </CustomSurface>
                ))}
            </View>
        </ScrollView>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
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
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainerActive: {
        backgroundColor: "#54d340",
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 8,
    },
});

export default ThemeSettingsScreen;
