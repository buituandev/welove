/**
 * Client API service for profile owners to manage their posts
 * Uses the /client endpoints which verify profile ownership
 */

import { Link, Post } from '@/types/post';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { feedKeys, postKeys, profileKeys } from './queryKeys';

// ============================================================================
// Types
// ============================================================================

export interface CreatePostInput {
    content?: string;
    location?: string;
    device?: string;
    deezer_id?: string | null;
    links?: Link[];
    is_ghost?: boolean;
    is_adult?: boolean;
    media_ids?: string[];
}

export interface CreatePostResponse {
    data: Post;
}

export interface DeletePostResponse {
    success: boolean;
    mediaDeleted: boolean;
}

// ============================================================================
// Shared Cache Helpers
// ============================================================================

type QC = ReturnType<typeof useQueryClient>;

/**
 * Patch a single post's field across every paginated feed cache.
 * Returns the previous snapshots so they can be rolled back.
 */
const patchPostInFeeds = (
    queryClient: QC,
    postId: string,
    patch: Partial<Post>
) => {
    const updater = (oldData: any): any => {
        if (!oldData?.pages) return oldData;
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((p: Post) =>
                    p.id === postId ? { ...p, ...patch } : p
                ),
            })),
        };
    };

    // Apply to all feed variants
    queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, updater);
    queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, updater);
    // profileFeed matched via prefix (profileId omitted)
    queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, updater);
};

/**
 * Snapshot the current data for all paginated feed queries so we can roll back.
 */
const snapshotFeeds = (queryClient: QC) => ({
    feeds: queryClient.getQueriesData<any>({ queryKey: feedKeys.home, exact: false }),
    profileFeeds: queryClient.getQueriesData<any>({ queryKey: ['profileFeed'], exact: false }),
    videoFeeds: queryClient.getQueriesData<any>({ queryKey: feedKeys.video, exact: false }),
});

type FeedSnapshot = ReturnType<typeof snapshotFeeds>;

const restoreFeeds = (queryClient: QC, snapshot: FeedSnapshot) => {
    for (const [key, data] of snapshot.feeds) queryClient.setQueryData(key, data);
    for (const [key, data] of snapshot.profileFeeds) queryClient.setQueryData(key, data);
    for (const [key, data] of snapshot.videoFeeds) queryClient.setQueryData(key, data);
};

/**
 * Invalidate all caches that depend on posts for a given profile.
 */
const invalidatePostCaches = (queryClient: QC, profileId: string) => {
    queryClient.invalidateQueries({ queryKey: feedKeys.home, exact: false });
    queryClient.invalidateQueries({ queryKey: feedKeys.profile(profileId) });
    queryClient.invalidateQueries({ queryKey: feedKeys.video, exact: false });
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
    queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
};

// ============================================================================
// API Functions
// ============================================================================

/** Create a new post */
export const createPost = async (
    profileId: string,
    data: CreatePostInput
): Promise<CreatePostResponse> => {
    const response = await client.post<CreatePostResponse>(
        `/api/profiles/${profileId}/posts/client`,
        data
    );
    return response.data;
};

/** Delete a post */
export const deletePost = async (
    profileId: string,
    postId: string,
    deleteMedia: boolean = false
): Promise<DeletePostResponse> => {
    const response = await client.delete<DeletePostResponse>(
        `/api/profiles/${profileId}/posts/client/${postId}`,
        { params: { deleteMedia } }
    );
    return response.data;
};

/** Get a single post */
export const getPost = async (
    profileId: string,
    postId: string
): Promise<{ data: Post }> => {
    const response = await client.get<{ data: Post }>(
        `/api/profiles/${profileId}/posts/client/${postId}`
    );
    return response.data;
};

/** Update a post (excludes media changes) */
export const updatePost = async (
    profileId: string,
    postId: string,
    data: CreatePostInput
): Promise<CreatePostResponse> => {
    const response = await client.put<CreatePostResponse>(
        `/api/profiles/${profileId}/posts/client/${postId}`,
        data
    );
    return response.data;
};

/** Share a post (increments share_count on the backend) */
export const sharePost = async (postId: string): Promise<any> => {
    const response = await client.post(`/api/posts/${postId}/share`);
    return response.data;
};

// ============================================================================
// React Query Mutation Hooks
// ============================================================================

/**
 * Create a post.
 * No optimistic UI — we navigate away on success, so a simple invalidation is fine.
 */
