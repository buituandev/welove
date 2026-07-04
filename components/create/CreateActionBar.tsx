import GalleryIcon from "@/assets/images/svg/image-add.svg";
import LinkIcon from "@/assets/images/svg/link.svg";
import LocationIcon from "@/assets/images/svg/location.svg";
import MusicLibraryIcon from "@/assets/images/svg/music-rectangle-add.svg";
import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import AnimatedGlow from 'react-native-animated-glow';
import { ThemeColors } from "../../context/ThemeContext";
import { DeezerTrack } from "../../services/deezer";
import { abyssalGlow } from '../glow/AbyssGlowConfig';

// ============================================================================
// ActionButton Component
// ============================================================================

interface ActionButtonProps {
    icon: React.ComponentType<any>;
    isActive: boolean;
    onPress: () => void;
    disabled?: boolean;
    colors: ThemeColors;
}

const ActionButton = memo(({
    icon: Icon,
    isActive,
    onPress,
    disabled = false,
    colors,
}: ActionButtonProps) => (
    <TouchableOpacity
        style={[
            styles.actionButton,
            {
                backgroundColor: isActive ? colors.primaryContainer : "transparent",
            },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
    >
        <Icon
            width={24}
            height={24}
            color={isActive ? colors.onPrimaryContainer : colors.onSurface}
        />
    </TouchableOpacity>
));

ActionButton.displayName = "ActionButton";

// ============================================================================
// CreateActionBar Component
// ============================================================================

interface CreateActionBarProps {
    colors: ThemeColors;
    bottomPadding: number;
    visible?: boolean;
    // Media
    selectedMediaCount: number;
    onPickMedia: () => void;
    hideMediaOption?: boolean;
    // Location
    showLocationInput: boolean;
    hasLocation: boolean;
    onToggleLocation: () => void;
    // Music
    showMusicSearch: boolean;
    selectedTrack: DeezerTrack | null;
    onToggleMusic: () => void;
    // Links
    linksCount: number;
    onAddLink: () => void;
}

export const CreateActionBar = memo(({
    colors,
    bottomPadding,
    visible = true,
    selectedMediaCount,
    onPickMedia,
    hideMediaOption = false,
    showLocationInput,
    hasLocation,
    onToggleLocation,
    showMusicSearch,
    selectedTrack,
    onToggleMusic,
    linksCount,
    onAddLink,
}: CreateActionBarProps) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: visible ? 0 : 100,
                useNativeDriver: true,
                tension: 100,
                friction: 12,
            }),
            Animated.timing(opacity, {
                toValue: visible ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    return (
        <Animated.View
            style={[
                styles.floatingContainer,
                {
                    bottom: bottomPadding + 16,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents={visible ? "auto" : "none"}
        >
            <AnimatedGlow
                preset={abyssalGlow}
                style={{ borderRadius: 999 }}
            >
                <View
                    style={[
                        styles.pillBar,
                        {
                            backgroundColor: colors.surfaceContainer,
                            borderColor: colors.outlineVariant,
                        },
                    ]}
                >
                    {!hideMediaOption && (
                        <ActionButton
                            icon={GalleryIcon}
                            isActive={selectedMediaCount > 0}
                            onPress={onPickMedia}
                            disabled={selectedMediaCount >= 10}
                            colors={colors}
                        />
                    )}
                    <ActionButton
                        icon={LocationIcon}
                        isActive={showLocationInput || hasLocation}
                        onPress={onToggleLocation}
                        colors={colors}
                    />
                    <ActionButton
                        icon={MusicLibraryIcon}
                        isActive={showMusicSearch || selectedTrack !== null}
                        onPress={onToggleMusic}
                        colors={colors}
                    />
                    <ActionButton
                        icon={LinkIcon}
                        isActive={linksCount > 0}
                        onPress={onAddLink}
                        colors={colors}
                    />
                </View>
            </AnimatedGlow>
        </Animated.View>
    );
});

CreateActionBar.displayName = "CreateActionBar";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    floatingContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 100,
    },
    pillBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 999,
        gap: 4,
        borderWidth: 0,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
