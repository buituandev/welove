import { useCallback } from 'react';
import { videoResumeStorage as resumeStorage } from '../services/storage';



// Only track videos at least 5 minutes long
export const VIDEO_RESUME_MIN_DURATION = 300;

// Don't save position if the user is within the last 5% — treat as "finished"
const NEAR_END_THRESHOLD = 0.95;

// Don't save if they've barely started (< 5 seconds in)
const MIN_WATCHED_SECONDS = 5;

export function useVideoResume(videoUrl: string) {
    const getResumePosition = useCallback((): number | null => {
        const saved = resumeStorage.getString(videoUrl);
        return saved != null ? parseFloat(saved) : null;
    }, [videoUrl]);

    const savePosition = useCallback((position: number, duration: number): void => {
        if (!videoUrl) return;
        if (duration < VIDEO_RESUME_MIN_DURATION) return;
        if (position < MIN_WATCHED_SECONDS) return;
        if (position / duration > NEAR_END_THRESHOLD) {
            // Finished — clean up instead of resuming next time
            resumeStorage.remove(videoUrl);
            return;
        }
        resumeStorage.set(videoUrl, String(position));
    }, [videoUrl]);

    const clearPosition = useCallback((): void => {
        if (videoUrl) resumeStorage.remove(videoUrl);
    }, [videoUrl]);

    return { getResumePosition, savePosition, clearPosition };
}
