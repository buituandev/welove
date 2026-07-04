export interface VideoItem {
    id: string;
    post_id: string | null;
    profile_id: string;
    profile_name: string;
    profile_avatar: string | null;
    media_url: string;
    media_type: string;
    thumbnail_url: string | null;
    caption: string | null;
    created_at: string;
    like_count: number;
    is_liked: boolean;
    comment_count: number;
}

export interface VideoPagination {
    hasNextPage: boolean;
    nextCursor: string | null;
    limit: number;
}

export type VideoFeedType = 'random' | 'on_this_day';

export interface VideoFeedResponse {
    data: VideoItem[];
    pagination: VideoPagination;
}
