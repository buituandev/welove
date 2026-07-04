/**
 * Like service for posts
 * Endpoints: GET/POST/DELETE /api/posts/[id]/like
 */

import { LikeResponse, LikeStatusResponse } from '@/types/like';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { feedKeys, likeKeys } from './queryKeys';
// ============================================================================
// API Functions
// ============================================================================

/**
 * Get like status and list of users who liked a post (paginated)
 */
export const getLikeStatus = async (
    postId: string,
    pageParam?: string
): Promise<LikeStatusResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<LikeStatusResponse>(`/api/posts/${postId}/like`, {
        params,
    });
    return response.data;
};

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<LikeResponse> => {
    const response = await client.post<LikeResponse>(`/api/posts/${postId}/like`);
    return response.data;
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<{ success: boolean }> => {
    const response = await client.delete<{ success: boolean }>(`/api/posts/${postId}/like`);
    return response.data;
};

// ============================================================================
// Cache helpers
// ============================================================================

/**
 * Patches a single post's like fields across all feed caches (home + profile).
 * This avoids refetching the entire feed — same pattern as Instagram/Twitter.
 */
const patchPostInFeedCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    postId: string,
    patch: { is_liked: boolean; like_count_delta: number }
) => {
    // Updater that walks every page and patches the matching post
    const updater = (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((post: any) =>
                    post.id === postId
                        ? {
                            ...post,
                            is_liked: patch.is_liked,
                            like_count: Math.max(0, post.like_count + patch.like_count_delta),
                        }
                        : post
                ),
            })),
        };
    };

    // Update ALL feed variants (latest, lucky, this_day)
    queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, updater);
    // Update ALL profile feed variants
    queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, updater);
};

/**
 * Patches like_count in the video (Shots) infinite feed cache.
 * Video items use post_id to link to a post, not their own id.
 */
const patchVideoFeedCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    postId: string,
    patch: { like_count_delta: number }
) => {
    const updater = (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((video: any) =>
                    video.post_id === postId
                        ? { ...video, like_count: Math.max(0, video.like_count + patch.like_count_delta) }
                        : video
                ),
            })),
        };
    };
    queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, updater);
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to get like status and paginated list of likers
 */
export const useLikeStatus = (postId: string | undefined) => {
    return useQuery({
        queryKey: likeKeys.status(postId!),
        queryFn: () => getLikeStatus(postId!),
        enabled: !!postId,
    });
};

/**
 * Hook for paginated list of users who liked a post (with infinite scroll)
 */
export const useLikers = (postId: string | undefined) => {
    return useInfiniteQuery({
        queryKey: likeKeys.likers(postId!),
        queryFn: ({ pageParam }) => getLikeStatus(postId!, pageParam),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId,
    });
};

/**
 * Hook to like a post
 */
export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => likePost(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(likeKeys.status(postId), { liked: true });
            queryClient.invalidateQueries({ queryKey: likeKeys.likers(postId) });
        },
    });
};

/**
 * Hook to unlike a post
 */
export const useUnlikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => unlikePost(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData(likeKeys.status(postId), { liked: false });
            queryClient.invalidateQueries({ queryKey: likeKeys.likers(postId) });
        },
    });
};

/**
 * Hook to toggle like (convenience hook)
 * Uses optimistic cache updates — directly patches the post in all feed caches
 * so navigating away and back preserves the correct state without refetching.
 */
export const useToggleLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
            if (isLiked) {
                return unlikePost(postId);
            } else {
                return likePost(postId);
            }
        },
        onMutate: async ({ postId, isLiked }) => {
            // Cancel any in-flight queries for this post's like status
            await queryClient.cancelQueries({ queryKey: likeKeys.status(postId) });
            const previous = queryClient.getQueryData(likeKeys.status(postId));

            // Update the like status query
            queryClient.setQueryData(likeKeys.status(postId), { liked: !isLiked });

            // Directly patch the post in ALL feed caches (home + profile)
            patchPostInFeedCaches(queryClient, postId, {
                is_liked: !isLiked,
                like_count_delta: isLiked ? -1 : 1,
            });

            // Also patch the video (Shots) feed cache
            patchVideoFeedCaches(queryClient, postId, {
                like_count_delta: isLiked ? -1 : 1,
            });

            return { previous, postId, wasLiked: isLiked };
        },
        onError: (_, __, context) => {
            if (context) {
                // Rollback like status
                queryClient.setQueryData(likeKeys.status(context.postId), context.previous);

                // Rollback feed caches
                patchPostInFeedCaches(queryClient, context.postId, {
                    is_liked: context.wasLiked,
                    like_count_delta: context.wasLiked ? 1 : -1,
                });

                // Rollback video feed cache
                patchVideoFeedCaches(queryClient, context.postId, {
                    like_count_delta: context.wasLiked ? 1 : -1,
                });
            }
        },
        onSettled: (_, __, { postId }) => {
            queryClient.invalidateQueries({ queryKey: likeKeys.status(postId) });
            queryClient.invalidateQueries({ queryKey: likeKeys.likers(postId) });
        },
    });
};

