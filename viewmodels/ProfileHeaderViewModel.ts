import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated } from "react-native";
import { getColors } from 'react-native-image-colors';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { storage } from '../services/storage';
import { useAudioStore } from '../stores/audio';
import { createCommonStyles } from "../styles/common";
import { ProfileAddress } from "../types/profileaddress";
import { ProfileDetail } from "../types/profiledetail";
import { ProfileMusic } from "../types/profilemusic";

const COVER_HEIGHT = 250;
const PLACEHOLDER_COVER = "https://pbs.twimg.com/media/GeMS4yjWIAA14OG.jpg";
const MESH_GRADIENT_DEFAULTS = {
    speed: 5,
    brightness: 0.8,
    contrast: 1.2,
    frequency: 5,
    amplitude: 30,
};



export type TabType = "Images" | "Videos" | "Feed";

interface UseProfileHeaderViewModelOptions {
    scrollY: Animated.Value;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    profile?: ProfileDetail | null;
    isMe?: boolean;
    music?: ProfileMusic[];
    addresses?: ProfileAddress[];
}

export const useProfileHeaderViewModel = ({
    scrollY,
    activeTab,
    onTabChange,
    profile,
    isMe = false,
    music = [],
    addresses = [],
}: UseProfileHeaderViewModelOptions) => {
    const { colors, typography, theme } = useThemeContext();
    const { t } = useTranslation();
    const common = createCommonStyles(colors, typography);
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
    const insets = useSafeAreaInsets();

    // ─── State ─────────────────────────────────────────────────────
    const [gradientColors, setGradientColors] = useState<string[]>([]);
    const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

    // ─── Register Locale ───────────────────────────────────────────
    useEffect(() => {
        countries.registerLocale(en);
    }, []);

    // ─── Derived Data ──────────────────────────────────────────────
    const hasCover = !!profile?.cover_url;
    const currentMusic = music?.[0];
    const currentAvatar = profile?.avatar_url || null;

    const genderFallbackSource = profile?.gender === 'male'
        ? require('../assets/images/AV17.png')
        : profile?.gender
            ? require('../assets/images/AV86.png')
            : null;

    const profileMetadata = profile?.metadata;

    const parsedMetadata = useMemo(() => {
        if (!profileMetadata) return null;
        try {
            return typeof profileMetadata === 'string'
                ? JSON.parse(profileMetadata)
                : profileMetadata;
        } catch {
            return null;
        }
    }, [profileMetadata]);

    const threedEmoji = parsedMetadata?.threed_emoji || null;
    const hasFacebook = !!parsedMetadata?.facebook;

    const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
    const homeInfo = profile?.hometown || (primaryAddress ? `${primaryAddress.city}${primaryAddress.country ? `, ${primaryAddress.country}` : ''}` : null);

    const flagCode = useMemo(() => {
        if (!homeInfo) return null;
        const parts = homeInfo.split(',');
        const potentialCountry = parts[parts.length - 1].trim();
        return countries.getAlpha2Code(potentialCountry, "en");
    }, [homeInfo]);

    const [prevHasCover, setPrevHasCover] = useState<boolean>(hasCover);

    if (hasCover !== prevHasCover) {
        setPrevHasCover(hasCover);
        if (hasCover) {
            setGradientColors([]);
        }
    }

    // ─── Color Extraction for Mesh Gradient ────────────────────────
    useEffect(() => {
        if (hasCover) {
            return;
        }

        const extractColors = async () => {
            const imageSource = currentAvatar || PLACEHOLDER_COVER;
            const cacheKey = `mesh_colors_${imageSource}`;

            if (storage.contains(cacheKey)) {
                const cachedColors = storage.getString(cacheKey);
                if (cachedColors) {
                    setGradientColors(JSON.parse(cachedColors));
                    return;
                }
            }

            try {
                const colorsData = await getColors(imageSource, {
                    fallback: '#3b5998',
                    cache: true,
                    key: imageSource,
                });

                let extractedColors: string[] = [];

                if (colorsData.platform === 'android') {
                    let lightColors: string[] = Object.entries(colorsData)
                        .filter(([key]) => key.includes('light_'))
                        .map(([_, value]) => value as string);

                    if (lightColors.length < 4) {
                        lightColors = lightColors.concat([
                            colorsData.average,
                            colorsData.dominant,
                            colorsData.vibrant,
                            colorsData.muted,
                        ].filter(Boolean) as string[]);
                    }
                    extractedColors = lightColors.slice(0, 4);
                } else if (colorsData.platform === 'ios') {
                    extractedColors = [
                        colorsData.primary,
                        colorsData.secondary,
                        colorsData.background,
                        colorsData.detail,
                    ].filter(Boolean) as string[];
                }

                while (extractedColors.length < 4) {
                    extractedColors.push(extractedColors[0] || '#3b5998');
                }
                extractedColors = extractedColors.slice(0, 4);

                setGradientColors(extractedColors);
                storage.set(cacheKey, JSON.stringify(extractedColors));
            } catch (error) {
                console.error('Failed to extract colors:', error);
                setGradientColors(['#667eea', '#764ba2', '#f093fb', '#f5576c']);
            }
        };

        extractColors();
    }, [hasCover, currentAvatar]);

    // ─── Animations ────────────────────────────────────────────────
    const coverTranslateY = scrollY.interpolate({
        inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
        outputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT * 0.5],
        extrapolate: "clamp",
    });

    // ─── Music ─────────────────────────────────────────────────────
    const profileMusicId = currentMusic ? `profile-music-${currentMusic.id}` : null;
    const isPlaying = profileMusicId ? currentlyPlayingId === profileMusicId : false;

    const toggleMusic = useCallback(() => {
        if (!currentMusic?.preview_url || !profileMusicId) return;

        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(profileMusicId, currentMusic.preview_url, {
                title: currentMusic.title,
                artist: currentMusic.artist,
                coverUrl: currentMusic.cover_url,
            });
        }
    }, [currentMusic, profileMusicId, isPlaying, playTrack, stopPlayback]);

    // ─── Tab Handlers ──────────────────────────────────────────────
    const handleImagesTab = useCallback(() => onTabChange("Images"), [onTabChange]);
    const handleVideosTab = useCallback(() => onTabChange("Videos"), [onTabChange]);
    const handleFeedTab = useCallback(() => onTabChange("Feed"), [onTabChange]);

    const tabs = useMemo(() => [
        { name: "Images", label: t("profile.tabs.images"), onClick: handleImagesTab },
        { name: "Videos", label: t("profile.tabs.videos"), onClick: handleVideosTab },
        { name: "Feed", label: t("profile.tabs.feed"), onClick: handleFeedTab },
    ], [handleImagesTab, handleVideosTab, handleFeedTab, t]);

    // ─── Avatar Preview ────────────────────────────────────────────
    const showAvatarPreview = useCallback(() => {
        setAvatarPreviewVisible(true);
    }, []);

    const hideAvatarPreview = useCallback(() => {
        setAvatarPreviewVisible(false);
    }, []);

    // ─── Return ViewModel ──────────────────────────────────────────
    return {
        // Theme
        colors,
        typography,
        theme,
        common,
        insets,

        // Profile derived data
        hasCover,
        currentMusic,
        currentAvatar,
        genderFallbackSource,
        threedEmoji,
        hasFacebook,
        homeInfo,
        flagCode,

        // Gradient
        gradientColors,
        meshGradientDefaults: MESH_GRADIENT_DEFAULTS,
        coverHeight: COVER_HEIGHT,

        // Animations
        coverTranslateY,

        // Music
        isPlaying,
        toggleMusic,

        // Avatar preview
        avatarPreviewVisible,
        showAvatarPreview,
        hideAvatarPreview,

        // Tabs
        tabs,
    };
};
