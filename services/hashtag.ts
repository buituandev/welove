/**
 * Hashtag service
 * Endpoints:
 *   GET /api/hashtags           - Search/list/trending hashtags
 *   GET /api/hashtags/[tag]     - Get posts for a hashtag
 */

import { HashtagPostsResponse, HashtagsResponse } from '@/types/hashtag';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { client } from './client';
// ============================================================================
// API Functions
// ============================================================================

/**
 * Search hashtags
 */
export const searchHashtags = async (search?: string, limit?: number): Promise<HashtagsResponse> => {
    const params: Record<string, any> = {};
    if (search) params.search = search;
    if (limit) params.limit = limit;

    const response = await client.get<HashtagsResponse>('/api/hashtags', { params });
    return response.data;
};

/**
 * Get trending hashtags
 */
export const getTrendingHashtags = async (limit?: number): Promise<HashtagsResponse> => {
    const params: Record<string, any> = { trending: 'true' };
    if (limit) params.limit = limit;

    const response = await client.get<HashtagsResponse>('/api/hashtags', { params });
    return response.data;
};

/**
 * Get posts for a specific hashtag (paginated)
 */
export const getHashtagPosts = async ({
    tag,
    pageParam,
}: {
    tag: string;
    pageParam?: string;
}): Promise<HashtagPostsResponse> => {
    const params: Record<string, any> = {};
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<HashtagPostsResponse>(
        `/api/hashtags/${encodeURIComponent(tag)}`,
        { params }
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for searching hashtags
 */
export const useSearchHashtags = (search: string | undefined, limit?: number) => {
    return useQuery({
        queryKey: ['hashtags', 'search', search, limit],
        queryFn: () => searchHashtags(search, limit),
        enabled: search !== undefined && search.length > 0,
    });
};

/**
 * Hook for getting trending hashtags
 */
export const useTrendingHashtags = (limit?: number) => {
    return useQuery({
        queryKey: ['hashtags', 'trending', limit],
        queryFn: () => getTrendingHashtags(limit),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook for fetching posts by hashtag (infinite scroll)
 */
export const useHashtagPosts = (tag: string | undefined) => {
    return useInfiniteQuery({
        queryKey: ['hashtags', 'posts', tag],
        queryFn: ({ pageParam }) => getHashtagPosts({ tag: tag!, pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!tag,
    });
};
