import { cacheImage, getCachedImageUri } from '@/services/imageCache';
import { useEffect, useState } from 'react';

/**
 * Hook that resolves an image URL against the local file-system cache.
 *
 * 1. First checks if the URL is already cached → returns local URI instantly.
 * 2. If not cached, returns the remote URL immediately for display,
 *    then downloads in the background and swaps to the local URI once ready.
 *
 * Usage:
 *   const imageUri = useCachedImage(remoteUrl);
 *   <Image source={{ uri: imageUri }} />
 */
export const useCachedImage = (url: string | null | undefined): string | null => {
    const [prevUrl, setPrevUrl] = useState<string | null | undefined>(url);
    const [resolved, setResolved] = useState<string | null>(url ?? null);

    if (url !== prevUrl) {
        setPrevUrl(url);
        setResolved(url ?? null);
    }

    useEffect(() => {
        if (!url) {
            return;
        }

        let cancelled = false;

        const resolve = async () => {
            // Step 1: Check cache first (fast, synchronous-ish)
            const cached = await getCachedImageUri(url);
            if (cancelled) return;

            if (cached !== url) {
                // Cache hit — use local file
                setResolved(cached);
                return;
            }

            // Step 2: Show remote URL immediately while downloading
            setResolved(url);

            // Step 3: Download in background
            const localUri = await cacheImage(url);
            if (!cancelled && localUri !== url) {
                setResolved(localUri);
            }
        };

        resolve();
        return () => { cancelled = true; };
    }, [url]);

    return resolved;
};
