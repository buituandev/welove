import { CustomSurface } from "@/components/CustomSurface";
import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { useAppLockStore } from "@/stores/appLock";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { isSensorAvailable } from "@sbaiahmed1/react-native-biometrics";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import { ControlField } from "heroui-native/control-field";
import { Dialog } from "heroui-native/dialog";
import { InputOTP, type InputOTPRef } from "heroui-native/input-otp";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FlowMode = "enable" | "disable" | "change";
type Step = "enter-current" | "enter-new" | "confirm-new";

const SecuritySettingsScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();

    const {
        appLockEnabled,
        appLockPin,
        biometricsEnabled,
        setAppLockEnabled,
        setAppLockPin,
        setBiometricsEnabled,
        setLocked
    } = useAppLockStore();

    // Biometric capability state
    const [biometricsAvailable, setBiometricsAvailable] = useState(false);
    const [biometryType, setBiometryType] = useState<string | undefined>(undefined);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [flowMode, setFlowMode] = useState<FlowMode>("enable");
    const [step, setStep] = useState<Step>("enter-new");
    const [tempPin, setTempPin] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const otpRef = useRef<InputOTPRef>(null);

    useEffect(() => {
        isSensorAvailable()
            .then((info) => {
                if (info.available) {
                    setBiometricsAvailable(true);
                    setBiometryType(info.biometryType);
                }
            })
            .catch((err) => {
                console.log("Failed to check biometrics:", err);
            });
    }, []);

    const openPinModal = (mode: FlowMode) => {
        setFlowMode(mode);
        setErrorMsg("");
        setOtpValue("");
        setTempPin("");

        if (mode === "enable") {
            setStep("enter-new");
        } else if (mode === "disable" || mode === "change") {
            setStep("enter-current");
        }

        setModalVisible(true);
        // Auto focus input
        setTimeout(() => {
            otpRef.current?.focus();
        }, 300);
    };

    const handleOtpChange = (val: string) => {
        setOtpValue(val);
        if (errorMsg) setErrorMsg("");
    };

    const handleOtpComplete = (code: string) => {
        if (step === "enter-current") {
            if (code === appLockPin) {
                if (flowMode === "disable") {
                    setAppLockEnabled(false);
                    setAppLockPin("");
                    setBiometricsEnabled(false);
                    setModalVisible(false);
                    Keyboard.dismiss();
                } else if (flowMode === "change") {
                    setStep("enter-new");
                    setOtpValue("");
                    otpRef.current?.clear();
                    setTimeout(() => otpRef.current?.focus(), 100);
                }
            } else {
                setErrorMsg(t("settings.incorrectPin"));
                setOtpValue("");
                otpRef.current?.clear();
                setTimeout(() => otpRef.current?.focus(), 100);
            }
        } else if (step === "enter-new") {
            setTempPin(code);
            setStep("confirm-new");
            setOtpValue("");
            otpRef.current?.clear();
            setTimeout(() => otpRef.current?.focus(), 100);
        } else if (step === "confirm-new") {
            if (code === tempPin) {
                setAppLockPin(code);
                setAppLockEnabled(true);
                setModalVisible(false);
                Keyboard.dismiss();
            } else {
                setErrorMsg(t("settings.pinsDoNotMatch"));
                setStep("enter-new");
                setTempPin("");
                setOtpValue("");
                otpRef.current?.clear();
                setTimeout(() => otpRef.current?.focus(), 100);
            }
        }
    };

    const handleToggleAppLock = (selected: boolean) => {
        if (selected) {
            // Turning on
            if (!appLockPin) {
                openPinModal("enable");
            } else {
                setAppLockEnabled(true);
            }
        } else {
            // Turning off, verify first
            openPinModal("disable");
        }
    };

    const getModalTitle = () => {
        switch (step) {
            case "enter-current":
                return t("settings.enterCurrentPin");
            case "enter-new":
                return t("settings.createPin");
            case "confirm-new":
                return t("settings.confirmPin");
            default:
                return t("settings.securityTitle");
        }
    };

    const getModalDescription = () => {
        switch (step) {
            case "enter-current":
                return t("settings.verifyIdentity");
            case "enter-new":
                return t("settings.setSecureCode");
            case "confirm-new":
                return t("settings.reenterPin");
            default:
                return "";
        }
    };

    return (
        <ScrollView style={[common.screenPadding, { backgroundColor: colors.background }]}>
            {/* Header */}
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

            <FlexText style={styles.title}>{t("settings.securityTitle")}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t("settings.securitySubtitle")}
            </FlexText>

            <View style={{ gap: 3 }}>
                {/* Enable app lock toggle */}
                <CustomSurface isFirst style={styles.optionContainer}>
                    <ControlField
                        isSelected={appLockEnabled}
                        onSelectedChange={handleToggleAppLock}
                        style={styles.controlRow}
                    >
                        <View style={{ flex: 1 }}>
                            <FlexText style={common.body}>{t("settings.enableAppLock")}</FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t("settings.enableAppLockDesc")}</FlexText>
                        </View>
                        <ControlField.Indicator />
                    </ControlField>
                </CustomSurface>

                {/* Use biometrics toggle */}
                <CustomSurface position="middle" style={styles.optionContainer}>
                    <ControlField
                        isSelected={biometricsEnabled}
                        onSelectedChange={setBiometricsEnabled}
                        isDisabled={!appLockEnabled || !biometricsAvailable}
                        style={styles.controlRow}
                    >
                        <View style={{ flex: 1 }}>
                            <FlexText style={common.body}>{t("settings.useBiometrics")}</FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                {biometricsAvailable
                                    ? t("settings.useBiometricsDescAvailable", { type: biometryType || "biometric" })
                                    : t("settings.useBiometricsDescUnavailable")}
                            </FlexText>
                        </View>
                        <ControlField.Indicator />
                    </ControlField>
                </CustomSurface>

                {/* Change PIN button */}
                <CustomSurface
                    isLast={!__DEV__}
                    onPress={appLockEnabled ? () => openPinModal("change") : undefined}
                    style={styles.optionRow}
                >
                    <View>
                        <FlexText style={[common.body, { color: appLockEnabled ? colors.onSurface : colors.muted }]}>
                            {t("settings.changePasscode")}
                        </FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                            {t("settings.changePasscodeDesc")}
                        </FlexText>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={appLockEnabled ? colors.onSurface : colors.outlineVariant}
                    />
                </CustomSurface>

                {__DEV__ && (
                    <CustomSurface
                        isLast
                        onPress={() => {
                            if (!appLockEnabled || !appLockPin) {
                                Alert.alert("Dev Mode", "Please set a PIN first before triggering lock.");
                            } else {
                                setLocked(true);
                            }
                        }}
                        style={styles.optionRow}
                    >
                        <View>
                            <FlexText style={[common.body, { color: colors.error }]}>
                                [DEV] Trigger Lock Overlay
                            </FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                Test lock overlay screen immediately
                            </FlexText>
                        </View>
                        <Ionicons
                            name="bug"
                            size={24}
                            color={colors.error}
                        />
                    </CustomSurface>
                )}
            </View>

            {/* PIN Setup/Verification Dialog */}
            <Dialog
                isOpen={modalVisible}
                onOpenChange={(open) => {
                    setModalVisible(open);
                    if (!open) {
                        Keyboard.dismiss();
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <KeyboardAvoidingView behavior="padding">
                        <Dialog.Content>
                            <Dialog.Close variant="ghost" />
                            <View style={{ marginBottom: 20, gap: 6, alignItems: 'center' }}>
                                <Dialog.Title style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
                                    {getModalTitle()}
                                </Dialog.Title>
                                <Dialog.Description style={{ fontSize: 14, textAlign: "center" }}>
                                    {getModalDescription()}
                                </Dialog.Description>
                            </View>

                            <View style={styles.otpWrapper}>
                                <InputOTP
                                    ref={otpRef}
                                    maxLength={6}
                                    value={otpValue}
                                    onChange={handleOtpChange}
                                    onComplete={handleOtpComplete}
                                    isInvalid={!!errorMsg}
                                >
                                    <InputOTP.Group>
                                        <InputOTP.Slot index={0} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                        <InputOTP.Slot index={1} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                        <InputOTP.Slot index={2} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    </InputOTP.Group>
                                    <InputOTP.Group>
                                        <InputOTP.Slot index={3} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                        <InputOTP.Slot index={4} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                        <InputOTP.Slot index={5} className="w-10 h-12 border-2 rounded-xl text-center text-lg font-bold" />
                                    </InputOTP.Group>
                                </InputOTP>
                            </View>

                            {errorMsg ? (
                                <FlexText style={[styles.errorMsgText, { color: colors.error }]}>{errorMsg}</FlexText>
                            ) : null}

                            <View style={styles.modalButtons}>
                                <Button
                                    variant="ghost"
                                    onPress={() => {
                                        setModalVisible(false);
                                        Keyboard.dismiss();
                                    }}
                                >
                                    {t("settings.cancel")}
                                </Button>
                            </View>
                        </Dialog.Content>
                    </KeyboardAvoidingView>
                </Dialog.Portal>
            </Dialog>
        </ScrollView>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
    title: {
        ...common.title,
        marginBottom: 4,
    },
    optionContainer: {
        paddingHorizontal: 0,
    },
    controlRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: 24,
        padding: 24,
        width: "90%",
        alignItems: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 6,
        textAlign: "center",
    },
    modalSub: {
        fontSize: 14,
        color: "gray",
        marginBottom: 24,
        textAlign: "center",
    },
    otpWrapper: {
        height: 70,
        justifyContent: "center",
        marginBottom: 16,
    },
    errorMsgText: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 16,
        textAlign: "center",
    },
    modalButtons: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "center",
        marginTop: 12,
    },
});

export default SecuritySettingsScreen;
