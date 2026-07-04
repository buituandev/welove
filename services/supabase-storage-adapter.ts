/**
 * MMKV storage adapter for Supabase auth.
 *
 * Supabase's `auth.storage` option expects an object that satisfies
 * `SupportedStorage` — an async key/value interface identical to the
 * AsyncStorage API.  We wrap the synchronous MMKV calls in Promises so
 * the interface is satisfied while keeping I/O on the native thread
 * (no JS<>bridge round-trips like AsyncStorage).
 *
 * Keys written by Supabase follow the pattern:
 *   sb-<project-ref>-auth-token
 * They are stored in the shared `storage` instance under that exact key,
 * so `storage.clearAll()` in `signOut()` continues to wipe them along with
 * everything else.
 */

import { storage } from "./storage";

export const mmkvSupabaseAdapter = {
    getItem: (key: string): Promise<string | null> => {
        return Promise.resolve(storage.getString(key) ?? null);
    },
    setItem: (key: string, value: string): Promise<void> => {
        storage.set(key, value);
        return Promise.resolve();
    },
    removeItem: (key: string): Promise<void> => {
        storage.remove(key);
        return Promise.resolve();
    },
};
