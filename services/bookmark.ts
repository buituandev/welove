/**
 * Bookmark service
 * Endpoints:
 *   GET/POST     /api/bookmarks          - List bookmarks / Create bookmark
 *   GET/DELETE   /api/bookmarks/[id]     - Check status / Remove bookmark
 */

import { BookmarksResponse, BookmarkStatusResponse, CreateBookmarkResponse } from '@/types/bookmarkedpost';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { bookmarkKeys, feedKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get bookmarked posts (paginated)
 */
export const getBookmarks = async ({
    pageParam,
}: {
    pageParam?: string;
}): Promise<BookmarksResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<BookmarksResponse>('/api/bookmarks', { params });
    return response.data;
};

/**
 * Check if a post is bookmarked
 */
export const getBookmarkStatus = async (postId: string): Promise<BookmarkStatusResponse> => {
    const response = await client.get<BookmarkStatusResponse>(`/api/bookmarks/${postId}`);
    return response.data;
};

/**
 * Bookmark a post
 */
export const bookmarkPost = async (postId: string): Promise<CreateBookmarkResponse> => {
    const response = await client.post<CreateBookmarkResponse>('/api/bookmarks', {
        post_id: postId,
    });
    return response.data;
};

/**
 * Remove a bookmark
 */
export const removeBookmark = async (postId: string): Promise<{ success: boolean }> => {
    const response = await client.delete<{ success: boolean }>(`/api/bookmarks/${postId}`);
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching bookmarked posts (infinite scroll)
 */
export const useBookmarks = () => {
    return useInfiniteQuery({
        queryKey: bookmarkKeys.all,
        queryFn: ({ pageParam }) => getBookmarks({ pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 60 * 1000, // 1 min
    });
};

/**
 * Hook to check if a post is bookmarked
 */
export const useBookmarkStatus = (postId: string | undefined) => {
    return useQuery({
        queryKey: bookmarkKeys.status(postId!),
        queryFn: () => getBookmarkStatus(postId!),
        enabled: !!postId,
        staleTime: 2 * 60 * 1000, // 2 min — status rarely changes spontaneously
    });
};

/**
 * Hook to bookmark a post
 */
export const useBookmarkPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => bookmarkPost(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(bookmarkKeys.status(postId), { bookmarked: true });
            queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
        },
    });
};

/**
 * Hook to remove a bookmark
 */
export const useRemoveBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => removeBookmark(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(bookmarkKeys.status(postId), { bookmarked: false, bookmark_id: null });
            queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
        },
    });
};

/**
 * Hook to toggle bookmark (convenience hook)
 */
export const useToggleBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
            if (isBookmarked) {
                return removeBookmark(postId);
            } else {
                return bookmarkPost(postId);
            }
        },
        onMutate: async ({ postId, isBookmarked }) => {
            // Cancel in-flight queries for this post's bookmark status
            await queryClient.cancelQueries({ queryKey: bookmarkKeys.status(postId) });
            const previousStatus = queryClient.getQueryData(bookmarkKeys.status(postId));

            // Optimistically update bookmark status
            queryClient.setQueryData(bookmarkKeys.status(postId), {
                bookmarked: !isBookmarked,
                bookmark_id: null,
            });

            // Optimistically patch is_bookmarked in ALL feed caches
            const feedUpdater = (oldData: any) => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((post: any) =>
                            post.id === postId
                                ? { ...post, is_bookmarked: !isBookmarked }
                                : post
                        ),
                    })),
                };
            };
            queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, feedUpdater);
            queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, feedUpdater);

            return { previousStatus, postId, wasBookmarked: isBookmarked };
        },
        onError: (_, __, context) => {
            if (context) {
                queryClient.setQueryData(bookmarkKeys.status(context.postId), context.previousStatus);
                // Rollback feed caches
                const rollbackUpdater = (oldData: any) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((post: any) =>
                                post.id === context.postId
                                    ? { ...post, is_bookmarked: context.wasBookmarked }
                                    : post
                            ),
                        })),
                    };
                };
                queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, rollbackUpdater);
                queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, rollbackUpdater);
            }
        },
        onSettled: (_, __, { postId }) => {
            queryClient.invalidateQueries({ queryKey: bookmarkKeys.status(postId) });
            queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
        },
    });
};
