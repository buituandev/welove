/**
 * Deezer music search service
 * Uses the server's /api/deezer endpoints to search and get track info
 */

import { useQuery } from '@tanstack/react-query';
import { client } from './client';

// ============================================================================
// Types
// ============================================================================

export interface DeezerTrack {
    deezer_id: string;
    title: string;
    artist: string;
    album: string;
    url: string;
    cover_url: string;
    duration: number;
    preview: string; // 30-second preview URL
}

export interface DeezerSearchResponse {
    data: DeezerTrack[];
    total: number;
}

export interface DeezerPreviewResponse {
    preview_url: string;
    expires_at: string;
    deezer_id: string;
    title: string;
    artist: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search Deezer for tracks
 * @param query - Search query (song title, artist, etc.)
 * @param limit - Max results to return (default: 20)
 */
export const searchDeezer = async (
    query: string,
    limit: number = 20
): Promise<DeezerSearchResponse> => {
    if (!query.trim()) {
        return { data: [], total: 0 };
    }

    const response = await client.get<DeezerSearchResponse>('/api/deezer/search', {
        params: { q: query, limit },
    });
    return response.data;
};

/**
 * Get fresh preview URL for a track
 * Use this when the preview URL has expired
 * @param deezerId - Deezer track ID
 */
export const getDeezerPreview = async (
    deezerId: string
): Promise<DeezerPreviewResponse> => {
    const response = await client.get<DeezerPreviewResponse>(
        `/api/deezer/preview/${deezerId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for searching Deezer
 * Automatically debounces and caches results
 */
export const useDeezerSearch = (query: string, limit: number = 20) => {
    return useQuery({
        queryKey: ['deezer-search', query, limit],
        queryFn: () => searchDeezer(query, limit),
        enabled: query.trim().length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
};

/**
 * Hook for getting fresh preview URL
 */
export const useDeezerPreview = (deezerId: string | null | undefined) => {
    return useQuery({
        queryKey: ['deezer-preview', deezerId],
        queryFn: () => getDeezerPreview(deezerId!),
        enabled: !!deezerId,
        staleTime: 1000 * 60 * 30, // 30 minutes (preview URLs last ~1 hour)
    });
};
