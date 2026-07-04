import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Clipboard from "expo-clipboard";
import { Button } from "heroui-native/button";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { summarizePost } from "../../services/geminiNano";
import { createCommonStyles } from "../../styles/common";
import { FlexText } from "../FlexText";
import { useSheetBackHandler } from "../profile/sheets/useSheetBackHandler";

interface PostSummarySheetProps {
    postId?: string;
    content?: string;
}

export const PostSummarySheet = memo(forwardRef<any, PostSummarySheetProps>(
    ({ postId, content }, ref) => {
        const { colors, typography } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { toast } = useToast();
        const insets = useSafeAreaInsets();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const [isLoading, setIsLoading] = useState(false);
        const [summary, setSummary] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            present: () => {
                isPresented.current = true;
                sheetRef.current?.present();
            },
            dismiss: () => {
                isPresented.current = false;
                sheetRef.current?.dismiss();
            },
        } as any), []);

        const dismissSheet = useCallback(() => {
            isPresented.current = false;
            sheetRef.current?.dismiss();
        }, []);

        const loadSummary = useCallback(async () => {
            if (!postId || !content) return;
            setIsLoading(true);
            setError(null);
            try {
                const res = await summarizePost(postId, content);
                setSummary(res);
            } catch (err: any) {
                console.error("Summarization error:", err);
                setError(err.message || t("post.summary.failed", "Failed to generate summary."));
            } finally {
                setIsLoading(false);
            }
        }, [postId, content, t]);

        const handleCopy = useCallback(async () => {
            if (summary) {
                await Clipboard.setStringAsync(summary);
                toast.show({
                    label: t("post.dialogs.copyLinkTitle", "Success"),
                    description: t("post.summary.copied", "Summary copied to clipboard!"),
                    variant: "success",
                });
            }
        }, [summary, t, toast]);

        return (
            <TrueSheet
                ref={sheetRef}
                scrollable={true}
                backgroundColor={colors.surfaceContainer}
                grabberOptions={{
                    color: colors.onSurfaceVariant || "#C4C4C4",
                    height: 5,
                    width: 40,
                }}
                cornerRadius={32}
                detents={[0.5, 0.9]}
                onDidPresent={() => {
                    isPresented.current = true;
                    backHandler.onDidPresent();
                    if (!summary && !isLoading) {
                        loadSummary();
                    }
                }}
                onDidDismiss={() => {
                    isPresented.current = false;
                    backHandler.onDidDismiss();
                    // Clear state on close so we get fresh loading next time or if props change
                    setSummary(null);
                    setError(null);
                }}
                header={
                    <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Ionicons name="sparkles" size={20} color={colors.primary} />
                            <FlexText style={[common.heading]}>{t("post.summary.title", "WeLove AI Summary")}</FlexText>
                        </View>
                    </View>
                }
            >
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 20 }}>
                    {/* Content Area */}
                    <View style={styles.contentContainer}>
                        {isLoading ? (
                            <View style={styles.centerContainer}>
                                <Spinner size="lg" color={colors.primary} />
                                <FlexText style={[common.body, { marginTop: 12, color: colors.onSurfaceVariant }]}>
                                    {t("post.summary.generating", "Generating summary with WeLove AI...")}
                                </FlexText>
                            </View>
                        ) : error ? (
                            <View style={styles.centerContainer}>
                                <Ionicons name="warning" size={32} color={colors.error} />
                                <FlexText style={[common.body, { marginTop: 12, color: colors.error }]}>{error}</FlexText>
                                <Button variant="outline" onPress={loadSummary} style={{ marginTop: 16 }}>
                                    <Button.Label style={{ color: colors.onSurface }}>
                                        {t("post.summary.retry", "Retry")}
                                    </Button.Label>
                                </Button>
                            </View>
                        ) : summary ? (
                            <View style={{ gap: 16 }}>
                                <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                                    <FlexText style={[common.body, { lineHeight: 22 }]}>
                                        {summary}
                                    </FlexText>
                                </View>

                                <Button
                                    variant="primary"
                                    onPress={handleCopy}
                                    style={{ width: "100%" }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Ionicons name="copy-outline" size={18} color={colors.onPrimary || "#ffffff"} />
                                        <Button.Label style={{ color: colors.onPrimary || "#ffffff" }}>
                                            {t("post.summary.copy", "Copy Summary")}
                                        </Button.Label>
                                    </View>
                                </Button>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            </TrueSheet>
        );
    }
));

PostSummarySheet.displayName = "PostSummarySheet";

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    closeBtn: {
        padding: 4,
    },
    contentContainer: {
        minHeight: 180,
        justifyContent: "center",
    },
    centerContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 24,
    },
    summaryCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
});
