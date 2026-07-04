import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "./client";
import { Profile } from "@/types/profile";
import { profileKeys } from "./queryKeys";
import { getProfileStub } from "./profileCache";

export interface ProfilesResponse {
    data: Profile[];
    pagination: {
        total: number;
        totalMatches: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
    search?: {
        query: string;
        matchedField: string;
    };
}

export const getProfiles = async ({ pageParam, search }: { pageParam?: string; search?: string }) => {
    const params: Record<string, any> = { limit: 20 };
    if (pageParam) params.cursor = pageParam;
    if (search) params.search = search;

    const response = await client.get<ProfilesResponse>("/api/profiles", { params });
    return response.data;
};

export const useInfiniteProfiles = (search: string = "", enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: profileKeys.list(search),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => getProfiles({ pageParam, search }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: ProfilesResponse) => lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        enabled,
        staleTime: 60 * 1000, // 1 min
    });
};

export const getProfileDetail = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}`);
    return response.data.data;
}

export const getMyProfileDetail = async () => {
    const response = await client.get("/api/profiles/me");
    return response.data.data;
}

export const useProfile = (id: string, isMe: boolean) => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: isMe ? profileKeys.detail('me') : profileKeys.detail(id),
        queryFn: () => (isMe ? getMyProfileDetail() : getProfileDetail(id)),
        enabled: isMe || !!id,
        staleTime: 5 * 60 * 1000, // 5 min — profile rarely changes mid-session
        /**
         * placeholderData reads the stub from the SEPARATE stub cache
         * (written by precacheProfileFromPost in PostItem).
         *
         * Crucially, the stub lives under 'profileStub' key, NOT 'profile' key.
         * This means the real ['profile', id] query always fires its API fetch
         * immediately — the stub never blocks or delays the real data load.
         *
         * Flow:
         *   1. placeholderData() finds stub → data = stub, isPlaceholderData = true
         *   2. queryFn fires (real profile key is always empty/stale)
         *   3. API resolves → data = full profile, isPlaceholderData = false
         */
        placeholderData: () => {
            if (isMe) return undefined;
            return getProfileStub(queryClient, id) as Profile | undefined;
        },
    });
};

export const checkAdmin = async () => {
    const response = await client.get("/api/admin/check");
    return response.data;
}

export const useAdminCheck = () => {
    return useQuery({
        queryKey: profileKeys.adminCheck,
        queryFn: checkAdmin,
        retry: false,
        staleTime: 10 * 60 * 1000, // 10 min — admin status very stable
    });
};

export const updateProfile = async (id: string, data: any) => {
    const response = await client.put(`/api/profiles/${id}`, data);
    return response.data;
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateProfile(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel in-flight refetches so they don't overwrite our optimistic update
            const meKey = profileKeys.detail('me');
            const idKey = profileKeys.detail(id);
            await queryClient.cancelQueries({ queryKey: meKey });
            await queryClient.cancelQueries({ queryKey: idKey });

            const previousMe = queryClient.getQueryData<Profile>(meKey);
            const previousById = queryClient.getQueryData<Profile>(idKey);

            // Optimistically apply the update to both caches
            const apply = (old: Profile | undefined) => old ? { ...old, ...data } : old;
            queryClient.setQueryData(meKey, apply);
            if (id !== 'me') queryClient.setQueryData(idKey, apply);

            return { previousMe, previousById, id };
        },
        onError: (_err, _vars, context) => {
            if (context) {
                queryClient.setQueryData(profileKeys.detail('me'), context.previousMe);
                if (context.id !== 'me') queryClient.setQueryData(profileKeys.detail(context.id), context.previousById);
            }
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
            if (variables.id !== 'me') queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
        },
    });
};
