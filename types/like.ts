// ============================================================================
// Types
// ============================================================================

export interface LikeUser {
    id: string;
    created_at: string;
    user_id: string;
    profile_id: string | null;
    profile_name: string;
    profile_avatar: string | undefined;
    profile_is_verified: boolean;
}

export interface LikeStatusResponse {
    liked: boolean;
    data: LikeUser[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface LikeResponse {
    data: {
        id: string;
        post_id: string;
        user_id: string;
        created_at: string;
    } | null;
    alreadyLiked?: boolean;
}
