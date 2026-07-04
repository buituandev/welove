/**
 * profileCache.ts — Post-author profile pre-caching
 *
 * Mirrors Bluesky's exact two-key architecture:
 *   src/state/queries/unstable-profile-cache.ts
 *
 * WHY TWO SEPARATE KEYS:
 * If we write the stub to `profileKeys.detail(id)` (the real profile key),
 * TanStack Query treats it as fresh cached data and skips the background
 * refetch (staleTime hasn't expired). The real bio/cover/counts never load.
 *
 * Solution: store the stub under a DIFFERENT key root:
 *   ['profileStub', id] — read-only by useProfile as placeholderData
 *   ['profile', id]     — always populated by the real API fetch
 *
 * This way:
 * 1. placeholderData reads the stub → profile header renders at 0ms
 * 2. The real profile key is always empty/stale → queryFn fires immediately
 * 3. When the API resolves, real data populates ['profile', id] → UI updates
 */

import { useCallback } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types/profile';
import { Post } from '@/types/post';

// ─── Stub cache keys (separate from profileKeys.detail) ───────────────────────

const STUB_KEY_ROOT = 'profileStub';

export const profileStubKey = (id: string) => [STUB_KEY_ROOT, id] as const;

// ─── Stub builder ─────────────────────────────────────────────────────────────

/**
 * Builds a minimal Profile stub from a post's author fields.
 * Only fields that are already embedded in every feed post response.
 */
function buildProfileStubFromPost(post: Post): Partial<Profile> {
    return {
        id: post.profile_id,
        name: post.profile_name,
        avatar_url: post.profile_avatar ?? null,
        is_verified: post.profile_is_verified ?? false,
        // Null defaults for fields the ProfileHeader accesses safely with ?.
        bio: null,
        cover_url: null,
        username: null,
        gender: null,
        is_admin: false,
        is_confidential: false,
        loved_ones: null,
    };
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Writes a partial Profile stub into the STUB cache (NOT the real profile cache).
 *
 * This is called from PostItem's useEffect. It is synchronous and free:
 *  - getQueryData → HashMap lookup
 *  - setQueryData → HashMap write, no network, no re-renders
 */
export function precacheProfileFromPost(
    queryClient: QueryClient,
    post: Post,
): void {
    if (!post.profile_id) return;

    const key = profileStubKey(post.profile_id);

    // Skip if we already have a stub for this profile
    const existing = queryClient.getQueryData<Partial<Profile>>(key);
    if (existing?.id === post.profile_id) return;

    queryClient.setQueryData<Partial<Profile>>(key, buildProfileStubFromPost(post));
}

// ─── Accessor for useProfile's placeholderData ────────────────────────────────

/**
 * Reads the pre-cached stub for a given profile ID.
 * Called inside `useProfile`'s `placeholderData` option — returns the stub
 * synchronously so the profile screen renders immediately, while the real
 * profile key fires its own fetch to the API.
 */
export function getProfileStub(
    queryClient: QueryClient,
    id: string,
): Partial<Profile> | undefined {
    return queryClient.getQueryData<Partial<Profile>>(profileStubKey(id));
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function usePrecacheProfileFromPost() {
    const queryClient = useQueryClient();
    return useCallback(
        (post: Post) => precacheProfileFromPost(queryClient, post),
        [queryClient],
    );
}
