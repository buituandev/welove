import { create } from 'zustand';

// A single-instance YouTube playback coordinator.
//
// At most one `PlayerView` is ever mounted across the app. Consumers build a
// unique key (typically `${postId}:${index}`) and call `setActive(key)` when
// the user taps a thumbnail. Any previously active player unmounts
// automatically because only the component whose key matches `activeKey`
// renders the real `PlayerView`.

interface ActiveYouTubeStore {
    activeKey: string | null;
    setActive: (key: string | null) => void;
    clear: () => void;
}

export const useActiveYouTubeStore = create<ActiveYouTubeStore>((set) => ({
    activeKey: null,
    setActive: (key) => set({ activeKey: key }),
    clear: () => set({ activeKey: null }),
}));
