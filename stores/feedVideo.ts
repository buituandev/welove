import { create } from 'zustand';

interface FeedVideoStore {
    /** The post ID whose video is currently active (visible + should play) */
    activePostId: string | null;
    /** The specific media item ID that is currently playing */
    activeMediaId: string | null;
    /** The video URL for the active media item */
    activeVideoUrl: string | null;
    /** Whether feed videos are globally muted (persists across posts) */
    isMuted: boolean;
    /** Whether the current video has finished playing */
    isEnded: boolean;

    // Actions
    setActiveVideo: (postId: string | null, mediaId: string | null, videoUrl: string | null) => void;
    /** Update only the active media within the same post (carousel swipe) */
    setActiveMedia: (mediaId: string | null, videoUrl: string | null) => void;
    toggleMute: () => void;
    setMuted: (muted: boolean) => void;
    setEnded: (ended: boolean) => void;
    clearActiveVideo: () => void;
}

export const useFeedVideoStore = create<FeedVideoStore>((set) => ({
    activePostId: null,
    activeMediaId: null,
    activeVideoUrl: null,
    isMuted: true, // Muted by default
    isEnded: false,

    setActiveVideo: (postId, mediaId, videoUrl) => set({
        activePostId: postId,
        activeMediaId: mediaId,
        activeVideoUrl: videoUrl,
        isEnded: false, // Reset ended state when switching videos
    }),

    setActiveMedia: (mediaId, videoUrl) => set({
        activeMediaId: mediaId,
        activeVideoUrl: videoUrl,
        isEnded: false,
    }),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setMuted: (muted) => set({ isMuted: muted }),
    setEnded: (ended) => set({ isEnded: ended }),

    clearActiveVideo: () => set({
        activePostId: null,
        activeMediaId: null,
        activeVideoUrl: null,
        isEnded: false,
    }),
}));
