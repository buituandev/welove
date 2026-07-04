/**
 * watchHistory.ts
 *
 * Persists the last N videos the user has opened.
 * Used by the recommendation engine to infer user taste from actual watch behaviour.
 *
 * Key prefix: watch-history
 */

import { storage } from '@/services/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WatchedVideo {
  video_url: string;
  title: string;
  thumb_url: string;
  duration: string;
  /** Unix ms timestamp of when the video was opened */
  watched_at: number;
}

interface WatchHistoryState {
  history: WatchedVideo[];
  /**
   * Record that the user has opened a video.
   * Deduplicates (bumps the video to the top on re-watch) and caps at MAX_HISTORY.
   */
  recordWatch: (video: WatchedVideo) => void;
  clear: () => void;
}

const MAX_HISTORY = 30;

const mmkvZustandStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => storage.set(name, value),
  removeItem: (name: string): boolean => storage.remove(name),
}));

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set) => ({
      history: [],

      recordWatch: (video) =>
        set((state) => ({
          history: [
            { ...video, watched_at: Date.now() },
            ...state.history.filter((v) => v.video_url !== video.video_url),
          ].slice(0, MAX_HISTORY),
        })),

      clear: () => set({ history: [] }),
    }),
    {
      name: 'watch-history',
      storage: mmkvZustandStorage,
    }
  )
);
