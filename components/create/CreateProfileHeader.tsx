import VerifiedIcon from "@/icons/verified";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import LookAroundIcon from "@/assets/images/svg/look-around.svg";
import CloudUploadIcon from "@/assets/images/svg/cloud-upload.svg";
import CatIcon from "@/assets/images/svg/cat.svg";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { Profile } from "../../types/profile";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

// ============================================================================
// PostOptionBadge Component
// ============================================================================

// ============================================================================
// PostOptionBadge Component
// ============================================================================

interface PostOptionBadgeProps {
    icon: string;
    iconActive: string;
    label: string;
    isActive: boolean;
    onPress: () => void;
    colors: ThemeColors;
    common: any;
    activeBgColor: string;
    activeTextColor: string;
}

const PostOptionBadge = memo(({
    icon,
    iconActive: _iconActive,
    label,
    isActive,
    onPress,
    colors,
    common,
    activeBgColor,
    activeTextColor,
}: PostOptionBadgeProps) => {
    const Icon = icon === "ghost-smile-outline" ? LookAroundIcon : icon === "cloud-upload-outline" ? CloudUploadIcon : CatIcon;
    return (
        <TouchableOpacity
            style={[
                createStyles.optionBadge,
                {
                    backgroundColor: isActive ? activeBgColor : colors.surfaceContainerHigh,
                },
            ]}
            onPress={onPress}
        >
            <Icon
                width={14}
                height={14}
                color={isActive ? activeTextColor : colors.onSurfaceVariant}
            />
            <FlexText
                style={[
                    common.caption,
                    { color: isActive ? activeTextColor : colors.onSurfaceVariant, fontWeight: "500" },
                ]}
            >
                {label}
            </FlexText>
        </TouchableOpacity>
    );
});

PostOptionBadge.displayName = "PostOptionBadge";

// ============================================================================
// CreateProfileHeader Component
// ============================================================================

interface CreateProfileHeaderProps {
    profile: Profile;
    colors: ThemeColors;
    common: any;
    isGhost: boolean;
    isAdult: boolean;
    useThirdPartyUpload?: boolean;
    onToggleGhost?: () => void;
    onToggleAdult?: () => void;
    onToggleThirdPartyUpload?: () => void;
    isAdmin?: boolean;
    onSwitchProfile?: () => void;
}

export const CreateProfileHeader = memo(({
    profile,
    colors,
    common,
    isGhost,
    isAdult,
    useThirdPartyUpload = false,
    onToggleGhost,
    onToggleAdult,
    onToggleThirdPartyUpload,
    isAdmin,
    onSwitchProfile,
}: CreateProfileHeaderProps) => {
    const { t } = useTranslation();

    const avatarContent = (
        <View style={profileHeaderStyles.avatarWrapper}>
            <Image
                source={{ uri: profile.avatar_url }}
                style={[createStyles.profileAvatar]}
            />
            {isAdmin && (
                <View
                    style={[
                        profileHeaderStyles.swapBadge,
                        { backgroundColor: colors.surfaceContainer },
                    ]}
                >
                    <Ionicons name="swap-horizontal" size={11} color={colors.onSurface} />
                </View>
            )}
        </View>
    );

    return (
        <View style={createStyles.profileRow}>
            {isAdmin && onSwitchProfile ? (
                <TouchableOpacity onPress={onSwitchProfile} activeOpacity={0.75}>
                    {avatarContent}
                </TouchableOpacity>
            ) : (
                avatarContent
            )}
            <View>
                <View style={[common.row, { gap: 4 }]}>
                    <FlexText style={[common.subheading, { color: colors.onSurface }]} numberOfLines={1}>
                        {profile.name}
                    </FlexText>
                    {profile.is_verified && <VerifiedIcon size={14} />}
                </View>
                {(onToggleGhost || onToggleAdult || onToggleThirdPartyUpload) && (
                    <View style={createStyles.postOptionsRow}>
                        {onToggleGhost && (
                            <PostOptionBadge
                                icon="ghost-smile-outline"
                                iconActive="ghost-smile-bold"
                                label={t('create.form.ghost')}
                                isActive={isGhost}
                                onPress={onToggleGhost}
                                colors={colors}
                                common={common}
                                activeBgColor={colors.primaryContainer}
                                activeTextColor={colors.onPrimaryContainer}
                            />
                        )}
                        {onToggleThirdPartyUpload && (
                            <PostOptionBadge
                                icon="cloud-upload-outline"
                                iconActive="cloud-upload"
                                label={t('create.form.thirdPartyCloud', 'Cloud')}
                                isActive={useThirdPartyUpload}
                                onPress={onToggleThirdPartyUpload}
                                colors={colors}
                                common={common}
                                activeBgColor={colors.secondaryContainer}
                                activeTextColor={colors.onSecondaryContainer}
                            />
                        )}
                        {onToggleAdult && (
                            <PostOptionBadge
                                icon="heart-unlock-outline"
                                iconActive="heart-unlock"
                                label={t('create.form.sensitive')}
                                isActive={isAdult}
                                onPress={onToggleAdult}
                                colors={colors}
                                common={common}
                                activeBgColor={colors.errorContainer}
                                activeTextColor={colors.onErrorContainer}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
});

CreateProfileHeader.displayName = "CreateProfileHeader";

const profileHeaderStyles = StyleSheet.create({
    avatarWrapper: {
        position: "relative",
        overflow: "visible",
    },
    swapBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
});
