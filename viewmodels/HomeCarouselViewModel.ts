import { useCarouselQuery } from "@/services/carousel";
import { useCarouselColorStore } from "@/stores/carouselColor";
import { Directory, File, Paths } from 'expo-file-system';
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, useWindowDimensions } from "react-native";

const AUTO_SCROLL_INTERVAL = 30000;
const CAROUSEL_CACHE_DIR = new Directory(Paths.cache, 'carousel-images');

export const useHomeCarouselViewModel = (animatedVisibility?: Animated.Value) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const carouselHeight = screenHeight * 0.28;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localCache, setLocalCache] = useState<Record<string, string>>({});
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { data: carouselData = [] } = useCarouselQuery();

    const analyzeImageLuminance = useCarouselColorStore(state => state.analyzeImageLuminance);

    const activeCarouselData = useMemo(
        () => carouselData.filter(item => item.is_active),
        [carouselData]
    );

    const currentImageUrl = activeCarouselData[currentIndex]?.image_url;
    const currentLocalImageUrl = currentImageUrl ? (localCache[currentImageUrl] || currentImageUrl) : undefined;

    useEffect(() => {
        let isMounted = true;

        const cacheImages = async () => {
            for (const item of activeCarouselData) {
                const url = item.image_url;

                if (!url) continue;

                try {
                    CAROUSEL_CACHE_DIR.create({ idempotent: true, intermediates: true });
                    const safeFilename = url.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
                    const localFile = new File(CAROUSEL_CACHE_DIR, safeFilename);
                    const fileUri = localFile.uri;

                    if (localFile.exists) {
                        if (isMounted) {
                            setLocalCache(prev => prev[url] ? prev : { ...prev, [url]: fileUri });
                        }
                    } else {
                        await File.downloadFileAsync(url, localFile);
                        if (localFile.exists && isMounted) {
                            setLocalCache(prev => prev[url] ? prev : { ...prev, [url]: localFile.uri });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to cache image ${url}:`, error);
                }
            }
        };

        if (activeCarouselData.length > 0) {
            cacheImages();
        }

        return () => {
            isMounted = false;
        };
    }, [activeCarouselData]);

    // analyzeImageLuminance is intentionally NOT called here.
    // It is called by HomeCarousel once Skia confirms the image is rendered,
    // so the text color change is always in sync with the image appearing.

    const remainingIndicesRef = useRef<number[]>([]);
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        remainingIndicesRef.current = _.range(activeCarouselData.length);
        if (currentIndexRef.current >= activeCarouselData.length) {
            setCurrentIndex(0);
        }
    }, [activeCarouselData.length]);

    const getNextRandomIndex = useCallback(() => {
        if (activeCarouselData.length <= 1) return 0;

        if (remainingIndicesRef.current.length === 0) {
            remainingIndicesRef.current = _.range(activeCarouselData.length);
        }

        const indicesToUse = _.without(remainingIndicesRef.current, currentIndexRef.current);
        const finalIndices = indicesToUse.length > 0 ? indicesToUse : remainingIndicesRef.current;

        const nextIndex = _.sample(finalIndices) ?? 0;
        _.pull(remainingIndicesRef.current, nextIndex);

        return nextIndex;
    }, [activeCarouselData.length]);

    const getNextRandomIndexRef = useRef(getNextRandomIndex);

    useEffect(() => {
        getNextRandomIndexRef.current = getNextRandomIndex;
    }, [getNextRandomIndex]);

    const isVisibleRef = useRef(true);

    useEffect(() => {
        if (activeCarouselData.length <= 1) return;

        const startAutoScroll = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(() => {
                setCurrentIndex(getNextRandomIndexRef.current());
            }, AUTO_SCROLL_INTERVAL);
        };

        const stopAutoScroll = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        startAutoScroll();

        let listenerId: string | undefined;
        if (animatedVisibility) {
            listenerId = animatedVisibility.addListener(({ value }) => {
                const shouldBeVisible = value > 0.5;
                if (isVisibleRef.current !== shouldBeVisible) {
                    isVisibleRef.current = shouldBeVisible;
                    if (shouldBeVisible) {
                        startAutoScroll();
                    } else {
                        stopAutoScroll();
                    }
                }
            });
        }

        return () => {
            stopAutoScroll();
            if (listenerId && animatedVisibility) {
                animatedVisibility.removeListener(listenerId);
            }
        };
    }, [activeCarouselData.length, animatedVisibility]);

    return {
        currentIndex,
        currentImageUrl,
        currentLocalImageUrl, // <- Pass this to Skia
        cachedImagesMap: localCache, // <- Pass this if rendering a list of items
        activeCarouselData,
        analyzeImageLuminance,
        SCREEN_WIDTH: screenWidth,
        CAROUSEL_HEIGHT: carouselHeight,
    };
};