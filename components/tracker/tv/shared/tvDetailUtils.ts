// ─── MMKV cache ────────────────────────────────────────────
export { tvDetailStorage } from '../../../../services/storage';
export const DARK_DOMINANT_CACHE_PREFIX = "tv:darkDominant:";

// ─── Image URL ────────────────────────────────────────────────────────────────
export const getImageUrl = (path: string | null | undefined, size: number = 500) => {
    if (!path) return `https://via.placeholder.com/${size}x750?text=No+Image`;
    return `https://image.tmdb.org/t/p/w${size}${path}`;
};

// ─── Colour helpers ───────────────────────────────────────────────────────────
export const withAlpha = (hex: string, alphaHex: string): string => {
    if (typeof hex !== "string") return hex as unknown as string;
    if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) return hex.slice(0, 7) + alphaHex;
    return hex;
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : null;
};

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export const darkenHex = (hex: string, amount: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const a = Math.max(0, Math.min(1, amount));
    return `#${clamp255(rgb.r * (1 - a)).toString(16).padStart(2, "0")}${clamp255(rgb.g * (1 - a)).toString(16).padStart(2, "0")}${clamp255(rgb.b * (1 - a)).toString(16).padStart(2, "0")}`;
};
