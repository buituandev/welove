/**
 * searchQueryHistory — persists the last N text search queries per namespace.
 *
 * Key convention (single shared MMKV instance):
 *   search-query-history:<namespace>
 *
 * Namespaces used in the app:
 *   - "movies"  → SearchMovies screen
 *   - "shows"   → SearchShows screen
 *   - "people"  → Search (profile) screen
 */

import { searchHistoryStorage as mmkv } from '../services/storage';

const MAX_HISTORY = 3;
const KEY_PREFIX = 'search-query-history:';

function getKey(namespace: string) {
  return `${KEY_PREFIX}${namespace}`;
}

/** Returns the stored recent queries for a namespace (newest first). */
export function getSearchQueryHistory(namespace: string): string[] {
  try {
    const raw = mmkv.getString(getKey(namespace));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Prepends `query` to the history for `namespace`, deduplicates, and caps at
 * MAX_HISTORY entries. Persists to MMKV immediately.
 */
export function addSearchQueryToHistory(namespace: string, query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;

  const existing = getSearchQueryHistory(namespace);
  // Deduplicate — remove any prior occurrence of the same query.
  const deduped = existing.filter(
    (q) => q.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...deduped].slice(0, MAX_HISTORY);
  mmkv.set(getKey(namespace), JSON.stringify(next));
}

/** Removes a specific query from the history of `namespace`. */
export function removeSearchQueryFromHistory(
  namespace: string,
  query: string,
): void {
  const existing = getSearchQueryHistory(namespace);
  const next = existing.filter((q) => q !== query);
  mmkv.set(getKey(namespace), JSON.stringify(next));
}

/** Clears all history for `namespace`. */
export function clearSearchQueryHistory(namespace: string): void {
  mmkv.remove(getKey(namespace));
}
