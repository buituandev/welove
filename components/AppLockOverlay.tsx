import Ionicons from "@react-native-vector-icons/ionicons/static";
import { isSensorAvailable, simplePrompt } from "@sbaiahmed1/react-native-biometrics";
import { LinearGradient } from "expo-linear-gradient";
import { InputOTP, type InputOTPRef } from "heroui-native/input-otp";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useAppLockStore } from "../stores/appLock";
import { createCommonStyles } from "../styles/common";
import { FlexText } from "./FlexText";

export const AppLockOverlay = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const { appLockPin, appLockEnabled, biometricsEnabled, setLocked, isLocked } = useAppLockStore();
    const inset = useSafeAreaInsets();

    const [pinValue, setPinValue] = useState("");
    const [error, setError] = useState("");
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometryType, setBiometryType] = useState<string | undefined>(undefined);
    const otpRef = useRef<InputOTPRef>(null);

    const triggerBiometrics = useCallback(async () => {
        try {
            const success = await simplePrompt(t("settings.appLocked"));
            if (success) {
                Keyboard.dismiss();
                setError("");
                setPinValue("");
                setTimeout(() => {
                    setLocked(false);
                }, 100);
            }
        } catch (err) {
            console.log("Biometric auth cancelled/failed:", err);
        }
    }, [setLocked, t]);

    // Dismiss keyboard when locked state triggers
    useEffect(() => {
        if (isLocked) {
            Keyboard.dismiss();
        }
    }, [isLocked]);

    // Check biometric availability
    useEffect(() => {
        if (!appLockEnabled) return;
        isSensorAvailable()
            .then((info) => {
                if (info.available) {
                    setBiometricAvailable(true);
                    setBiometryType(info.biometryType);
                }
            })
            .catch((err) => {
                console.log("Biometric availability check failed:", err);
            });
    }, [appLockEnabled]);

    // Auto-prompt biometrics on mount if enabled
    useEffect(() => {
        if (isLocked && appLockEnabled && biometricsEnabled) {
            const timer = setTimeout(() => {
                triggerBiometrics();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isLocked, appLockEnabled, biometricsEnabled, triggerBiometrics]);

    const handlePinComplete = (code: string) => {
        if (code === appLockPin) {
            Keyboard.dismiss();
            setError("");
            setPinValue("");
            setTimeout(() => {
                setLocked(false);
            }, 100);
        } else {
            setError(t("settings.incorrectPin"));
            setPinValue("");
            otpRef.current?.clear();
            setTimeout(() => {
                otpRef.current?.focus();
            }, 100);
        }
    };

    if (!isLocked || !appLockEnabled) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
            <LinearGradient
                colors={[colors.surface, colors.surfaceContainer]}
                style={[styles.container, { paddingTop: inset.top, paddingBottom: inset.bottom }]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoiding}
                >
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
                            <Ionicons name="lock-closed" size={48} color={colors.primary} />
                        </View>

                        <FlexText style={[common.title, styles.title]}>{t("settings.appLocked")}</FlexText>
                        <FlexText style={[common.body, styles.subtitle, { color: colors.onSurfaceVariant }]}>
                            {t("settings.enterPinToContinue")}
                        </FlexText>

                        <View style={styles.otpWrapper}>
                            <InputOTP
                                ref={otpRef}
                                maxLength={6}
                                value={pinValue}
                                onChange={(val) => {
                                    setPinValue(val);
                                    if (error) setError("");
                                }}
                                onComplete={handlePinComplete}
                                isInvalid={!!error}
                            >
                                <InputOTP.Group>
                                    <InputOTP.Slot index={0} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    <InputOTP.Slot index={1} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    <InputOTP.Slot index={2} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                </InputOTP.Group>
                                <InputOTP.Separator />
                                <InputOTP.Group>
                                    <InputOTP.Slot index={3} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    <InputOTP.Slot index={4} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    <InputOTP.Slot index={5} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                </InputOTP.Group>
                            </InputOTP>
                        </View>

                        {error ? (
                            <FlexText style={[styles.errorText, { color: colors.error }]}>{error}</FlexText>
                        ) : null}

                        {biometricAvailable && biometricsEnabled ? (
                            <TouchableOpacity
                                onPress={triggerBiometrics}
                                style={[styles.biometricButton, { borderColor: colors.outline }]}
                            >
                                <Ionicons name="finger-print" size={28} color={colors.primary} />
                                <FlexText style={[common.body, styles.biometricText, { color: colors.onSurface }]}>
                                    {t("settings.useBiometricsButton", { type: biometryType || "Biometrics" })}
                                </FlexText>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoiding: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        width: "90%",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    iconContainer: {
        marginBottom: 24,
        padding: 20,
        borderRadius: 99,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        textAlign: "center",
        marginBottom: 36,
    },
    otpWrapper: {
        height: 70,
        justifyContent: "center",
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 16,
        textAlign: "center",
    },
    biometricButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 99,
        borderWidth: 1,
        marginTop: 40,
        gap: 8,
    },
    biometricText: {
        fontWeight: "600",
    },
});
