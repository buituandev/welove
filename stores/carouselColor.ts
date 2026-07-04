import ImageColors from 'react-native-image-colors';
import { create } from 'zustand';
import { carouselColorStorage as storage } from '../services/storage';



// Cache key prefix
const LUMINANCE_CACHE_PREFIX = 'luminance:';

interface CarouselColorStore {
    // The current overlay color - either 'light' (#FFFFFF) or 'dark' (#000000)
    overlayColor: string;
    // Whether we're using carousel-based color (vs theme color)
    isUsingCarouselColor: boolean;
    // The current image URL being processed
    currentImageUrl: string | null;
    // Actions
    setOverlayColor: (color: string) => void;
    setIsUsingCarouselColor: (value: boolean) => void;
    analyzeImageLuminance: (imageUrl: string) => Promise<void>;
    resetToThemeColor: () => void;
}

/**
 * Calculate relative luminance from RGB values
 * Using the formula from WCAG 2.0
 * @returns luminance value between 0 (dark) and 1 (light)
 */
const calculateLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const sRGB = c / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Parse hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};

/**
 * Determine if we should use white or black text based on background luminance
 * @param luminance - luminance value between 0 and 1
 * @returns 'light' for white text or 'dark' for black text
 */
const getContrastColor = (luminance: number): string => {
    // If background is dark (luminance < 0.5), use white text
    // If background is light (luminance >= 0.5), use black text
    return luminance < 0.5 ? '#FFFFFF' : '#000000';
};

export const useCarouselColorStore = create<CarouselColorStore>((set, get) => ({
    overlayColor: '#FFFFFF',
    isUsingCarouselColor: false,
    currentImageUrl: null,

    setOverlayColor: (color) => set({ overlayColor: color }),

    setIsUsingCarouselColor: (value) => set({ isUsingCarouselColor: value }),

    analyzeImageLuminance: async (imageUrl: string) => {
        if (!imageUrl) return;

        // Check if we have cached result
        const cacheKey = LUMINANCE_CACHE_PREFIX + imageUrl;
        const cachedColor = storage.getString(cacheKey);

        if (cachedColor) {
            set({
                overlayColor: cachedColor,
                currentImageUrl: imageUrl,
                isUsingCarouselColor: true
            });
            return;
        }

        try {
            const allKeys = storage.getAllKeys();
            const luminanceKeys = allKeys.filter(k => k.startsWith(LUMINANCE_CACHE_PREFIX));
            if (luminanceKeys.length > 100) {
                luminanceKeys.slice(0, 30).forEach(key => storage.remove(key));
            }
        } catch (e) {
            console.warn('Failed to prune luminance cache keys:', e);
        }

        try {
            // Analyze image colors
            const result = await ImageColors.getColors(imageUrl, {
                fallback: '#CCCCCC',
                cache: true,
                key: imageUrl,
            });

            if (result.platform === 'android' || result.platform === 'ios') {
                // Get dominant or average color
                const dominantColor = result.platform === 'android'
                    ? result.dominant
                    : result.background;

                if (dominantColor) {
                    const rgb = hexToRgb(dominantColor);
                    if (rgb) {
                        const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
                        const contrastColor = getContrastColor(luminance);

                        // Cache the result
                        storage.set(cacheKey, contrastColor);

                        set({
                            overlayColor: contrastColor,
                            currentImageUrl: imageUrl,
                            isUsingCarouselColor: true
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to analyze image colors:', error);
            // Fallback to white
            set({
                overlayColor: '#FFFFFF',
                currentImageUrl: imageUrl,
                isUsingCarouselColor: true
            });
        }
    },

    resetToThemeColor: () => {
        set({ isUsingCarouselColor: false });
    },
}));
