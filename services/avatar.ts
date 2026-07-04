import { ProfileAvatar } from "@/types/profileavatar";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export interface AvatarResponse {
    data: ProfileAvatar[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export const getAvatars = async ({
    profileId,
    pageParam
}: {
    profileId: string;
    pageParam?: string;
}): Promise<AvatarResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<AvatarResponse>(`/api/profiles/${profileId}/avatars`, { params });
    return response.data;
};

export const useInfiniteAvatars = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["avatars", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getAvatars({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: AvatarResponse) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled: !!profileId,
    });
};
