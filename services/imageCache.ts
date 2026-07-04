import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { deleteFileIfExists, ensureDirectory, readJsonFileOrNull, resetDirectory, writeJsonFile } from './fileCacheUtils';

// ─── Constants ──────────────────────────────────────────────────────
const CACHE_DIR = new Directory(Paths.cache, 'image-cache');
const MANIFEST_FILE = new File(CACHE_DIR, 'manifest.json');

// Default max cache size: 200 MB
const DEFAULT_MAX_CACHE_BYTES = 200 * 1024 * 1024;

// ─── Types ──────────────────────────────────────────────────────────
interface CacheEntry {
    url: string;
    localUri: string;
    size: number;
    lastAccess: number;
    createdAt: number;
}

interface Manifest {
    entries: Record<string, CacheEntry>;
    totalSize: number;
}

// ─── In-memory state ────────────────────────────────────────────────
let manifest: Manifest | null = null;
let maxCacheBytes = DEFAULT_MAX_CACHE_BYTES;
const inFlightDownloads: Map<string, Promise<string>> = new Map();

// ─── Helpers ────────────────────────────────────────────────────────

const hashUrl = async (url: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        url
    );
    return digest.substring(0, 16);
};

const getExtension = (url: string): string => {
    try {
        const pathname = new URL(url).pathname;
        const ext = pathname.substring(pathname.lastIndexOf('.'));
        if (ext && ext.length <= 6 && ext.length > 1) return ext;
    } catch { }
    return '.jpg';
};

const ensureCacheDir = async () => {
    ensureDirectory(CACHE_DIR);
};

// ─── Manifest Management ────────────────────────────────────────────

const loadManifest = async (): Promise<Manifest> => {
    if (manifest) return manifest;

    try {
        const savedManifest = await readJsonFileOrNull<Manifest>(MANIFEST_FILE);
        if (savedManifest) {
            manifest = savedManifest;
            return manifest;
        }
    } catch (e) {
        console.warn('[ImageCache] Failed to load manifest:', e);
    }

    manifest = { entries: {}, totalSize: 0 };
    return manifest;
};

const saveManifest = async () => {
    if (!manifest) return;
    try {
        await ensureCacheDir();
        writeJsonFile(MANIFEST_FILE, manifest);
    } catch (e) {
        console.warn('[ImageCache] Failed to save manifest:', e);
    }
};

// ─── Eviction (LRU) ────────────────────────────────────────────────

const evictIfNeeded = async (reserveBytes: number = 0) => {
    const m = await loadManifest();
    const targetSize = maxCacheBytes - reserveBytes;

    if (m.totalSize <= targetSize) return;

    const sorted = Object.entries(m.entries).sort(
        ([, a], [, b]) => a.lastAccess - b.lastAccess
    );

    for (const [hash, entry] of sorted) {
        if (m.totalSize <= targetSize) break;

        try {
            deleteFileIfExists(entry.localUri);
        } catch { }

        m.totalSize -= entry.size;
        delete m.entries[hash];
    }

    await saveManifest();
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Get a cached local URI for the given image URL.
 * If not cached, returns the original URL.
 */
export const getCachedImageUri = async (url: string): Promise<string> => {
    try {
        const m = await loadManifest();
        const hash = await hashUrl(url);
        const entry = m.entries[hash];

        if (entry) {
            const file = new File(entry.localUri);
            if (file.exists) {
                entry.lastAccess = Date.now();
                saveManifest();
                return entry.localUri;
            } else {
                m.totalSize -= entry.size;
                delete m.entries[hash];
                saveManifest();
            }
        }
    } catch (e) {
        console.warn('[ImageCache] getCachedImageUri error:', e);
    }

    return url;
};

/**
 * Download and cache an image. Returns the local URI once downloaded,
 * or the original URL on failure. Deduplicates concurrent downloads.
 */
export const cacheImage = async (url: string): Promise<string> => {
    const hash = await hashUrl(url);

    // Check if already cached
    const m = await loadManifest();
    const existing = m.entries[hash];
    if (existing) {
        const existingFile = new File(existing.localUri);
        if (existingFile.exists) {
            existing.lastAccess = Date.now();
            saveManifest();
            return existing.localUri;
        }
    }

    // Deduplicate in-flight downloads
    const inflight = inFlightDownloads.get(hash);
    if (inflight) return inflight;

    const downloadPromise = (async () => {
        try {
            await ensureCacheDir();
            const ext = getExtension(url);
            const localFile = new File(CACHE_DIR, `${hash}${ext}`);
            const localUri = localFile.uri;

            await evictIfNeeded(5 * 1024 * 1024);

            await File.downloadFileAsync(url, localFile);
            const fileSize = localFile.size || 0;

            const entry: CacheEntry = {
                url,
                localUri,
                size: fileSize,
                lastAccess: Date.now(),
                createdAt: Date.now(),
            };

            const m = await loadManifest();
            m.entries[hash] = entry;
            m.totalSize += fileSize;
            await saveManifest();
            await evictIfNeeded();

            return localUri;
        } catch (e) {
            console.warn('[ImageCache] Download failed for:', url, e);
            return url;
        } finally {
            inFlightDownloads.delete(hash);
        }
    })();

    inFlightDownloads.set(hash, downloadPromise);
    return downloadPromise;
};

/**
 * Pre-cache multiple image URLs in background (fire-and-forget).
 */
export const precacheImages = (urls: string[]) => {
    for (const url of urls) {
        cacheImage(url).catch(() => { });
    }
};

/**
 * Clear the entire image cache.
 */
export const clearImageCache = async () => {
    try {
        resetDirectory(CACHE_DIR);
        manifest = { entries: {}, totalSize: 0 };
        await saveManifest();
    } catch (e) {
        console.warn('[ImageCache] Failed to clear cache:', e);
    }
};

/**
 * Set the maximum cache size in bytes.
 */
export const setMaxImageCacheSize = async (bytes: number) => {
    maxCacheBytes = bytes;
    await evictIfNeeded();
};

/**
 * Get the current total cache size in bytes.
 */
export const getImageCacheSize = async (): Promise<number> => {
    const m = await loadManifest();
    return m.totalSize;
};
