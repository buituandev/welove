import { FeedMode, PostResponse } from "@/types/post";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";
import { feedKeys } from "./queryKeys";

export const getFeed = async ({
  mode = 'latest',
  limit = 20,
  cursor,
}: {
  mode?: FeedMode;
  limit?: number;
  cursor?: string;
}): Promise<PostResponse> => {
  const params: Record<string, any> = { mode, limit };
  if (cursor) params.cursor = cursor;

  const response = await client.get<PostResponse>("/api/posts", {
    params,
  });
  return response.data;
};

export const getProfileFeed = async ({
  profileId,
  limit = 20,
  cursor,
}: {
  profileId: string;
  limit?: number;
  cursor?: string;
}): Promise<PostResponse> => {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  params.showAdult = true;

  const response = await client.get<PostResponse>(`/api/profiles/${profileId}/posts`, {
    params,
  });
  return response.data;
};

export const useFeed = (mode: FeedMode = 'latest') => {
  return useInfiniteQuery({
    queryKey: feedKeys.feedMode(mode),
    queryFn: ({ pageParam }) => getFeed({ mode, limit: 20, cursor: pageParam as string }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Check if we have a next cursor and if there are more items
      return lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined;
    },
  });
};

export const useProfileFeed = (profileId: string, enabled = true) => {
  return useInfiniteQuery({
    queryKey: feedKeys.profile(profileId),
    queryFn: ({ pageParam }) => getProfileFeed({ profileId, limit: 20, cursor: pageParam as string }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined;
    },
    enabled: enabled && !!profileId,
  });
};
