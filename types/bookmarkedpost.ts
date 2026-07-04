import { Post } from "./post";

export interface BookmarkedPost extends Post {
    bookmark_id: string;
    bookmarked_at: string;
}

export interface BookmarksResponse {
    data: BookmarkedPost[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface BookmarkStatusResponse {
    bookmarked: boolean;
    bookmark_id: string | null;
}

export interface CreateBookmarkResponse {
    data: {
        id: string;
        user_id: string;
        post_id: string;
        created_at: string;
    } | null;
    alreadyBookmarked?: boolean;
}