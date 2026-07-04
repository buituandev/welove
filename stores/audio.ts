import { create } from 'zustand';

interface AudioMetadata {
    title?: string;
    artist?: string;
    coverUrl?: string;
}

interface AudioStore {
    currentlyPlayingId: string | null;
    setCurrentlyPlayingId: (id: string | null) => void;
    currentAudioUrl: string | null;
    setCurrentAudioUrl: (url: string | null) => void;
    metadata: AudioMetadata | null;
    setMetadata: (metadata: AudioMetadata | null) => void;

    // Playback progress (updated by GlobalAudioPlayer)
    currentTime: number;   // seconds
    duration: number;      // seconds
    setPlaybackStatus: (currentTime: number, duration: number) => void;

    // Convenience action: play a track
    playTrack: (id: string, url: string, metadata?: AudioMetadata) => void;
    // Convenience action: stop current playback
    stopPlayback: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
    currentlyPlayingId: null,
    setCurrentlyPlayingId: (id) => set({ currentlyPlayingId: id }),
    currentAudioUrl: null,
    setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
    metadata: null,
    setMetadata: (metadata) => set({ metadata }),

    currentTime: 0,
    duration: 0,
    setPlaybackStatus: (currentTime, duration) => set({ currentTime, duration }),

    playTrack: (id, url, metadata) => set({
        currentlyPlayingId: id,
        currentAudioUrl: url,
        metadata: metadata || null,
        currentTime: 0,
        duration: 0,
    }),

    stopPlayback: () => set({
        currentlyPlayingId: null,
        currentAudioUrl: null,
        metadata: null,
        currentTime: 0,
        duration: 0,
    }),
}));
