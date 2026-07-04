export const isGifUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.endsWith('.gif') || lowercaseUrl.includes('.gif?');
};