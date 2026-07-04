/**
 * Music service
 * Endpoints:
 *   GET  /api/profiles/[id]/music              - List profile music (paginated)
 *   POST /api/profiles/[id]/music              - Add a track (deezer_id)
 *   PUT  /api/profiles/[id]/music/[musicId]    - Update a track (deezer_id)
 *   DELETE /api/profiles/[id]/music/[musicId]  - Remove a track
 */

import { ProfileMusic } from "@/types/profilemusic";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";
import { type DeezerTrack } from "./deezer";
import { musicKeys } from "./queryKeys";

// ============================================================================
// Types
// ============================================================================

export interface MusicResponse {
    data: ProfileMusic[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddMusicPayload {
    profileId: string;
    deezer_id: string;
    /** Full track from Deezer search — used for instant optimistic updates */
    trackData?: DeezerTrack;
}

export interface UpdateMusicPayload {
    profileId: string;
    musicId: string;
    deezer_id: string;
}

export interface DeleteMusicPayload {
    profileId: string;
    musicId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated music for a profile
 */
export const getMusic = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<MusicResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<MusicResponse>(
        `/api/profiles/${profileId}/music`,
        { params }
    );
    return response.data;
};

/**
 * Add a new track to a profile
 */
export const addMusic = async ({
    profileId,
    deezer_id,
}: AddMusicPayload): Promise<{ data: ProfileMusic }> => {
    const response = await client.post<{ data: ProfileMusic }>(
        `/api/profiles/${profileId}/music`,
        { deezer_id }
    );
    return response.data;
};

/**
 * Update a track on a profile
 */
export const updateMusic = async ({
    profileId,
    musicId,
    deezer_id,
}: UpdateMusicPayload): Promise<{ data: ProfileMusic }> => {
    const response = await client.put<{ data: ProfileMusic }>(
        `/api/profiles/${profileId}/music/${musicId}`,
        { deezer_id }
    );
    return response.data;
};

/**
 * Remove a track from a profile
 */
export const deleteMusic = async ({
    profileId,
    musicId,
}: DeleteMusicPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/music/${musicId}`
    );
    return response.data;
};

// ============================================================================
// Infinite query helper — pages updater
// ============================================================================

type InfiniteMusicData = { pages: MusicResponse[]; pageParams: any[] };

const patchMusicPages = (
    old: InfiniteMusicData | undefined,
    updater: (items: ProfileMusic[]) => ProfileMusic[]
): InfiniteMusicData | undefined => {
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
 * Hook for fetching profile music (infinite scroll)
 */
export const useInfiniteMusic = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: musicKeys.all(profileId),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getMusic({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: MusicResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
        staleTime: 2 * 60 * 1000, // 2 min — music lists rarely change mid-session
    });
};

/**
 * Hook to add a track to a profile's music list.
 * Pass `trackData` (from Deezer search) for an instant fully-populated optimistic insert.
 */
export const useAddMusic = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = musicKeys.all(profileId);

    return useMutation({
        mutationFn: ({ deezer_id }: { deezer_id: string; trackData?: DeezerTrack }) =>
            addMusic({ profileId, deezer_id }),
        onMutate: async ({ deezer_id, trackData }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteMusicData>(qk);

            // If we have full track data from search, use it directly — instant & complete.
            // Otherwise fall back to a minimal placeholder.
            const optimistic: ProfileMusic = trackData
                ? {
                    id: `temp-${Date.now()}`,
                    profile_id: profileId,
                    deezer_id: trackData.deezer_id,
                    title: trackData.title,
                    artist: trackData.artist,
                    album: trackData.album,
                    url: trackData.url,
                    cover_url: trackData.cover_url,
                    duration: trackData.duration,
                    preview_url: trackData.preview,
                    preview_expires_at: null as any,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
                : {
                    id: `temp-${Date.now()}`,
                    profile_id: profileId,
                    deezer_id,
                    title: "Loading...",
                    artist: "",
                    album: "",
                    url: null as any,
                    cover_url: null as any,
                    duration: 0,
                    preview_url: null as any,
                    preview_expires_at: null as any,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

            queryClient.setQueryData<InfiniteMusicData>(qk, (old) =>
                patchMusicPages(old, (items) => [optimistic, ...items])
            );

            return { previous, optimisticId: optimistic.id };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(qk, context.previous);
            }
        },
        onSuccess: (result, _vars, context) => {
            // Server only returns { id, deezer_id, profile_id, created_at }.
            // Patch just the id — all Deezer metadata is already correct from the optimistic insert.
            queryClient.setQueryData<InfiniteMusicData>(qk, (old) =>
                patchMusicPages(old, (items) =>
                    items.map((item) =>
                        item.id === context?.optimisticId
                            ? { ...item, id: result.data.id }
                            : item
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
 * Hook to update a track on a profile's music list
 * Performs optimistic update on the matching track
 */
export const useUpdateMusic = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = musicKeys.all(profileId);

    return useMutation({
        mutationFn: ({ musicId, deezer_id }: { musicId: string; deezer_id: string }) =>
            updateMusic({ profileId, musicId, deezer_id }),
        onMutate: async ({ musicId, deezer_id }) => {
            await queryClient.cancelQueries({ queryKey: qk });
            const previous = queryClient.getQueryData<InfiniteMusicData>(qk);

            queryClient.setQueryData<InfiniteMusicData>(qk, (old) =>
                patchMusicPages(old, (items) =>
                    items.map((item) =>
                        item.id === musicId
                            ? {
                                ...item,
                                deezer_id,
                                title: "Updating track...",
                            }
                            : item
                    )
                )
            );

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(qk, context.previous);
            }
        },
        onSuccess: (result) => {
            // Replace the updated track with the fresh server data immediately
            queryClient.setQueryData<InfiniteMusicData>(qk, (old) =>
                patchMusicPages(old, (items) =>
                    items.map((item) =>
                        item.id === result.data.id ? result.data : item
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
 * Hook to delete a track from a profile's music list
 * Performs optimistic removal so the UI updates instantly
 */
export const useDeleteMusic = (profileId: string) => {
    const queryClient = useQueryClient();
    const qk = musicKeys.all(profileId);

    return useMutation({
        mutationFn: (musicId: string) =>
            deleteMusic({ profileId, musicId }),
        onMutate: async (musicId: string) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: qk });

            // Snapshot current data for rollback
            const previous = queryClient.getQueryData(qk);

            // Optimistically remove the track from all pages
            queryClient.setQueryData(qk, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: MusicResponse) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== musicId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },
        onError: (_err, _musicId, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(qk, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: qk });
        },
    });
};