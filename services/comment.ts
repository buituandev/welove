/**
 * Comment service for posts
 * Endpoints: 
 *   GET/POST   /api/posts/[id]/comments
 *   PUT/DELETE /api/posts/[id]/comments/[commentId]
 */

import { Comment, CommentResponse, CreateCommentInput, UpdateCommentInput } from '@/types/comment';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { commentKeys, feedKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get comments/replies for a post (paginated)
 */
export const getComments = async ({
    postId,
    pageParam,
    parentId,
}: {
    postId: string;
    pageParam?: string;
    parentId?: string;
}): Promise<CommentResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;
    if (parentId) params.parent_id = parentId;

    const response = await client.get<CommentResponse>(`/api/posts/${postId}/comments`, {
        params,
    });
    return response.data;
};

/**
 * Create a comment on a post
 */
export const createComment = async (
    postId: string,
    data: CreateCommentInput
): Promise<{ data: Comment }> => {
    const response = await client.post<{ data: Comment }>(
        `/api/posts/${postId}/comments`,
        data
    );
    return response.data;
};

/**
 * Update a comment
 */
export const updateComment = async (
    postId: string,
    commentId: string,
    data: UpdateCommentInput
): Promise<{ data: Comment }> => {
    const response = await client.put<{ data: Comment }>(
        `/api/posts/${postId}/comments/${commentId}`,
        data
    );
    return response.data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (
    postId: string,
    commentId: string
): Promise<{ success: boolean }> => {
    const response = await client.delete<{ success: boolean }>(
        `/api/posts/${postId}/comments/${commentId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Patches a single post's comment_count across all feed caches.
 * Same pattern as patchPostInFeedCaches in like.ts — instant UI update.
 */
const patchCommentCountInFeedCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    postId: string,
    delta: number
) => {
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
                            comment_count: Math.max(0, (post.comment_count ?? 0) + delta),
                        }
                        : post
                ),
            })),
        };
    };

    queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, updater);
    queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, updater);

    // Also patch the video (Shots) feed — videos link to posts via post_id
    const videoUpdater = (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((video: any) =>
                    video.post_id === postId
                        ? { ...video, comment_count: Math.max(0, (video.comment_count ?? 0) + delta) }
                        : video
                ),
            })),
        };
    };
    queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, videoUpdater);
};

/**
 * Hook for fetching comments on a post (infinite scroll)
 */
export const useComments = (postId: string | undefined) => {
    return useInfiniteQuery({
        queryKey: commentKeys.list(postId!),
        queryFn: ({ pageParam }) => getComments({ postId: postId!, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId,
        staleTime: 30 * 1000, // 30s — comments change frequently
    });
};

/**
 * Hook for fetching replies on a comment (infinite scroll)
 */
export const useReplies = (postId: string | undefined, parentId: string | undefined) => {
    return useInfiniteQuery({
        queryKey: commentKeys.replies(postId!, parentId!),
        queryFn: ({ pageParam }) => getComments({ postId: postId!, parentId: parentId!, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!postId && !!parentId,
        staleTime: 30 * 1000,
    });
};

/**
 * Hook for creating a comment/reply — optimistically inserts into list or replies cache
 */
export const useCreateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommentInput) => createComment(postId, data),
        onMutate: async (variables) => {
            const listKey = commentKeys.list(postId);
            const repliesKey = variables.parent_id ? commentKeys.replies(postId, variables.parent_id) : null;

            // 1. Cancel in-flight refetches
            await queryClient.cancelQueries({ queryKey: listKey });
            if (repliesKey) {
                await queryClient.cancelQueries({ queryKey: repliesKey });
            }

            // 2. Snapshot previous values
            const previousList = queryClient.getQueryData(listKey);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            // 3. Construct optimistic comment
            const myProfile = queryClient.getQueryData<any>(['profile', 'me']);
            const optimisticComment: Comment = {
                id: `temp-${Date.now()}`,
                post_id: postId,
                user_id: myProfile?.user_id || "",
                content: variables.content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                profile_name: myProfile?.name || "Me",
                profile_username: myProfile?.username || null,
                profile_avatar: myProfile?.avatar_url || undefined,
                profile_is_verified: !!myProfile?.is_verified,
                profile_id: myProfile?.id || null,
                parent_id: variables.parent_id || null,
                reply_to_name: null,
                reply_to_username: null,
                reply_to_profile_id: null,
                reply_count: 0
            };

            // Resolve parent comment info if this is a reply to reply/comment
            if (variables.parent_id && previousList) {
                const parentComment = (previousList as any)?.pages
                    ?.flatMap((p: any) => p.data)
                    ?.find((c: any) => String(c.id) === String(variables.parent_id));
                if (parentComment) {
                    optimisticComment.reply_to_name = parentComment.profile_name || null;
                    optimisticComment.reply_to_username = parentComment.profile_username || null;
                    optimisticComment.reply_to_profile_id = parentComment.profile_id || null;
                }
            }

            // 4. Update caches optimistically
            if (repliesKey) {
                // Add reply to sub-list
                queryClient.setQueryData(repliesKey, (old: any) => {
                    if (!old?.pages) {
                        return {
                            pages: [{
                                data: [optimisticComment],
                                pagination: { total: 1, limit: 20, hasNextPage: false, nextCursor: null }
                            }],
                            pageParams: [undefined]
                        };
                    }
                    return {
                        ...old,
                        pages: old.pages.map((page: any, idx: number) => {
                            if (idx === old.pages.length - 1) {
                                return {
                                    ...page,
                                    data: [...page.data, optimisticComment]
                                };
                            }
                            return page;
                        })
                    };
                });

                // Increment reply count on top-level parent comment
                queryClient.setQueryData(listKey, (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((c: any) => 
                                String(c.id) === String(variables.parent_id) 
                                    ? { ...c, reply_count: (c.reply_count || 0) + 1 } 
                                    : c
                            )
                        }))
                    };
                });
            } else {
                // Add top-level comment to list
                queryClient.setQueryData(listKey, (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any, idx: number) => {
                            if (idx === 0) {
                                return {
                                    ...page,
                                    data: [optimisticComment, ...page.data]
                                };
                            }
                            return page;
                        })
                    };
                });
            }

            // Optimistically increment comment count in feed caches
            patchCommentCountInFeedCaches(queryClient, postId, +1);

            return { previousList, previousReplies, optimisticComment };
        },
        onSuccess: (res, variables, context) => {
            const realComment = res.data;
            const listKey = commentKeys.list(postId);

            // Replace temp comment in list
            queryClient.setQueryData(listKey, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((c: any) => 
                            c.id === context?.optimisticComment.id ? realComment : c
                        )
                    }))
                };
            });

            // Replace temp comment in replies
            if (variables.parent_id) {
                const repliesKey = commentKeys.replies(postId, variables.parent_id);
                queryClient.setQueryData(repliesKey, (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((c: any) => 
                                c.id === context?.optimisticComment.id ? realComment : c
                            )
                        }))
                    };
                });
            }
        },
        onError: (_err, variables, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(commentKeys.list(postId), context.previousList);
            }
            if (variables.parent_id && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parent_id), context.previousReplies);
            }
            // Roll back the optimistic increment
            patchCommentCountInFeedCaches(queryClient, postId, -1);
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
            if (variables.parent_id) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parent_id) });
            }
        },
    });
};

/**
 * Hook for updating a comment or reply
 */
export const useUpdateComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentInput; parentId?: string | null }) =>
            updateComment(postId, commentId, data),
        onMutate: async ({ commentId, data, parentId }) => {
            const listKey = commentKeys.list(postId);
            const repliesKey = parentId ? commentKeys.replies(postId, parentId) : null;

            await queryClient.cancelQueries({ queryKey: listKey });
            if (repliesKey) {
                await queryClient.cancelQueries({ queryKey: repliesKey });
            }

            const previousList = queryClient.getQueryData(listKey);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            const updater = (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((c: Comment) =>
                            c.id === commentId ? { ...c, ...data } : c
                        ),
                    })),
                };
            };

            queryClient.setQueryData(listKey, updater);
            if (repliesKey) {
                queryClient.setQueryData(repliesKey, updater);
            }

            return { previousList, previousReplies };
        },
        onError: (_err, variables, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(commentKeys.list(postId), context.previousList);
            }
            if (variables.parentId && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parentId), context.previousReplies);
            }
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
            if (variables.parentId) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parentId) });
            }
        },
    });
};

/**
 * Hook for deleting a comment/reply — optimistically decrements comment_count
 */
export const useDeleteComment = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId }: { commentId: string; parentId?: string | null }) => deleteComment(postId, commentId),
        onMutate: async ({ commentId, parentId }) => {
            const listKey = commentKeys.list(postId);
            const repliesKey = parentId ? commentKeys.replies(postId, parentId) : null;

            await queryClient.cancelQueries({ queryKey: listKey });
            if (repliesKey) {
                await queryClient.cancelQueries({ queryKey: repliesKey });
            }

            const previousList = queryClient.getQueryData(listKey);
            const previousReplies = repliesKey ? queryClient.getQueryData(repliesKey) : null;

            const filterFn = (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((c: Comment) => c.id !== commentId),
                    })),
                };
            };

            queryClient.setQueryData(listKey, filterFn);
            if (repliesKey) {
                queryClient.setQueryData(repliesKey, filterFn);
            }

            // Decrement parent reply count if a reply is deleted
            if (parentId) {
                queryClient.setQueryData(listKey, (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((c: any) => 
                                String(c.id) === String(parentId) 
                                    ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) } 
                                    : c
                            )
                        }))
                    };
                });
            }

            // Optimistically decrement comment count in feed caches
            patchCommentCountInFeedCaches(queryClient, postId, -1);

            return { previousList, previousReplies };
        },
        onError: (_err, variables, context) => {
            if (context?.previousList) {
                queryClient.setQueryData(commentKeys.list(postId), context.previousList);
            }
            if (variables.parentId && context?.previousReplies) {
                queryClient.setQueryData(commentKeys.replies(postId, variables.parentId), context.previousReplies);
            }
            // Roll back the optimistic decrement
            patchCommentCountInFeedCaches(queryClient, postId, +1);
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
            if (variables.parentId) {
                queryClient.invalidateQueries({ queryKey: commentKeys.replies(postId, variables.parentId) });
            }
        },
    });
};

