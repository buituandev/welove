import { searchHistoryStorage as mmkv } from '../services/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocalProfile {
    id: string;
    name: string;
    avatar_url: string | null;
    username: string | null;
    is_verified: boolean;
    gender: string | null;
}

interface SearchHistoryState {
    clickCounts: Record<string, number>;
    profileCache: Record<string, LocalProfile>;
    recordProfileClick: (profile: LocalProfile) => void;
    updateProfilesBatch: (profiles: LocalProfile[]) => void;
    clearHistory: () => void;
}

// ─── MMKV Storage ────────────────────────────────────────────────────────────



const mmkvZustandStorage = createJSONStorage(() => ({
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string): void => mmkv.set(name, value),
    removeItem: (name: string): boolean => mmkv.remove(name),
}));

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSearchHistoryStore = create<SearchHistoryState>()(
    persist(
        (set) => ({
            clickCounts: {},
            profileCache: {},

            recordProfileClick: (profile) =>
                set((state) => ({
                    clickCounts: {
                        ...state.clickCounts,
                        [profile.id]: (state.clickCounts[profile.id] ?? 0) + 1,
                    },
                    profileCache: {
                        ...state.profileCache,
                        [profile.id]: profile,
                    },
                })),

            // Silently refresh cached profile info (name/avatar may have changed).
            // Only updates profiles that already exist in the cache.
            updateProfilesBatch: (profiles) =>
                set((state) => {
                    const updates: Record<string, LocalProfile> = {};
                    for (const p of profiles) {
                        if (state.profileCache[p.id] !== undefined) {
                            updates[p.id] = p;
                        }
                    }
                    if (Object.keys(updates).length === 0) return state;
                    return { profileCache: { ...state.profileCache, ...updates } };
                }),

            clearHistory: () => set({ clickCounts: {}, profileCache: {} }),
        }),
        {
            name: 'search-history',
            storage: mmkvZustandStorage,
        }
    )
);
