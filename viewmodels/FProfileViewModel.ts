import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThemeContext } from '../context/ThemeContext';
import {
    FacebookMetadata,
    fetchAllFacebookData,
    LocalFBData,
} from '../services/localfb';
import { createCommonStyles } from '../styles/common';
import { Profile } from '../types/profile';

export function useFProfileViewModel() {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const router = useRouter();
    const params = useLocalSearchParams<Record<string, string>>();

    // ─── Parse profile from route params ─────────────────────────────────
    const profile = useMemo<Profile | null>(() => {
        try {
            return params.profile ? JSON.parse(params.profile as string) : null;
        } catch {
            return null;
        }
    }, [params.profile]);

    const profileMetadata = profile?.metadata;

    // ─── Parse metadata ──────────────────────────────────────────────────
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

    const facebookMeta: FacebookMetadata | null = parsedMetadata?.facebook ?? null;

    // ─── Facebook data state ─────────────────────────────────────────────
    const [fbData, setFbData] = useState<LocalFBData>({
        posts: null,
        photos: null,
        videos: null,
        highlights: null,
        groups: null,
    });

    const currentProfileId = profile?.id ?? null;
    const hasFBData = !!(currentProfileId && facebookMeta);
    const [prevProfileId, setPrevProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(hasFBData);

    if (currentProfileId !== prevProfileId) {
        setPrevProfileId(currentProfileId);
        setIsLoading(hasFBData);
    }

    useEffect(() => {
        if (!currentProfileId || !facebookMeta) {
            return;
        }

        let cancelled = false;

        (async () => {
            setIsLoading(true);
            const data = await fetchAllFacebookData(currentProfileId, facebookMeta);
            if (!cancelled) {
                setFbData(data);
                setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [currentProfileId, facebookMeta]);

    // ─── Derived data ────────────────────────────────────────────────────

    // Format birthday
    const formatBirthday = useCallback((dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    // Format timestamp
    const formatTimestamp = useCallback((timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    // Format video duration
    const formatDuration = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Format member count
    const formatCount = useCallback((count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    }, []);

    const goBack = useCallback(() => {
        router.back();
    }, [router]);

    // ─── Theme colors (Facebook-style) ──────────────────────────────────
    const fbColors = useMemo(() => {
        if (theme === 'dark') {
            return {
                screenBg: '#000000',
                contentBg: '#000000',
                primaryText: '#E4E6EB',
                secondaryText: '#B0B3B8',
                iconColor: '#8C939D',
                buttonBlueBg: '#0866FF',
                buttonGrayBg: '#3A3B3C',
                tabActiveBg: '#263951',
                tabActiveText: '#5890FF',
                tabInactiveText: '#E4E6EB',
                tabInactiveBg: 'transparent',
                divider: '#3E4042',
                workIconBg: '#242526',
                avatarBorder: '#000000',
                headerOverlay: 'rgba(0,0,0,0.6)',
                headerOverlayEnd: 'transparent',
                white: '#FFFFFF',
                cardBg: '#1C1C1E',
            };
        }
        return {
            screenBg: '#F0F2F5',
            contentBg: '#FFFFFF',
            primaryText: '#1C1E21',
            secondaryText: '#65676B',
            iconColor: '#65676B',
            buttonBlueBg: '#0866FF',
            buttonGrayBg: '#E4E6EB',
            tabActiveBg: '#E7F3FF',
            tabActiveText: '#0866FF',
            tabInactiveText: '#1C1E21',
            tabInactiveBg: 'transparent',
            divider: '#CED0D4',
            workIconBg: '#E4E6EB',
            avatarBorder: '#FFFFFF',
            headerOverlay: 'rgba(0,0,0,0.4)',
            headerOverlayEnd: 'transparent',
            white: '#FFFFFF',
            cardBg: '#F0F2F5',
        };
    }, [theme]);

    return {
        profile,
        parsedMetadata,
        facebookMeta,
        fbData,
        isLoading,
        colors,
        common,
        fbColors,
        theme,
        goBack,
        formatBirthday,
        formatTimestamp,
        formatDuration,
        formatCount,
    };
}
