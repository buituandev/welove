/**
 * Address service
 * Endpoints:
 *   GET  /api/profiles/[id]/addresses                  - List profile addresses (paginated)
 *   POST /api/profiles/[id]/addresses                  - Add an address
 *   PUT  /api/profiles/[id]/addresses/[addressId]      - Update an address
 *   DELETE /api/profiles/[id]/addresses/[addressId]    - Remove an address
 */

import { ProfileAddress } from "@/types/profileaddress";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";
import { addressKeys } from "./queryKeys";

// ============================================================================
// Types
// ============================================================================

export interface AddressResponse {
    data: ProfileAddress[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddAddressPayload {
    profileId: string;
    label: string;
    street: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
    is_primary?: boolean;
}

export interface UpdateAddressPayload {
    profileId: string;
    addressId: string;
    label: string;
    street: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
    is_primary?: boolean;
}

export interface DeleteAddressPayload {
    profileId: string;
    addressId: string;
}

// ============================================================================
// API Functions
// ============================================================================

export const getAddresses = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<AddressResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;
    const response = await client.get<AddressResponse>(
        `/api/profiles/${profileId}/addresses`,
        { params }
    );
    return response.data;
};

export const addAddress = async ({
    profileId,
    ...rest
}: AddAddressPayload): Promise<{ data: ProfileAddress }> => {
    const response = await client.post<{ data: ProfileAddress }>(
        `/api/profiles/${profileId}/addresses`,
        rest
    );
    return response.data;
};

export const updateAddress = async ({
    profileId,
    addressId,
    ...rest
}: UpdateAddressPayload): Promise<{ data: ProfileAddress }> => {
    const response = await client.put<{ data: ProfileAddress }>(
        `/api/profiles/${profileId}/addresses/${addressId}`,
        rest
    );
    return response.data;
};

export const deleteAddress = async ({
    profileId,
    addressId,
}: DeleteAddressPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/addresses/${addressId}`
    );
    return response.data;
};

// ============================================================================
// Infinite query helper
// ============================================================================

type InfiniteData = { pages: AddressResponse[]; pageParams: any[] };

const patchPages = (
    old: InfiniteData | undefined,
    updater: (items: ProfileAddress[]) => ProfileAddress[]
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
 * staleTime: 2 min — addresses rarely change mid-session.
 */
export const useInfiniteAddresses = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: addressKeys.all(profileId),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getAddresses({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: AddressResponse) =>
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
export const useAddAddress = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = addressKeys.all(profileId);

    return useMutation({
        mutationFn: (payload: Omit<AddAddressPayload, 'profileId'>) =>
            addAddress({ profileId, ...payload }),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            const optimistic: ProfileAddress = {
                id: `temp-${Date.now()}`,
                profile_id: profileId,
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as ProfileAddress;

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
 * Optimistically patches the address in-place.
 */
export const useUpdateAddress = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = addressKeys.all(profileId);

    return useMutation({
        mutationFn: ({ addressId, ...payload }: Omit<UpdateAddressPayload, 'profileId'>) =>
            updateAddress({ profileId, addressId, ...payload }),

        onMutate: async ({ addressId, ...payload }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) =>
                patchPages(old, (items) =>
                    items.map((item) =>
                        item.id === addressId ? { ...item, ...payload } : item
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
 * Optimistically removes the address from all pages.
 */
export const useDeleteAddress = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = addressKeys.all(profileId);

    return useMutation({
        mutationFn: (addressId: string) => deleteAddress({ profileId, addressId }),

        onMutate: async (addressId: string) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteData>(qk);

            queryClient.setQueryData<InfiniteData>(qk, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== addressId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },

        onError: (_err, _addressId, context) => {
            if (context?.previous) queryClient.setQueryData(qk, context.previous);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};
