const YT_URL_REGEX =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?(?:[^\s#]*?)&v=))([\w-]{11})(?:\S*)?/gi;

export function extractYouTubeIds(text: string | null | undefined): string[] {
    if (!text) return [];
    const ids: string[] = [];
    const seen = new Set<string>();
    YT_URL_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = YT_URL_REGEX.exec(text)) !== null) {
        const id = match[1];
        if (id && !seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }
    return ids;
}

/**
 * Best-effort extraction of a single video ID from either a full URL or a
 * bare 11-character ID string. Returns `null` if nothing matches.
 */
export function extractYouTubeId(urlOrId: string | null | undefined): string | null {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    const single = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^"&?/ ]{11})/i.exec(trimmed);
    if (single && single[1]) return single[1];
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
    return null;
}

/** Default thumbnail URL for a given YouTube video ID. */
export function youtubeThumbnailUrl(id: string): string {
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Remove every YouTube URL from `text`, collapsing the whitespace that
 * surrounded the removed match so the remaining caption reads naturally.
 * Returns an empty string if the input is falsy.
 */
export function stripYouTubeUrls(text: string | null | undefined): string {
    if (!text) return '';
    YT_URL_REGEX.lastIndex = 0;
    // Also consume adjacent whitespace (and an optional trailing punctuation
    // like a comma/period) so we don't leave dangling separators behind.
    const cleaned = text.replace(
        /\s*(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?(?:[^\s#]*?)&v=))([\w-]{11})(?:\S*)?\s*/gi,
        ' '
    );
    return cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}
