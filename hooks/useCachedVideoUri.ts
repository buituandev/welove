import { getCachedUri } from "@/services/videoCache";
import { useEffect, useState } from "react";

/**
 * Hook that resolves a video URL against the local video cache.
 * 
 * If the URL (or any of the provided fallback URLs) has already been
 * downloaded by the Shots pre-cacher, this returns the local file URI
 * for instant playback. Otherwise it returns the original URL.
 * 
 * Usage:
 *   const resolvedUrl = useCachedVideoUri(videoUrl);
 *   // or with a backup URL:
 *   const resolvedUrl = useCachedVideoUri(videoUrl, backupUrl);
 */
export const useCachedVideoUri = (primaryUrl: string | null, backupUrl?: string | null): string | null => {
    const [prevPrimaryUrl, setPrevPrimaryUrl] = useState<string | null>(primaryUrl);
    const [prevBackupUrl, setPrevBackupUrl] = useState<string | null | undefined>(backupUrl);
    const [resolved, setResolved] = useState<string | null>(primaryUrl);

    if (primaryUrl !== prevPrimaryUrl || backupUrl !== prevBackupUrl) {
        setPrevPrimaryUrl(primaryUrl);
        setPrevBackupUrl(backupUrl);
        setResolved(primaryUrl);
    }

    useEffect(() => {
        if (!primaryUrl) {
            return;
        }

        let cancelled = false;

        const resolve = async () => {
            // Try primary URL first
            const cachedPrimary = await getCachedUri(primaryUrl);
            if (!cancelled && cachedPrimary !== primaryUrl) {
                // Cache hit on primary
                setResolved(cachedPrimary);
                return;
            }

            // Try backup URL if provided
            if (backupUrl) {
                const cachedBackup = await getCachedUri(backupUrl);
                if (!cancelled && cachedBackup !== backupUrl) {
                    // Cache hit on backup
                    setResolved(cachedBackup);
                    return;
                }
            }

            // No cache hit — use original primary URL
            if (!cancelled) {
                setResolved(primaryUrl);
            }
        };

        resolve();
        return () => { cancelled = true; };
    }, [primaryUrl, backupUrl]);

    return resolved;
};
