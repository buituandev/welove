/**
 * Workplace service
 * Endpoints:
 *   GET  /api/profiles/[id]/workplaces                 - List profile workplaces (paginated)
 *   POST /api/profiles/[id]/workplaces                 - Add a workplace
 *   PUT  /api/profiles/[id]/workplaces/[workplaceId]   - Update a workplace
 *   DELETE /api/profiles/[id]/workplaces/[workplaceId] - Remove a workplace
 */

import { Workplace } from "@/types/profileworplace";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";
import { workplaceKeys } from "./queryKeys";

// ============================================================================
// Types
// ============================================================================

export interface WorkplaceResponse {
    data: Workplace[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddWorkplacePayload {
    profileId: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    description?: string | null;
}

export interface UpdateWorkplacePayload {
    profileId: string;
    workplaceId: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    description?: string | null;
}

export interface DeleteWorkplacePayload {
    profileId: string;
    workplaceId: string;
}

// ============================================================================
// API Functions
// ============================================================================

export const getWorkplaces = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<WorkplaceResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;
    const response = await client.get<WorkplaceResponse>(
        `/api/profiles/${profileId}/workplaces`,
        { params }
    );
    return response.data;
};

/** Legacy function for backward compatibility */
export const getWorkplace = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}/workplaces`);
    return response.data.data;
};

export const addWorkplace = async ({
    profileId,
    ...rest
}: AddWorkplacePayload): Promise<{ data: Workplace }> => {
    const response = await client.post<{ data: Workplace }>(
        `/api/profiles/${profileId}/workplaces`,
        rest
    );
    return response.data;
};

export const updateWorkplace = async ({
    profileId,
    workplaceId,
    ...rest
}: UpdateWorkplacePayload): Promise<{ data: Workplace }> => {
    const response = await client.put<{ data: Workplace }>(
        `/api/profiles/${profileId}/workplaces/${workplaceId}`,
        rest
    );
    return response.data;
};

export const deleteWorkplace = async ({
    profileId,
    workplaceId,
}: DeleteWorkplacePayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/workplaces/${workplaceId}`
    );
    return response.data;
};

// ============================================================================
// Infinite query helper
// ============================================================================

type InfiniteData = { pages: WorkplaceResponse[]; pageParams: any[] };

const patchPages = (
    old: InfiniteData | undefined,
    updater: (items: Workplace[]) => Workplace[]
): InfiniteData | undefined => {
    if (!old) return old;
    return {
        ...old,
        pages: old.pages.map((page) => ({ ...page, data: updater(page.data) })),
    };
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * staleTime: 2 min — workplaces rarely change mid-session.
 */
export const useInfiniteWorkplaces = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: workplaceKeys.all(profileId),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getWorkplaces({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: WorkplaceResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Optimistically inserts a placeholder, replaces with real item on success.
 */
export const useAddWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = workplaceKeys.all(profileId);

    return useMutation({
        mutationFn: (payload: Omit<AddWorkplacePayload, 'profileId'>) =>
            addWorkplace({ profileId, ...payload }),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            const optimistic: Workplace = {
                id: `temp-${Date.now()}`,
                profile_id: profileId,
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as Workplace;

            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) => [...items, optimistic])
            );

            return { previous, optimisticId: optimistic.id };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSuccess: (result, _vars, context) => {
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
 * Optimistically patches the workplace in-place.
 */
export const useUpdateWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = workplaceKeys.all(profileId);

    return useMutation({
        mutationFn: ({ workplaceId, ...payload }: Omit<UpdateWorkplacePayload, 'profileId'>) =>
            updateWorkplace({ profileId, workplaceId, ...payload }),

        onMutate: async ({ workplaceId, ...payload }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) =>
                    items.map((item) =>
                        item.id === workplaceId ? { ...item, ...payload } : item
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
 * Optimistically removes the workplace from all pages.
 */
export const useDeleteWorkplace = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = workplaceKeys.all(profileId);

    return useMutation({
        mutationFn: (workplaceId: string) => deleteWorkplace({ profileId, workplaceId }),

        onMutate: async (workplaceId: string) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== workplaceId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },

        onError: (_err, _workplaceId, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};