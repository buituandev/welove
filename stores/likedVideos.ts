/**
 * likedVideos.ts
 *
 * Persists the list of videos the user has liked.
 * Used by the recommendation engine as a strong positive signal.
 *
 * Key prefix: liked-videos
 */

import { storage } from '@/services/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LikedVideo {
  video_url: string;
  title: string;
  thumb_url: string;
  duration: string;
  liked_at: number;
}

interface LikedVideosState {
  likedVideos: LikedVideo[];
  addLike: (video: LikedVideo) => void;
  removeLike: (video_url: string) => void;
  isLiked: (video_url: string) => boolean;
  clear: () => void;
}

const mmkvZustandStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => storage.set(name, value),
  removeItem: (name: string): boolean => storage.remove(name),
}));

export const useLikedVideosStore = create<LikedVideosState>()(
  persist(
    (set, get) => ({
      likedVideos: [],

      addLike: (video) =>
        set((state) => ({
          likedVideos: [
            { ...video, liked_at: Date.now() },
            ...state.likedVideos.filter((v) => v.video_url !== video.video_url),
          ],
        })),

      removeLike: (video_url) =>
        set((state) => ({
          likedVideos: state.likedVideos.filter((v) => v.video_url !== video_url),
        })),

      isLiked: (video_url) =>
        get().likedVideos.some((v) => v.video_url === video_url),

      clear: () => set({ likedVideos: [] }),
    }),
    {
      name: 'liked-videos',
      storage: mmkvZustandStorage,
    }
  )
);
