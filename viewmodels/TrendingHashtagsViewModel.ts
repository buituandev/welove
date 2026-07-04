import { useTrendingHashtags } from '@/services/hashtag';
import { Hashtag } from '@/types/hashtag';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

const PREVIEW_COUNT = 3;

export const useTrendingHashtagsViewModel = () => {
    const router = useRouter();

    const { data, isLoading, refetch, isRefetching } = useTrendingHashtags();

    const allTags = useMemo((): Hashtag[] => {
        return data?.data ?? [];
    }, [data]);

    const previewTags = useMemo((): Hashtag[] => {
        return allTags.slice(0, PREVIEW_COUNT);
    }, [allTags]);

    const hasMoreTags = allTags.length > PREVIEW_COUNT;

    const navigateToTag = useCallback(
        (tag: string) => {
            router.push({
                pathname: '/hashtag/[tag]' as any,
                params: { tag: encodeURIComponent(tag) },
            });
        },
        [router]
    );

    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const navigateToAllTags = useCallback(() => {
        router.push('/hashtag-list' as any);
    }, [router]);

    return {
        previewTags,
        allTags,
        hasMoreTags,
        isLoading,
        navigateToTag,
        navigateToAllTags,
        handleRefresh,
        isRefetching,
    };
};
