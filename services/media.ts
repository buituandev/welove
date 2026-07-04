import { Media, MediaType } from "@/types/media";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface MediaResponse {
    data: Media[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
    filter?: {
        type: MediaType;
    };
}

export const getMedia = async ({
    profileId,
    pageParam,
    type
}: {
    profileId: string;
    pageParam?: string;
    type?: MediaType;
}): Promise<MediaResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;
    if (type) params.type = type;

    const response = await client.get<MediaResponse>(`/api/profiles/${profileId}/media`, { params });
    return response.data;
};

export const useInfiniteMedia = (profileId: string, type?: MediaType, enabled = true) => {
    return useInfiniteQuery({
        queryKey: type ? ["media", profileId, type] : ["media", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getMedia({ profileId, pageParam, type }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: MediaResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: enabled && !!profileId,
    });
};
