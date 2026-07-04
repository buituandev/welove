/**
 * Centralized query key factory
 * Rule: qk-factory-pattern — use factories for consistency, type safety, and safe invalidation.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: socialLinkKeys.all(profileId) })
 *   queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') })
 */

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileKeys = {
    all: ['profile'] as const,
    lists: () => [...profileKeys.all, 'list'] as const,
    list: (search: string) => [...profileKeys.lists(), search] as const,
    detail: (id: string) => [...profileKeys.all, id] as const,
    adminCheck: ['admin-check'] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────
export const feedKeys = {
    home: ['feed'] as const,
    feedMode: (mode: string) => ['feed', mode] as const,
    profile: (profileId: string) => ['profileFeed', profileId] as const,
    video: ['videoFeed'] as const,
};

// ─── Like ─────────────────────────────────────────────────────────────────────
export const likeKeys = {
    status: (postId: string) => ['like', postId] as const,
    likers: (postId: string) => ['likers', postId] as const,
};

// ─── Bookmark ─────────────────────────────────────────────────────────────────
export const bookmarkKeys = {
    all: ['bookmarks'] as const,
    status: (postId: string) => ['bookmark', postId] as const,
};

// ─── Post ──────────────────────────────────────────────────────────────────────
export const postKeys = {
    /** Single post detail */
    detail: (profileId: string, postId: string) =>
        ['posts', profileId, postId] as const,

    /** Media associated with a profile */
    media: (profileId: string) => ['media', profileId] as const,
};

// ─── Comment ──────────────────────────────────────────────────────────────────
export const commentKeys = {
    list: (postId: string) => ['comments', postId] as const,
    replies: (postId: string, commentId: string) => ['comments', postId, commentId, 'replies'] as const,
};

// ─── Note ─────────────────────────────────────────────────────────────────────
export const noteKeys = {
    all: ['notes'] as const,
    list: (limit: number) => [...noteKeys.all, limit] as const,
    detail: (id: number) => ['note', id] as const,
};

// ─── Social Link ──────────────────────────────────────────────────────────────
export const socialLinkKeys = {
    all: (profileId: string) => ['social-links', profileId] as const,
};

// ─── Address ──────────────────────────────────────────────────────────────────
export const addressKeys = {
    all: (profileId: string) => ['addresses', profileId] as const,
};

// ─── Music ────────────────────────────────────────────────────────────────────
export const musicKeys = {
    all: (profileId: string) => ['music', profileId] as const,
};

// ─── Workplace ────────────────────────────────────────────────────────────────
export const workplaceKeys = {
    all: (profileId: string) => ['workplaces', profileId] as const,
};

// ─── Carousel ────────────────────────────────────────────────────────────────
export const carouselKeys = {
    all: ['carousel'] as const,
    lists: () => [...carouselKeys.all, 'list'] as const,
};

// ─── CGV ──────────────────────────────────────────────────────────────────────
export const cgvKeys = {
    all: ['cgv'] as const,
    movies: () => [...cgvKeys.all, 'movies'] as const,
    sneakShow: () => [...cgvKeys.movies(), 'sneakShow'] as const,
};
