export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profile_name: string;
    profile_username: string | null;
    profile_avatar: string | undefined;
    profile_is_verified: boolean;
    profile_id: string | null;
    parent_id: string | null;
    reply_to_name: string | null;
    reply_to_username: string | null;
    reply_to_profile_id: string | null;
    reply_count?: number;
}

export interface CommentResponse {
    data: Comment[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface CreateCommentInput {
    content: string;
    parent_id?: string | null;
}

export interface UpdateCommentInput {
    content: string;
}