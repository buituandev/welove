import { useThemeContext } from "@/context/ThemeContext";
import { SquircleView } from "expo-squircle-view";
import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import { WallpaperSet } from 'react-native-nitro-wallpaper';
import { FlexText } from "./FlexText";

interface WallpaperOverlayProps {
    isVisible: boolean;
    url: string;
    onClose: () => void;
}

const WallpaperOverlay = ({ isVisible, url, onClose }: WallpaperOverlayProps) => {
    const { colors } = useThemeContext();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSetWallpaper = async (type: 'both' | 'home' | 'lock') => {
        if (!url) {
            toast.show({ label: t('wallpaperOverlay.alert.errorTitle'), description: t('wallpaperOverlay.alert.noUrl'), variant: 'danger' });
            return;
        }

        setIsLoading(true);
        try {
            switch (type) {
                case 'both':
                    await WallpaperSet.setWallpaper(url, 'both');
                    break;
                case 'home':
                    await WallpaperSet.setWallpaper(url, 'home');
                    break;
                case 'lock':
                    await WallpaperSet.setWallpaper(url, 'lock');
                    break;
            }
            toast.show({ label: t('wallpaperOverlay.alert.successTitle'), description: t('wallpaperOverlay.alert.setSuccess'), variant: 'success' });
            onClose();
        } catch (error) {
            toast.show({ label: t('wallpaperOverlay.alert.errorTitle'), description: t('wallpaperOverlay.alert.setFailed'), variant: 'danger' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <ExpoImage
                    source={{ uri: url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                />

                <View style={styles.darkenOverlay} />

                <View style={styles.safeArea}>
                    <View style={[styles.bottomSheet, { backgroundColor: colors.containerContent || '#ffffff' }]}>

                        <FlexText style={[styles.title, { color: colors.text }]}>
                            {t('wallpaperOverlay.prompt')}
                        </FlexText>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <Spinner size="lg" color={colors.secondary} />
                                <Text style={[styles.loadingText, { color: colors.text }]}>
                                    {t('wallpaperOverlay.applying')}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <SquircleView
                                    cornerSmoothing={100}
                                    preserveSmoothing
                                    style={[styles.primaryButton, { backgroundColor: colors.card }]}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleSetWallpaper('both')}
                                    >
                                        <FlexText style={styles.primaryButtonText}>
                                            {t('wallpaperOverlay.setBoth')}
                                        </FlexText>
                                    </TouchableOpacity>
                                </SquircleView>

                                <View style={styles.row}>
                                    <SquircleView
                                        cornerSmoothing={100}
                                        preserveSmoothing
                                        style={[styles.secondaryButton, { backgroundColor: colors.card }]}
                                    >
                                        <TouchableOpacity
                                            onPress={() => handleSetWallpaper('home')}
                                        >
                                            <FlexText style={[styles.secondaryButtonText, { color: colors.text }]}>
                                                {t('wallpaperOverlay.homeScreen')}
                                            </FlexText>
                                        </TouchableOpacity>
                                    </SquircleView>

                                    <SquircleView
                                        cornerSmoothing={100}
                                        preserveSmoothing
                                        style={[styles.secondaryButton, { backgroundColor: colors.card }]}
                                    >
                                        <TouchableOpacity
                                            onPress={() => handleSetWallpaper('lock')}
                                        >
                                            <FlexText style={[styles.secondaryButtonText, { color: colors.text }]}>
                                                {t('wallpaperOverlay.lockScreen')}
                                            </FlexText>
                                        </TouchableOpacity>
                                    </SquircleView>
                                </View>

                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <FlexText style={[styles.cancelButtonText, { color: colors.text }]}>
                                        {t('wallpaperOverlay.cancel')}
                                    </FlexText>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end', // Pushes the bottom sheet down
    },
    darkenOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.2)', // Ensures buttons are readable over light images
    },
    safeArea: {
        width: '100%',
    },
    bottomSheet: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12, // Requires newer React Native, use margin on items if on older version
        marginBottom: 16,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.7,
    },
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    }
});

export default WallpaperOverlay;