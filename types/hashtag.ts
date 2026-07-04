import { Post } from "./post";

export interface Hashtag {
    id: string;
    tag: string;
    created_at?: string;
    count?: number;
}

export interface HashtagsResponse {
    data: Hashtag[];
}

export interface HashtagPostsResponse {
    data: Post[];
    hashtag: { id: string; tag: string };
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}
