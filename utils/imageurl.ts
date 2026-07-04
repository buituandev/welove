// Minimal shape shared by both types/media.Media and types/post.Media
interface MediaWithFallback {
    url: string;
    backup1?: string | null;
    thumbnail_url?: string | null;
}

export const buildFallbackUrls = (mediaItem: MediaWithFallback, placeholder: string): string[] => {
    const urls: string[] = [];
    if (mediaItem.thumbnail_url) urls.push(mediaItem.thumbnail_url);
    if (mediaItem.url) urls.push(mediaItem.url);
    if (mediaItem.backup1) urls.push(mediaItem.backup1);
    urls.push(placeholder);
    return urls;
};

export const choosenMediaPath = (video: MediaWithFallback): string => {
    const sources = [video.url, video.backup1].filter(Boolean) as string[];


    // return sources.find(src => src.startsWith('https://tinyvault.space/'))
    //     || sources[0]
    //     || '';

    //return normal url
    return sources[0];
};