export const useCreatePost = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostInput) => createPost(profileId, data),
        onSettled: () => invalidatePostCaches(queryClient, profileId),
    });
};

/**
 * Delete a post.
 * Optimistically removes the post from all feed caches immediately,
 * rolls back on error, then re-syncs with the server on settled.
 */
export const useDeletePost = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, deleteMedia = false }: { postId: string; deleteMedia?: boolean }) =>
            deletePost(profileId, postId, deleteMedia),

        onMutate: async ({ postId }) => {
            // 1. Cancel any in-flight refetches
            await queryClient.cancelQueries({ queryKey: feedKeys.home, exact: false });
            await queryClient.cancelQueries({ queryKey: feedKeys.profile(profileId) });
            await queryClient.cancelQueries({ queryKey: feedKeys.video, exact: false });

            // 2. Snapshot for rollback
            const snapshot = snapshotFeeds(queryClient);

            // 3. Optimistically remove the post from all paginated feed caches
            const removePost = (oldData: any): any => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((p: Post) => p.id !== postId),
                    })),
                };
            };
            queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, removePost);
            queryClient.setQueriesData({ queryKey: feedKeys.profile(profileId) }, removePost);
            queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, removePost);

            return { snapshot };
        },

        onError: (_err, _vars, context) => {
            // Rollback to the snapshot taken before the optimistic update
            if (context?.snapshot) restoreFeeds(queryClient, context.snapshot);
        },

        onSettled: () => {
            // Always re-sync from the server to guarantee consistency
            invalidatePostCaches(queryClient, profileId);
            queryClient.invalidateQueries({ queryKey: postKeys.media(profileId) });
        },
    });
};

/**
 * Update a post.
 * Optimistically applies the text/metadata changes across all feed caches,
 * rolls back on error, then re-syncs on settled.
 */
export const useUpdatePost = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, data }: { postId: string; data: CreatePostInput }) =>
            updatePost(profileId, postId, data),

        onMutate: async ({ postId, data }) => {
            // 1. Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: feedKeys.home, exact: false });
            await queryClient.cancelQueries({ queryKey: feedKeys.profile(profileId) });

            // 2. Snapshot for rollback
            const snapshot = snapshotFeeds(queryClient);

            // 3. Build an optimistic patch from what we know changed
            const optimisticPatch: Partial<Post> = {};
            if (data.content !== undefined) optimisticPatch.content = data.content;
            if (data.location !== undefined) optimisticPatch.location = data.location;
            if (data.is_ghost !== undefined) optimisticPatch.is_ghost = data.is_ghost;
            if (data.is_adult !== undefined) optimisticPatch.is_adult = data.is_adult;

            patchPostInFeeds(queryClient, postId, optimisticPatch);

            return { snapshot };
        },

        onError: (_err, _vars, context) => {
            if (context?.snapshot) restoreFeeds(queryClient, context.snapshot);
        },

        onSettled: (_data, _err, variables) => {
            // Re-sync to make sure the server version is authoritative
            invalidatePostCaches(queryClient, profileId);
            queryClient.invalidateQueries({
                queryKey: postKeys.detail(profileId, variables.postId),
            });
        },
    });
};

/**
 * Share a post.
 * Optimistically increments share_count; rolls back on error.
 */
export const useSharePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => sharePost(postId),

        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: feedKeys.home, exact: false });
            const snapshot = snapshotFeeds(queryClient);

            // Delta-patch share_count specifically
            const shareUpdater = (oldData: any): any => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((p: Post) =>
                            p.id === postId
                                ? { ...p, share_count: Math.max(0, (p.share_count ?? 0) + 1) }
                                : p
                        ),
                    })),
                };
            };
            queryClient.setQueriesData({ queryKey: feedKeys.home, exact: false }, shareUpdater);
            queryClient.setQueriesData({ queryKey: ['profileFeed'], exact: false }, shareUpdater);
            queryClient.setQueriesData({ queryKey: feedKeys.video, exact: false }, shareUpdater);

            return { snapshot, postId };
        },

        onError: (_err, _postId, context) => {
            if (context?.snapshot) restoreFeeds(queryClient, context.snapshot);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: feedKeys.home, exact: false });
            queryClient.invalidateQueries({ queryKey: ['profileFeed'], exact: false });
        },
    });
};
