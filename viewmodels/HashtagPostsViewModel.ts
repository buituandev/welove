import { useHashtagPosts } from '@/services/hashtag';
import { Post } from '@/types/post';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHashtagPostsViewModel = (tag: string) => {
    const insets = useSafeAreaInsets();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useHashtagPosts(tag);

    const pages = data?.pages;

    const posts = useMemo((): Post[] => {
        if (!pages) return [];
        return pages.flatMap((page) => page.data);
    }, [pages]);

    const totalCount = useMemo(() => {
        if (!pages?.length) return 0;
        return pages[0].pagination.total;
    }, [pages]);

    const hashtagLabel = useMemo(() => {
        if (!pages?.length) return tag;
        return pages[0].hashtag?.tag ?? tag;
    }, [pages, tag]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return {
        posts,
        totalCount,
        hashtagLabel,
        isLoading,
        isRefetching,
        isFetchingNextPage,
        insets,
        handleEndReached,
        refetch,
    };
};
