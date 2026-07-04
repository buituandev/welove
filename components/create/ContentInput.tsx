import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { memo } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

// ============================================================================
// ContentInput Component
// ============================================================================

interface ContentInputProps {
    content: string;
    onContentChange: (content: string) => void;
    colors: ThemeColors;
    common: any;
    maxLength?: number;
}

export const ContentInput = memo(({
    content,
    onContentChange,
    colors,
    common,
    maxLength = 2000,
}: ContentInputProps) => {
    const { t } = useTranslation();
    
    return (
    <View style={createStyles.contentSection}>
        <View style={styles.inputContainer}>
            <TextInput
                style={[
                    common.body,
                    createStyles.contentInput,
                    styles.textInput,
                    { color: colors.onSurface },
                ]}
                placeholder={t("create.form.contentPlaceholder")}
                placeholderTextColor={colors.onSurfaceVariant}
                value={content}
                onChangeText={onContentChange}
                multiline
                maxLength={maxLength}
            />
            {content.length > 0 && (
                <TouchableOpacity
                    style={[styles.clearButton, { backgroundColor: colors.onSurfaceVariant + "30" }]}
                    onPress={() => onContentChange("")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
            )}
        </View>
        <FlexText style={[common.caption, createStyles.characterCount, { color: colors.onSurfaceVariant }]}>
            {content.length}/{maxLength}
        </FlexText>
    </View>
);});

ContentInput.displayName = "ContentInput";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    inputContainer: {
        position: "relative",
    },
    textInput: {
        paddingRight: 40,
    },
    clearButton: {
        position: "absolute",
        top: 12,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
});
