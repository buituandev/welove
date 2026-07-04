import { movieTrackerStorage as mmkv } from '../services/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Which tracker backend to use:
 *   - 'shows'  → WeLove TV (services/shows)
 *   - 'moviedb' → TMDB + Trakt integration (services/moviedb)
 */
export type TrackerSource = 'shows' | 'moviedb';

interface MovieTrackerSettingsState {
    /** The active tracker source */
    trackerSource: TrackerSource;
    setTrackerSource: (source: TrackerSource) => void;
    /** Resets in-memory + persisted state — call on logout */
    reset: () => void;
}

// ─── MMKV Storage ─────────────────────────────────────────────────────────────



const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string): void => mmkv.set(name, value),
    removeItem: (name: string): boolean => mmkv.remove(name),
}));

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMovieTrackerStore = create<MovieTrackerSettingsState>()(
    persist(
        (set) => ({
            trackerSource: 'moviedb',
            setTrackerSource: (source) => set({ trackerSource: source }),
            reset: () => set({ trackerSource: 'moviedb' }),
        }),
        {
            name: 'movie-tracker-settings',
            storage: mmkvStorage,
        }
    )
);
