export type FeedMode = 'latest' | 'lucky' | 'this_day';

export interface PostResponse {
    data: Post[]
    pagination: Pagination
}

export interface Post {
    id: string
    profile_id: string
    created_at: string
    content: string
    location: any
    device: string
    deezer_id: string
    audio_url: string
    links: Link[]
    is_ghost: boolean
    is_adult: boolean
    is_liked: boolean
    is_bookmarked: boolean
    profile_name: string
    profile_avatar: string
    profile_is_verified: boolean
    media: Media[]
    like_count: number
    comment_count: number
    view_count: number
    share_count: number
    music: Music
    reposted_post?: any
}

export interface Link {
    url: string
    label: string
}

export interface Media {
    id: string
    type: string
    url: string
    thumbnail_url: any
    caption: string
    backup1: string | null;
    blurhash: string | 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.';
}

export interface Music {
    title: string
    artist: string
    album: string
    cover: string
    cover_url: string
    preview_url: string
    url: string
}

export interface Pagination {
    total: number
    limit: number
    hasMore: boolean
    hasNextPage: boolean
    nextCursor: string | null
}
