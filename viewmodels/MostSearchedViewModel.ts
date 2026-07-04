import { LocalProfile, useSearchHistoryStore } from '@/stores/searchHistory';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

// A profile qualifies for "Most Searched" after this many clicks.
const CLICK_THRESHOLD = 3;
const MAX_DISPLAYED = 4;

export const useMostSearchedViewModel = () => {
    const router = useRouter();

    const clickCounts = useSearchHistoryStore((s) => s.clickCounts);
    const profileCache = useSearchHistoryStore((s) => s.profileCache);

    // Top N profiles with > CLICK_THRESHOLD clicks, sorted by count desc.
    const topProfiles = useMemo((): LocalProfile[] => {
        return Object.entries(clickCounts)
            .filter(([, count]) => count > CLICK_THRESHOLD)
            .sort(([, a], [, b]) => b - a)
            .slice(0, MAX_DISPLAYED)
            .map(([id]) => profileCache[id])
            .filter((p): p is LocalProfile => p !== undefined);
    }, [clickCounts, profileCache]);

    const navigateToProfile = useCallback(
        (id: string) => {
            router.push({
                pathname: '/profile/[id]' as any,
                params: { id, isMe: 'false' },
            });
        },
        [router]
    );

    return {
        topProfiles,
        hasMostSearched: topProfiles.length > 0,
        navigateToProfile,
    };
};
