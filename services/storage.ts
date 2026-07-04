/**
 * Centralized MMKV storage — ONE instance for the whole app.
 *
 * Pattern: a single `storage` instance with namespaced key prefixes.
 * This means `storage.clearAll()` in `signOut()` wipes every piece of
 * user-specific data in one call.
 *
 * The ONLY exception is `languageStorage` — the user's language choice
 * should survive a logout/login cycle.
 *
 * All named re-exports below are the same object as `storage`.
 * They exist purely for readability at the call-site; consumers can
 * also just import `storage` directly.
 *
 * ⚠️  Because everything shares one MMKV file, every key must be unique
 *     across the entire app. Key prefix conventions:
 *
 *  Consumer                     | Prefix
 *  -----------------------------|--------------------------------
 *  react-query offline cache    | REACT_QUERY_OFFLINE_CACHE
 *  onboarding                   | onboarding_*
 *  profile mesh gradient colors | mesh_colors_*
 *  weather service              | weather:*
 *  localfb cache                | localfb_* / localfb_url_*
 *  search history (zustand)     | search-history
 *  search query text history    | search-query-history:*
 *  show watchlist (zustand)     | show-watchlist
 *  movie tracker (zustand)      | movie-tracker-settings
 *  carousel luminance cache     | luminance:*
 *  video resume positions       | video-resume:*
 *  TV detail dominant color     | tv:darkDominant:*
 *  movie detail dominant color  | movie:darkDominant:*
 *  person detail dominant color | person:darkDominant:*
 *  show detail dominant color   | show:darkDominant:*
 *  gallery image dimensions     | dimension:v1:*
 *  settings (zustand)           | settings-storage
 *  fb music auth session        | fb_auth:*
 */

import { createMMKV } from "react-native-mmkv";

// ─── The single app-wide storage instance ─────────────────────────────────────
export const storage = createMMKV();

// ─── Language preference — persists across logout ─────────────────────────────
export const languageStorage = createMMKV({ id: "language-storage" });

// ─── Named aliases (same object — for readable imports at call-sites) ─────────
export const onboardingStorage = storage;
export const weatherStorage = storage;
export const localFbStorage = storage;
export const searchHistoryStorage = storage;
export const movieTrackerStorage = storage;
export const carouselColorStorage = storage;
export const videoResumeStorage = storage;
export const tvDetailStorage = storage;
export const personDetailStorage = storage;
export const movieDetailStorage = storage;
export const imageDimensionStorage = storage;
export const settingsStorage = storage;

