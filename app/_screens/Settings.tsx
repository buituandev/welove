import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { LANGUAGE_LABELS } from "@/i18n";
import { useAdminCheck } from "@/services/userprofile";
import { clearVideoCache, formatBytes, getCacheCount, getCacheSize, setMaxCacheSize } from "@/services/videoCache";
import { useLanguageStore } from "@/stores/language";

import Logout from "@/assets/images/svg/logout.svg";
import { CustomSurface } from "@/components/CustomSurface";
import { useAppLockStore } from "@/stores/appLock";
import { CACHE_SIZE_OPTIONS, useSettingsStore } from "@/stores/settings";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router } from "expo-router";
import { Button } from "heroui-native/button";
import { ControlField } from "heroui-native/control-field";
import { Dialog } from "heroui-native/dialog";
import { Input } from "heroui-native/input";
import { Select } from "heroui-native/select";
import { Spinner } from "heroui-native/spinner";
import { TextField } from "heroui-native/text-field";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Easing, Keyboard, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";




const SettingsScreen = () => {
    const { colors, themePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();
    const { mode: languageMode, language } = useLanguageStore();
    const {
        showSensitiveContent, toggleShowSensitiveContent,
        showCarousel, toggleCarousel,
        videoCacheSizeLimit, setVideoCacheSizeLimit,
        imgbbApiKey, setImgbbApiKey,
        x02ApiKey, setX02ApiKey,
        makeBottomBarCurve, toggleMakeBottomBarCurve,
        disableAutoplay, toggleDisableAutoplay,
        isGeminiNanoAvailable, checkGeminiNanoAvailability,
    } = useSettingsStore();
    const { appLockEnabled } = useAppLockStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ─── Cache state ────────────────────────────────────────────
    const [cacheSize, setCacheSize] = useState(0);
    const [cacheCount, setCacheCount] = useState(0);
    const [isClearing, setIsClearing] = useState(false);
    const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);
    const { data: adminData } = useAdminCheck();
    const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin);

    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Keep the absolute search bar above the keyboard.
    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);



    const refreshCacheInfo = useCallback(async () => {
        const [size, count] = await Promise.all([getCacheSize(), getCacheCount()]);
        setCacheSize(size);
        setCacheCount(count);
    }, []);

    const themePreferenceLabels = {
        light: t('settings.light'),
        dark: t('settings.dark'),
        system: t('settings.system'),
        adaptive: t('settings.adaptive'),
        'material-you': t('themeSettings.options.material-you.label')
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            refreshCacheInfo();
        }, 0);
        return () => clearTimeout(timer);
    }, [refreshCacheInfo]);

    // Sync the cache limit on mount 
    useEffect(() => {
        setMaxCacheSize(videoCacheSizeLimit);
    }, [videoCacheSizeLimit]);

    // Check Gemini Nano availability on mount
    useEffect(() => {
        checkGeminiNanoAvailability().catch((e) => {
            console.warn("Failed to check Gemini Nano availability", e);
        });
    }, [checkGeminiNanoAvailability]);

    const handleClearCache = useCallback(() => {
        setIsClearCacheDialogOpen(true);
    }, []);

    const handleSetCacheLimit = useCallback(async (sizeBytes: number) => {
        setVideoCacheSizeLimit(sizeBytes);
        await setMaxCacheSize(sizeBytes);
        await refreshCacheInfo();
    }, [setVideoCacheSizeLimit, refreshCacheInfo]);

    const cacheUsagePercent = videoCacheSizeLimit > 0
        ? Math.min(cacheSize / videoCacheSizeLimit, 1)
        : 0;

    const currentLimitLabel = CACHE_SIZE_OPTIONS.find(o => o.value === videoCacheSizeLimit)?.label || formatBytes(videoCacheSizeLimit);

    const { colors: fadeColors, locations: fadeLocations } = easeGradient({
        colorStops: {
            0: {
                color: colors.surface,
                easing: Easing.ease,
            },
            1: {
                color: 'transparent',
            },
        },
        easing: Easing.linear,
        extraColorStopsPerTransition: 16,
    });

    return (
        <View style={common.screen}>
            <View style={{ position: 'absolute', top: inset.top + 16, left: 16, zIndex: 1000 }}>
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
            <KeyboardAvoidingView behavior="padding">
                <ScrollView style={common.screenPadding}>
                    <View style={{ marginTop: inset.top + 66 }}></View>
                    <FlexText style={[styles.title]}>{t('settings.accountAndSecurity')}</FlexText>
                    <View style={{ gap: 3 }}>
                        <CustomSurface
                            position="single"
                            onPress={() => router.push('/security-settings')}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.security')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {appLockEnabled ? t('settings.securityEnabled') : t('settings.securityDisabled')}
                                </FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    </View>

                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.preferences')}</FlexText>
                    <View style={{ gap: 3 }}>
                        <CustomSurface
                            isFirst
                            onPress={() => router.push('/theme-settings')}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.theme')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{themePreferenceLabels[themePreference]}</FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                        <CustomSurface
                            position="middle"
                            onPress={() => router.push('/language-settings' as Href)}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.language')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {languageMode === 'auto' ? t('settings.languageAuto') : LANGUAGE_LABELS[language]}
                                </FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                        <CustomSurface position="middle" style={styles.option}>
                            <ControlField
                                isSelected={makeBottomBarCurve}
                                onSelectedChange={toggleMakeBottomBarCurve}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.curveBottomBar')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{makeBottomBarCurve ? t('settings.adultFilterOn') : t('settings.adultFilterOff')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                        <CustomSurface position="middle" style={styles.option}>
                            <ControlField
                                isSelected={!showSensitiveContent}
                                onSelectedChange={toggleShowSensitiveContent}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.adultFilter')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{showSensitiveContent ? t('settings.adultFilterOff') : t('settings.adultFilterOn')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                        <CustomSurface position="middle" style={styles.option}>
                            <ControlField
                                isSelected={showCarousel}
                                onSelectedChange={toggleCarousel}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.homeCarousel')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.homeCarouselDescription')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                        <CustomSurface isLast style={styles.option}>
                            <ControlField
                                isSelected={!disableAutoplay}
                                onSelectedChange={toggleDisableAutoplay}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.autoplay')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.autoplayDescription')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                    </View>

                    {/* ─── Third-Party Storage ────────────────────────────────── */}
                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.thirdPartyStorage', 'Third-Party Cloud')}</FlexText>
                    <View style={{ gap: 3 }}>
                        {/* ImgBB API Key Input */}
                        <CustomSurface isFirst>
                            <TextField>
                                <FlexText style={[common.body, { marginBottom: 8 }]}>ImgBB API Key</FlexText>
                                <Input value={imgbbApiKey}
                                    onChangeText={setImgbbApiKey}
                                    variant="secondary"
                                    placeholder="Enter ImgBB API Key"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    secureTextEntry
                                    style={{
                                        backgroundColor: colors.surfaceContainerHighest,
                                        color: colors.onSurfaceVariant,
                                        fontSize: 14,
                                        paddingHorizontal: 16,
                                    }}
                                />
                            </TextField>
                            <FlexText style={[common.caption, { color: colors.onSurfaceVariant, marginTop: 6 }]}>
                                Required for image uploads.
                            </FlexText>
                        </CustomSurface>

                        {/* x02.me API Key Input */}
                        <CustomSurface isLast>
                            <TextField>
                                <FlexText style={[common.body, { marginBottom: 8 }]}>x02.me API Key (Optional)</FlexText>
                                <Input
                                    value={x02ApiKey}
                                    onChangeText={setX02ApiKey}
                                    variant="secondary"
                                    placeholder="Enter x02.me API Key"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    secureTextEntry
                                    style={{
                                        backgroundColor: colors.surfaceContainerHighest,
                                        color: colors.onSurface,
                                        fontSize: 14,
                                        paddingHorizontal: 16,
                                    }}
                                />
                            </TextField>
                            <FlexText style={[common.caption, { color: colors.onSurfaceVariant, marginTop: 6 }]}>
                                Optional for video uploads. Used for file deletion hooks.
                            </FlexText>
                        </CustomSurface>
                    </View>

                    {/* ─── Storage & Cache ──────────────────────────────────── */}
                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.storageCache')}</FlexText>
                    <View style={{ gap: 3 }}>
                        {/* Cache usage bar */}
                        <CustomSurface isFirst>
                            <View style={styles.cacheInfoRow}>
                                <FlexText style={[common.body]}>{t('settings.videoCache')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {formatBytes(cacheSize)} / {currentLimitLabel}
                                </FlexText>
                            </View>
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>
                                {t('settings.videoCacheDescription', { count: cacheCount })}
                            </FlexText>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${Math.max(cacheUsagePercent * 100, 0)}%`,
                                            backgroundColor: cacheUsagePercent > 0.9 ? '#ff4444' : cacheUsagePercent > 0.7 ? '#ffaa00' : '#54d340',
                                        },
                                    ]}
                                />
                            </View>
                        </CustomSurface>

                        {/* Cache size limit picker */}
                        <CustomSurface position="middle" style={{ padding: 0 }}>
                            <Select
                                value={{ value: videoCacheSizeLimit.toString(), label: currentLimitLabel }}
                                onValueChange={(opt: any) => handleSetCacheLimit(Number(opt.value))}
                                presentation="dialog"
                            >
                                <Select.Trigger variant="unstyled" asChild>
                                    <TouchableOpacity style={[styles.option, { padding: 16 }]}>
                                        <View>
                                            <FlexText style={[common.body]}>{t('settings.maxCacheSize')}</FlexText>
                                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{currentLimitLabel}</FlexText>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                                    </TouchableOpacity>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Overlay />
                                    <Select.Content presentation="dialog" >
                                        {CACHE_SIZE_OPTIONS.map((option) => (
                                            <Select.Item key={option.value} value={option.value.toString()} label={option.label} />
                                        ))}
                                    </Select.Content>
                                </Select.Portal>
                            </Select>
                        </CustomSurface>

                        {/* Clear cache button */}
                        <CustomSurface
                            isLast
                            onPress={cacheSize === 0 ? undefined : handleClearCache}
                            style={styles.option}
                        >
                            <FlexText style={[common.body, { color: cacheSize === 0 ? colors.onSurfaceVariant : '#ff4444' }]}>
                                {isClearing ? t('settings.clearCacheClearing') : t('settings.clearCacheIdle')}
                            </FlexText>
                            {isClearing && <Spinner size="md" color={colors.onSurfaceVariant} />}
                        </CustomSurface>
                    </View>

                    {/* ─── Gemini Nano Status ────────────────────────────────── */}
                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.onDeviceAi')}</FlexText>
                    <View style={{ gap: 3 }}>
                        <CustomSurface position="single" style={styles.option}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 16 }}>
                                    <FlexText style={common.body}>Gemini Nano</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                                        {isGeminiNanoAvailable
                                            ? t('settings.geminiNanoAvailable')
                                            : t('settings.geminiNanoUnavailable')}
                                    </FlexText>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: isGeminiNanoAvailable ? '#54d340' : colors.onSurfaceVariant
                                    }} />
                                    <FlexText style={[common.bodySmall, {
                                        color: isGeminiNanoAvailable ? '#54d340' : colors.onSurfaceVariant,
                                        fontWeight: '600'
                                    }]}>
                                        {isGeminiNanoAvailable ? t('settings.statusReady') : t('settings.statusUnavailable')}
                                    </FlexText>
                                </View>
                            </View>
                        </CustomSurface>
                    </View>

                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.about')}</FlexText>
                    <CustomSurface
                        position="single"
                        onPress={() => router.push('/about' as any)}
                        style={styles.option}
                    >
                        <View>
                            <FlexText style={[common.body]}>{t('settings.aboutApp')}</FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{t('settings.aboutAppDescription')}</FlexText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                    </CustomSurface>

                    <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.account')}</FlexText>
                    <View style={{ gap: 3 }}>
                        <CustomSurface
                            position="single"
                            onPress={async () => {
                                try {
                                    setIsLoggingOut(true);
                                    const { signOut } = await import("@/services/login");
                                    await signOut();
                                    router.dismissAll();
                                    router.replace("/");
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setIsLoggingOut(false);
                                }
                            }}
                            style={styles.option}
                        >
                            <FlexText style={[common.body, { color: colors.onSurface }]}>{t('settings.logout')}</FlexText>
                            <Logout width={24} height={24} color={colors.onSurface} />
                        </CustomSurface>
                    </View>

                    {/* ─── Logging Out Modal ─────────────────────────────────── */}
                    <Modal
                        visible={isLoggingOut}
                        transparent
                        animationType="fade"
                        statusBarTranslucent
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Spinner size="lg" color={colors.onSurface} />
                                <FlexText style={[common.body, { color: colors.onSurface, marginTop: 12 }]}>{t('settings.loggingOut')}</FlexText>
                            </View>
                        </View>
                    </Modal>


                    <Dialog isOpen={isClearCacheDialogOpen} onOpenChange={setIsClearCacheDialogOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay style={{ backgroundColor: colors.scrim + "70" }} />
                            <Dialog.Content style={{ backgroundColor: colors.surfaceContainerHigh }} >
                                <View style={{ marginBottom: 20, gap: 6 }}>
                                    <Dialog.Title style={{ color: colors.onSurface }}>{t('settings.clearVideoCache')}</Dialog.Title>
                                    <Dialog.Description style={{ color: colors.onSurfaceVariant }}>
                                        {t('settings.clearVideoCacheConfirmation', { size: formatBytes(cacheSize) })}
                                    </Dialog.Description>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                    <Button variant="ghost" onPress={() => setIsClearCacheDialogOpen(false)}>
                                        {t('settings.cancel')}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onPress={async () => {
                                            setIsClearCacheDialogOpen(false);
                                            setIsClearing(true);
                                            await clearVideoCache();
                                            await refreshCacheInfo();
                                            setIsClearing(false);
                                        }}
                                    >
                                        {t('settings.clear')}
                                    </Button>
                                </View>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog>
                    <View style={{ marginBottom: inset.bottom + 16 + 64 + 16 }}></View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fade overlay from solid at the bottom to transparent at the top */}
            <LinearGradient
                colors={fadeColors as [string, string, ...string[]]}
                locations={fadeLocations as [number, number, ...number[]]}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: inset.bottom + 16 + (isFocused ? keyboardHeight : 0) + 48 + 24,
                    zIndex: 999,
                }}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                pointerEvents="none"
            />

            {/* Floating search bar */}
            <View
                style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: inset.bottom + 16 + (isFocused ? keyboardHeight : 0),
                    zIndex: 1000,
                }}
            >
                <View style={[styles.searchBar, { marginBottom: 0 }]}>
                    <Input
                        variant="primary"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder=""
                        placeholderTextColor={colors.surfaceContainerHighest}
                        style={styles.searchInput}
                    />
                    {!searchQuery && !isFocused && (
                        <View style={styles.placeholderContainer} pointerEvents="none">
                            <Ionicons name='search' size={18} color={colors.onSurfaceVariant} />
                            <FlexText style={[common.body, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>{t('settings.search')}</FlexText>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        ...common.title,
        marginBottom: 8,
    },
    option: {
        ...common.row,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4
    },
    divider: {
        height: 1,
        backgroundColor: colors.outlineVariant,
        marginVertical: 8,
    },
    searchBar: {
        justifyContent: "center",
        position: 'relative',
    },
    searchInput: {
        color: colors.onSurface,
        fontSize: 16,
        paddingHorizontal: 16,
        textAlign: 'center',
        backgroundColor: colors.surfaceContainerHighest,
        borderRadius: 9999,
        height: 48,
        borderWidth: 0
    },
    placeholderContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        left: 0,
        right: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 36,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    // ─── Cache styles ────────────────────────────────────────────
    cacheInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: colors.outlineVariant,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },

});

export default SettingsScreen;

