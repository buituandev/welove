import {
    FBGroupList,
    FBHighlightList,
    FBPhotoList,
    FBPostList,
    FBVideoList,
} from '@/types/localfb';
import { localFbStorage as storage } from './storage';



const STORAGE_PREFIX = 'localfb_';
const URL_PREFIX = 'localfb_url_';

/**
 * Fetches JSON from a URL. If the URL hasn't changed since the last fetch,
 * returns the cached version. Otherwise, downloads, caches, and returns fresh data.
 */
async function fetchWithCache<T>(key: string, url: string): Promise<T | null> {
    if (!url) return null;

    try {
        const urlKey = `${URL_PREFIX}${key}`;
        const dataKey = `${STORAGE_PREFIX}${key}`;

        // Check if URL has changed
        const storedUrl = storage.getString(urlKey);

        if (storedUrl === url) {
            // URL hasn't changed, try to return cached data
            const cachedData = storage.getString(dataKey);
            if (cachedData) {
                return JSON.parse(cachedData) as T;
            }
        }

        // URL changed or no cache, download fresh data
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Store both the URL and data
        storage.set(urlKey, url);
        storage.set(dataKey, JSON.stringify(data));

        return data as T;
    } catch (error) {
        console.warn(`[localfb] Failed to fetch ${key}:`, error);

        // Try to return cached data as fallback
        try {
            const cachedData = storage.getString(`${STORAGE_PREFIX}${key}`);
            if (cachedData) {
                return JSON.parse(cachedData) as T;
            }
        } catch { }

        return null;
    }
}

export interface FacebookMetadata {
    posts?: string;
    photos?: string;
    videos?: string;
    highlight?: string;
    joined_groups?: string;
}

export interface LocalFBData {
    posts: FBPostList | null;
    photos: FBPhotoList | null;
    videos: FBVideoList | null;
    highlights: FBHighlightList | null;
    groups: FBGroupList | null;
}

/**
 * Fetches all Facebook data sections based on the metadata URLs.
 * Only re-downloads when a URL changes.
 */
export async function fetchAllFacebookData(
    profileId: string,
    metadata: FacebookMetadata
): Promise<LocalFBData> {
    const prefix = `${profileId}_`;

    const [posts, photos, videos, highlights, groups] = await Promise.all([
        metadata.posts
            ? fetchWithCache<FBPostList>(`${prefix}posts`, metadata.posts)
            : null,
        metadata.photos
            ? fetchWithCache<FBPhotoList>(`${prefix}photos`, metadata.photos)
            : null,
        metadata.videos
            ? fetchWithCache<FBVideoList>(`${prefix}videos`, metadata.videos)
            : null,
        metadata.highlight
            ? fetchWithCache<FBHighlightList>(`${prefix}highlight`, metadata.highlight)
            : null,
        metadata.joined_groups
            ? fetchWithCache<FBGroupList>(`${prefix}groups`, metadata.joined_groups)
            : null,
    ]);

    return { posts, photos, videos, highlights, groups };
}
