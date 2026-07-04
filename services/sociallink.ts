/**
 * SocialLink service
 * Endpoints:
 *   GET  /api/profiles/[id]/social-links               - List profile social links (paginated)
 *   POST /api/profiles/[id]/social-links               - Add a social link (platform, url, label)
 *   PUT  /api/profiles/[id]/social-links/[linkId]      - Update a social link (platform, url, label)
 *   DELETE /api/profiles/[id]/social-links/[linkId]    - Remove a social link
 */

import { ProfileLink } from "@/types/profilelink";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";
import { socialLinkKeys } from "./queryKeys";

// ============================================================================
// Types
// ============================================================================

export interface SocialLinkResponse {
    data: ProfileLink[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddSocialLinkPayload {
    profileId: string;
    platform: string;
    url: string;
    label?: string | null;
}

export interface UpdateSocialLinkPayload {
    profileId: string;
    linkId: string;
    platform: string;
    url: string;
    label?: string | null;
}

export interface DeleteSocialLinkPayload {
    profileId: string;
    linkId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated social links for a profile
 */
export const getSocialLinks = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<SocialLinkResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<SocialLinkResponse>(
        `/api/profiles/${profileId}/social-links`,
        { params }
    );
    return response.data;
};

/**
 * Add a new social link to a profile
 */
export const addSocialLink = async ({
    profileId,
    platform,
    url,
    label,
}: AddSocialLinkPayload): Promise<{ data: ProfileLink }> => {
    const response = await client.post<{ data: ProfileLink }>(
        `/api/profiles/${profileId}/social-links`,
        { platform, url, label }
    );
    return response.data;
};

/**
 * Update a social link on a profile
 */
export const updateSocialLink = async ({
    profileId,
    linkId,
    platform,
    url,
    label,
}: UpdateSocialLinkPayload): Promise<{ data: ProfileLink }> => {
    const response = await client.put<{ data: ProfileLink }>(
        `/api/profiles/${profileId}/social-links/${linkId}`,
        { platform, url, label }
    );
    return response.data;
};

/**
 * Remove a social link from a profile
 */
export const deleteSocialLink = async ({
    profileId,
    linkId,
}: DeleteSocialLinkPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/social-links/${linkId}`
    );
    return response.data;
};

// ============================================================================
// Infinite query helper — pages updater
// ============================================================================

type InfiniteData = { pages: SocialLinkResponse[]; pageParams: any[] };

const patchPages = (
    old: InfiniteData | undefined,
    updater: (items: ProfileLink[]) => ProfileLink[]
): InfiniteData | undefined => {
    if (!old) return old;
    return {
        ...old,
        pages: old.pages.map((page) => ({
            ...page,
            data: updater(page.data),
        })),
    };
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching profile social links (infinite scroll)
 * staleTime: 2 min — social links rarely change mid-session.
 */
export const useInfiniteSocialLinks = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: socialLinkKeys.all(profileId),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getSocialLinks({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: SocialLinkResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to add a social link — optimistically inserts a placeholder item
 * and replaces it with the real item on success.
 */
export const useAddSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = socialLinkKeys.all(profileId);

    return useMutation({
        mutationFn: ({ platform, url, label }: Omit<AddSocialLinkPayload, 'profileId'>) =>
            addSocialLink({ profileId, platform, url, label }),

        onMutate: async ({ platform, url, label }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            // Optimistic placeholder — server will replace with real item
            const optimistic: ProfileLink = {
                id: `temp-${Date.now()}`,
                profile_id: profileId,
                platform,
                url,
                label: label ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as ProfileLink;

            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) => [...items, optimistic])
            );

            return { previous, optimisticId: optimistic.id };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSuccess: (result, _vars, context) => {
            // Replace temp placeholder with real server item
            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) =>
                    items.map((item) =>
                        item.id === context?.optimisticId ? result.data : item
                    )
                )
            );
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};

/**
 * Hook to update a social link — optimistically patches in-place
 */
export const useUpdateSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = socialLinkKeys.all(profileId);

    return useMutation({
        mutationFn: ({ linkId, platform, url, label }: Omit<UpdateSocialLinkPayload, 'profileId'>) =>
            updateSocialLink({ profileId, linkId, platform, url, label }),

        onMutate: async ({ linkId, platform, url, label }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) =>
                    items.map((item) =>
                        item.id === linkId ? { ...item, platform, url, label: label ?? null } : item
                    )
                )
            );

            return { previous };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};

/**
 * Hook to delete a social link — optimistically removes from all pages
 */
export const useDeleteSocialLink = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = socialLinkKeys.all(profileId);

    return useMutation({
        mutationFn: (linkId: string) => deleteSocialLink({ profileId, linkId }),

        onMutate: async (linkId: string) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== linkId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },

        onError: (_err, _linkId, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};
