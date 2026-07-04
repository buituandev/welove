/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */
import { useThemeContext } from "@/context/ThemeContext";
import {
    useTvDetails,
    useTvImages,
    useTvRecommendationsInfinite,
    useTvReviewsInfinite,
    useTvSeasonDetails,
    useTvSimilarInfinite,
    useTvWatchProviders,
} from "@/hooks/useMovies";
import { useGalleryStore } from "@/stores/gallery";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useImage } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getColors } from "react-native-image-colors";
import {
    DARK_DOMINANT_CACHE_PREFIX,
    darkenHex,
    getImageUrl,
    tvDetailStorage,
} from "./shared/tvDetailUtils";

export function useTvDetailViewModel(tvId: number, isReady: boolean) {
    'use no memo';
    const { colors } = useThemeContext();

    // ─── Remote data ─────────────────────────────────────────────────────────
    const { data: tv, isLoading, isError } = useTvDetails(tvId);
    const { data: images } = useTvImages(isReady ? tvId : undefined);
    const { data: similarData } = useTvSimilarInfinite(isReady ? tvId : undefined);
    const { data: recData } = useTvRecommendationsInfinite(isReady ? tvId : undefined);
    const {
        data: reviewsData,
        fetchNextPage: fetchNextReviews,
        isFetchingNextPage: isFetchingReviews,
    } = useTvReviewsInfinite(isReady ? tvId : undefined);
    const { data: watchProvidersData } = useTvWatchProviders(isReady ? tvId : undefined);

    // ─── Season / episode state ───────────────────────────────────────────────
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number | null>(null);
    const [episodesVisible, setEpisodesVisible] = useState(true);
    const [showWallpaper, setShowWallpaper] = useState(false);
    const [urlWallpaper, setUrlWallpaper] = useState("");

    const { data: seasonData, isLoading: isSeasonLoading } = useTvSeasonDetails(isReady ? tvId : undefined, selectedSeasonNumber);
    const episodes = useMemo(() => seasonData?.episodes ?? [], [seasonData?.episodes]);

    // Initialize to the first real (non-specials) season
    useEffect(() => {
        if (tv?.seasons?.length) {
            const firstReal = tv.seasons.find((s: any) => s.season_number > 0);
            setSelectedSeasonNumber(firstReal ? firstReal.season_number : tv.seasons[0].season_number);
        }
    }, [tv?.seasons]);

    const handleSelectSeason = useCallback((num: number) => {
        setSelectedSeasonNumber(num);
        setSeasonDropdownOpen(false);
    }, []);

    const toggleSeasonDropdown = useCallback(() => setSeasonDropdownOpen((o) => !o), []);
    const toggleEpisodesVisible = useCallback(() => setEpisodesVisible((v) => !v), []);

    // ─── Skia image ───────────────────────────────────────────────────────────
    const posterUrl = tv ? getImageUrl(tv.poster_path, 780) : null;
    const skiaImage = useImage(posterUrl ?? "");

    // ─── Sheet refs ───────────────────────────────────────────────────────────
    const reviewsSheetRef = useRef<TrueSheet>(null);
    const episodeSheetRef = useRef<TrueSheet>(null);

    const openReviewsSheet = useCallback(() => reviewsSheetRef.current?.present(), []);
    const handleOpenEpisode = useCallback((episodeNumber: number) => {
        setSelectedEpisodeNumber(episodeNumber);
        setTimeout(() => episodeSheetRef.current?.present(), 50);
    }, []);

    // ─── Gallery store ────────────────────────────────────────────────────────
    const openGallery = useGalleryStore((s) => s.openGallery);

    const galleryImages = useMemo(() => {
        const backdrops = images?.backdrops ?? [];
        return backdrops.map((img: any) => ({
            uri: getImageUrl(img.file_path, 1280),
            caption: tv?.name,
        }));
    }, [images?.backdrops, tv?.name]);

    // ─── Derived lists ────────────────────────────────────────────────────────
    const similarItems = useMemo<any[]>(
        () => similarData?.pages[0]?.results?.slice(0, 10) ?? [],
        [similarData],
    );
    const recItems = useMemo<any[]>(
        () => recData?.pages[0]?.results?.slice(0, 10) ?? [],
        [recData],
    );
    const cast = useMemo(() => tv?.credits?.cast ?? [], [tv?.credits?.cast]);
    const videos = useMemo(() => tv?.videos?.results ?? [], [tv?.videos?.results]);
    const reviews = useMemo(
        () => reviewsData?.pages.flatMap((p) => p.results) ?? [],
        [reviewsData],
    );

    const watchProviders = useMemo(() => {
        if (!watchProvidersData?.results) return null;
        return (watchProvidersData.results["US"] ??
            Object.values(watchProvidersData.results)[0]) as any;
    }, [watchProvidersData]);

    const contentRating = useMemo(() => {
        if (!tv?.content_ratings?.results) return null;
        const usRating = tv.content_ratings.results.find((r: any) => r.iso_3166_1 === "US");
        return usRating?.rating ?? tv.content_ratings.results[0]?.rating ?? null;
    }, [tv?.content_ratings]);

    // ─── Dominant colour (cached via MMKV) ───────────────────────────────────
    const fallbackBase = useMemo(() => {
        const c = colors.background;
        return typeof c === "string" && c.startsWith("#") && c.length >= 7
            ? c.slice(0, 7)
            : "#000000";
    }, [colors.background]);

    const [darkDominant, setDarkDominant] = useState<string>(darkenHex(fallbackBase, 0.55));

    useEffect(() => {
        if (!posterUrl) return;
        let cancelled = false;
        const run = async () => {
            try {
                const cacheKey = `${DARK_DOMINANT_CACHE_PREFIX}${posterUrl}:${fallbackBase}`;
                const cached = tvDetailStorage.getString(cacheKey);
                if (cached) {
                    if (!cancelled) setDarkDominant(cached);
                    return;
                }
                const result = await getColors(posterUrl, { fallback: fallbackBase, cache: true, key: posterUrl });
                let dominant: string | null = null;
                if (result.platform === "android") dominant = result.dominant ?? result.average ?? null;
                if (result.platform === "ios") dominant = result.background ?? result.primary ?? null;
                const hex = dominant
                    ? dominant.startsWith("#") ? dominant : `#${dominant}`
                    : fallbackBase;
                const darker = darkenHex(hex, 0.55);
                tvDetailStorage.set(cacheKey, darker);
                if (!cancelled) setDarkDominant(darker);
            } catch {
                if (!cancelled) setDarkDominant(darkenHex(fallbackBase, 0.55));
            }
        };
        run();
        return () => { cancelled = true; };
    }, [posterUrl, fallbackBase]);

    // ─── Convenience derived values ───────────────────────────────────────────
    const firstAirYear = tv?.first_air_date
        ? new Date(tv.first_air_date).getFullYear().toString()
        : "—";
    const runtime =
        tv?.episode_run_time?.length ? `${tv.episode_run_time[0]}m` : "—";
    const backdrops = images?.backdrops ?? [];
    const logos = images?.logos ?? [];
    const seasons = tv?.seasons ?? [];

    return {
        // state
        tv,
        isLoading,
        isError,
        skiaImage,
        darkDominant,
        showWallpaper,
        urlWallpaper,
        setShowWallpaper,
        setUrlWallpaper,
        posterUrl,
        // season / episode
        seasons,
        selectedSeasonNumber,
        seasonDropdownOpen,
        handleSelectSeason,
        toggleSeasonDropdown,
        episodesVisible,
        toggleEpisodesVisible,
        seasonData,
        isSeasonLoading,
        episodes,
        selectedEpisodeNumber,
        handleOpenEpisode,
        // gallery
        openGallery,
        galleryImages,
        backdrops,
        logos,
        // media
        cast,
        videos,
        similarItems,
        recItems,
        reviews,
        fetchNextReviews,
        isFetchingReviews,
        watchProviders,
        contentRating,
        // derived
        firstAirYear,
        runtime,
        // refs / actions
        reviewsSheetRef,
        episodeSheetRef,
        openReviewsSheet,
    };
}
