import FontAwesome from "@react-native-vector-icons/fontawesome/static";
import { Spinner } from "heroui-native/spinner";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

// ============================================================================
// CreateScreenHeader Component
// ============================================================================

interface CreateScreenHeaderProps {
    colors: ThemeColors;
    common: any;
    topPadding: number;
    canSubmit: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    subtitle?: string;
}

export const CreateScreenHeader = memo(({
    colors,
    common,
    topPadding,
    canSubmit,
    isSubmitting,
    onSubmit,
}: CreateScreenHeaderProps) => {
    const { t } = useTranslation();

    const buttonBgColor = canSubmit ? colors.primary : colors.surfaceContainerHigh;
    const buttonTextColor = canSubmit ? colors.onPrimary : colors.onSurfaceVariant;

    return (
        <View
            style={[
                createStyles.header,
                {
                    backgroundColor: colors.background,
                    paddingTop: topPadding,
                },
            ]}
        >
            <View style={{ flex: 1, flexShrink: 1, marginRight: 12 }}>
                <FlexText style={[common.heading, { fontSize: 28 }]} numberOfLines={1}>
                    {t('create.header.title')}
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
                    {t('create.header.subtitle')}
                </FlexText>
            </View>

            <TouchableOpacity
                style={[
                    createStyles.submitButton,
                    {
                        backgroundColor: buttonBgColor,
                        flexShrink: 0,
                    },
                ]}
                onPress={onSubmit}
                disabled={!canSubmit}
            >
                {isSubmitting ? (
                    <Spinner size="md" color={buttonTextColor} />
                ) : (
                    <>
                        <FontAwesome name="send" size={16} color={buttonTextColor} />
                        <FlexText
                            style={[createStyles.submitButtonText, { color: buttonTextColor }]}
                            numberOfLines={1}
                        >
                            {t('create.action.post')}
                        </FlexText>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
});

CreateScreenHeader.displayName = "CreateScreenHeader";
