import { create } from 'zustand';

interface ScrollState {
    triggers: Record<string, number>;
    triggerScrollToTop: (screenName: string) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
    triggers: {},
    triggerScrollToTop: (screenName) =>
        set((state) => ({
            triggers: {
                ...state.triggers,
                [screenName]: (state.triggers[screenName] || 0) + 1,
            },
        })),
}));
