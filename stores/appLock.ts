import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../services/storage';

interface AppLockStore {
    isLocked: boolean;
    appLockEnabled: boolean;
    appLockPin: string; // 6-digit PIN
    biometricsEnabled: boolean;
    lastBackgroundTime: number; // timestamp in ms

    setLocked: (locked: boolean) => void;
    setAppLockEnabled: (enabled: boolean) => void;
    setAppLockPin: (pin: string) => void;
    setBiometricsEnabled: (enabled: boolean) => void;
    setLastBackgroundTime: (time: number) => void;
    reset: () => void;
}

const mmkvZustandStorage = createJSONStorage(() => ({
    getItem: (name: string): string | null => storage.getString(name) ?? null,
    setItem: (name: string, value: string): void => storage.set(name, value),
    removeItem: (name: string): boolean => storage.remove(name),
}));

export const useAppLockStore = create<AppLockStore>()(
    persist(
        (set, get) => ({
            // Initialize isLocked as true on fresh launch if app lock is enabled
            isLocked: storage.getBoolean('app_lock_enabled_persisted') ?? false,
            appLockEnabled: false,
            appLockPin: '',
            biometricsEnabled: false,
            lastBackgroundTime: 0,

            setLocked: (locked) => set({ isLocked: locked }),
            setAppLockEnabled: (enabled) => {
                storage.set('app_lock_enabled_persisted', enabled);
                set({ appLockEnabled: enabled });
                if (!enabled) {
                    set({ isLocked: false });
                }
            },
            setAppLockPin: (pin) => set({ appLockPin: pin }),
            setBiometricsEnabled: (enabled) => set({ biometricsEnabled: enabled }),
            setLastBackgroundTime: (time) => set({ lastBackgroundTime: time }),
            reset: () => {
                storage.remove('app_lock_enabled_persisted');
                set({
                    isLocked: false,
                    appLockEnabled: false,
                    appLockPin: '',
                    biometricsEnabled: false,
                    lastBackgroundTime: 0,
                });
            },
        }),
        {
            name: 'app-lock-storage',
            storage: mmkvZustandStorage,
            // Only persist configurations, not volatile states like isLocked
            partialize: (state) => ({
                appLockEnabled: state.appLockEnabled,
                appLockPin: state.appLockPin,
                biometricsEnabled: state.biometricsEnabled,
                lastBackgroundTime: state.lastBackgroundTime,
            }),
        }
    )
);
