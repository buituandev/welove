export type MediaType = 'photo' | 'video';

export interface Media {
    id: string;
    profile_id: string;
    type: MediaType;
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    post_id: string | null;
    created_at: string;
    updated_at: string;
    backup1: string | null;
    blurhash: string | 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.';
    width: number | null;
    height: number | null;
}
