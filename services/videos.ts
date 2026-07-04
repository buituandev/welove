import { VideoFeedResponse, VideoFeedType } from "@/types/video";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { client } from "./client";

/**
 * Fetch video feed from the server.
 * Uses cursor-based pagination (similar to posts feed).
 *
 * The server expects:
 * - type:   'random' | 'on_this_day'
 * - limit:  number
 * - cursor: base64url-encoded cursor from the previous page
 */
export const getVideoFeed = async ({
    type = 'random',
    limit = 20,
    cursor,
}: {
    type?: VideoFeedType;
    limit?: number;
    cursor?: string;
}): Promise<VideoFeedResponse> => {
    const params: Record<string, any> = { type, limit };
    if (cursor) params.cursor = cursor;

    const response = await client.get<VideoFeedResponse>("/api/videos", {
        params,
    });
    return response.data;
};

/**
 * React Query hook for fetching video feed.
 * Currently fetches a single (first) page since Shots uses a flat list with preloading.
 * Can be extended to infinite scroll by wiring cursor-based pagination.
 */
export const useVideoFeed = (type: VideoFeedType = 'random', limit: number = 30) => {
    return useQuery({
        queryKey: ["videoFeed", type],
        queryFn: () => getVideoFeed({ type, limit }),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Cursor-based infinite feed for Shots.
 * Flattens pages in the ViewModel/UI.
 */
export const useInfiniteVideoFeed = (type: VideoFeedType = 'random', limit: number = 30) => {
    return useInfiniteQuery({
        queryKey: ["videoFeed", type, limit],
        queryFn: ({ pageParam }) =>
            getVideoFeed({ type, limit, cursor: pageParam as string | undefined }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
