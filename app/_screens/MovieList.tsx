import { FlexText } from "@/components/FlexText";
import { ShimmerEffect } from "@/components/shimmer/Shimmer";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { EpisodeDetailSheet } from "@/components/tracker/sheets/EpisodeDetailSheet";
import {
    useAiringTodayTVInfinite,
    useMovieRecommendationsInfinite, useMovieSimilarInfinite, useNowPlayingMoviesInfinite,
    useOnTheAirTVInfinite,
    usePopularMoviesInfinite, usePopularPeopleInfinite,
    usePopularTVInfinite,
    useTopRatedMoviesInfinite,
    useTopRatedTVInfinite,
    useTvRecommendationsInfinite,
    useTvSeasonDetails,
    useTvSimilarInfinite,
    useUpcomingMoviesInfinite,
} from "@/hooks/useMovies";
import { Movie } from "@/types/moviedb/movie";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { FlashList } from "@shopify/flash-list";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

type ListMode = "similar" | "recommendations" | "tv_similar" | "tv_recommendations" | "now_playing" | "upcoming" | "popular" | "top_rated" | "popular_people" | "tv_airing_today" | "tv_on_the_air" | "tv_popular" | "tv_top_rated" | "tv_season_episodes";

const getImageUrl = (path: string | null | undefined, size: number = 342) => {
    if (!path) return `https://via.placeholder.com/${size}x513?text=No+Image`;
    return `https://image.tmdb.org/t/p/w${size}${path}`;
};

const MovieListScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    const params = useLocalSearchParams<{ mode: ListMode; movieId: string; title: string; seasonNumber: string }>();
    const mode: ListMode = params.mode || "popular";
    const movieId = params.movieId ? Number(params.movieId) : undefined;
    const seasonNumber = params.seasonNumber ? Number(params.seasonNumber) : undefined;
    const title = params.title ?? "Movies";

    // ─── Episode sheet (for tv_season_episodes mode) ─────────────────────────
    const episodeSheetRef = useRef<TrueSheet>(null);
    const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number | null>(null);
    const handleOpenEpisode = useCallback((epNum: number) => {
        setSelectedEpisodeNumber(epNum);
        setTimeout(() => episodeSheetRef.current?.present(), 50);
    }, []);

    // ─── Season episodes query (non-infinite) ─────────────────────────────────
    const seasonQuery = useTvSeasonDetails(
        mode === "tv_season_episodes" ? movieId : undefined,
        mode === "tv_season_episodes" ? seasonNumber : undefined,
    );

    const similarQuery = useMovieSimilarInfinite(mode === "similar" ? movieId : undefined);
    const recQuery = useMovieRecommendationsInfinite(mode === "recommendations" ? movieId : undefined);
    const tvSimilarQuery = useTvSimilarInfinite(mode === "tv_similar" ? movieId : undefined);
    const tvRecQuery = useTvRecommendationsInfinite(mode === "tv_recommendations" ? movieId : undefined);
    const popQuery = usePopularMoviesInfinite();
    const topQuery = useTopRatedMoviesInfinite();
    const nowQuery = useNowPlayingMoviesInfinite();
    const upcomingQuery = useUpcomingMoviesInfinite();
    const popPeopleQuery = usePopularPeopleInfinite();

    const tvAiringTodayQuery = useAiringTodayTVInfinite();
    const tvOnTheAirQuery = useOnTheAirTVInfinite();
    const tvPopularQuery = usePopularTVInfinite();
    const tvTopRatedQuery = useTopRatedTVInfinite();

    // ─── Episode mode: render separately ─────────────────────────────────────
    const isEpisodeMode = mode === "tv_season_episodes";

    let query: any;
    switch (mode) {
        case "similar": query = similarQuery; break;
        case "recommendations": query = recQuery; break;
        case "tv_similar": query = tvSimilarQuery; break;
        case "tv_recommendations": query = tvRecQuery; break;
        case "popular": query = popQuery; break;
        case "top_rated": query = topQuery; break;
        case "now_playing": query = nowQuery; break;
        case "upcoming": query = upcomingQuery; break;
        case "popular_people": query = popPeopleQuery; break;
        case "tv_airing_today": query = tvAiringTodayQuery; break;
        case "tv_on_the_air": query = tvOnTheAirQuery; break;
        case "tv_popular": query = tvPopularQuery; break;
        case "tv_top_rated": query = tvTopRatedQuery; break;
        default: query = popQuery; break;
    }

    const {
        data,
        isLoading,
        isFetchingNextPage,
        isRefetching,
        isError,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = query;

    const items = useMemo<Movie[]>(
        () => data?.pages.flatMap((p: any) => p.results) ?? [],
        [data],
    );

    let subtitle = "";
    if (mode === "similar") subtitle = `Movies similar to "${title}"`;
    else if (mode === "recommendations") subtitle = `Recommended based on "${title}"`;
    else if (mode === "tv_similar") subtitle = `TV shows similar to "${title}"`;
    else if (mode === "tv_recommendations") subtitle = `TV shows recommended based on "${title}"`;
    else if (mode === "popular") subtitle = "Most popular movies right now";
    else if (mode === "top_rated") subtitle = "Highest rated movies of all time";
    else if (mode === "now_playing") subtitle = "Movies currently in theatres";
    else if (mode === "upcoming") subtitle = "Upcoming movies releasing soon";
    else if (mode === "popular_people") subtitle = "Trending actors and directors";
    else if (mode === "tv_airing_today") subtitle = "TV shows airing today";
    else if (mode === "tv_on_the_air") subtitle = "TV shows currently on the air";
    else if (mode === "tv_popular") subtitle = "Most popular TV shows";
    else if (mode === "tv_top_rated") subtitle = "Highest rated TV shows";
    else if (mode === "tv_season_episodes") subtitle = `Season ${seasonNumber ?? ""} · ${seasonQuery.data?.episodes?.length ?? 0} episodes`;

    const renderItem = useCallback(
        ({ item }: { item: any }) => {
            const isPerson = mode === "popular_people";
            const isTvSeries = mode.startsWith("tv_");
            const title = isPerson ? item.name : isTvSeries ? item.name : item.title;
            const thumbnailPath = isPerson ? item.profile_path : item.poster_path;

            const handlePress = () => {
                if (isPerson) {
                    router.push({ pathname: "/person_detail", params: { id: item.id } });
                } else if (isTvSeries) {
                    router.push({ pathname: "/tv_detail", params: { id: item.id } });
                } else {
                    router.push({ pathname: "/movie_detail", params: { id: item.id } });
                }
            };

            return (
                <Pressable
                    onPress={handlePress}
                    style={({ pressed }) => [
                        styles.row,
                        { backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
                    ]}
                >
                    <ExpoImage
                        source={{ uri: getImageUrl(thumbnailPath) }}
                        style={isPerson ? [styles.thumbnail, { height: 90, width: 90, borderRadius: 9999 }] : styles.thumbnail}
                        contentFit="cover"
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                        <FlexText numberOfLines={2} style={[styles.title, { color: colors.text }]}>
                            {title}
                        </FlexText>
                        <FlexText
                            numberOfLines={1}
                            style={[styles.description, { color: (colors as any).muted ?? "rgba(255,255,255,0.7)" }]}
                        >
                            {isPerson ? item.known_for_department : isTvSeries ? (item.first_air_date ? new Date(item.first_air_date).getFullYear() : "—") : (item.release_date ? new Date(item.release_date).getFullYear() : "—")}
                        </FlexText>
                        {!isPerson && <IMDbBadge score={item.vote_average} />}
                        {!isPerson && item.overview ? (
                            <FlexText
                                numberOfLines={2}
                                style={[styles.description, { color: (colors as any).muted ?? "rgba(255,255,255,0.55)" }]}
                            >
                                {item.overview}
                            </FlexText>
                        ) : null}
                    </View>
                </Pressable>
            );
        },
        [colors, mode],
    );

    // ─── Episode render (tv_season_episodes mode) ─────────────────────────────
    const renderEpisodeItem = useCallback(
        ({ item }: { item: any }) => (
            <Pressable
                onPress={() => handleOpenEpisode(item.episode_number)}
                style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
                ]}
            >
                {/* Thumbnail — landscape 16:9 */}
                <View style={{
                    width: 160,
                    aspectRatio: 16 / 9,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    position: "relative",
                    flexShrink: 0,
                }}>
                    {item.still_path ? (
                        <ExpoImage
                            source={{ uri: `https://image.tmdb.org/t/p/w300${item.still_path}` }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.2)" />
                        </View>
                    )}
                    {/* Episode number badge */}
                    <View style={{ position: "absolute", top: 4, left: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 }}>
                        <FlexText style={{ color: "white", fontSize: 10, fontWeight: "700" }}>E{item.episode_number}</FlexText>
                    </View>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                    <FlexText numberOfLines={2} style={[styles.title, { color: colors.text }]}>
                        {item.name}
                    </FlexText>
                    <FlexText numberOfLines={1} style={[styles.description, { color: (colors as any).muted }]}>
                        {item.air_date ?? ""}{item.runtime ? ` · ${item.runtime}m` : ""}
                    </FlexText>
                    {item.vote_average > 0 && <IMDbBadge score={item.vote_average} />}
                    {item.overview ? (
                        <FlexText numberOfLines={2} style={[styles.description, { color: (colors as any).muted }]}>
                            {item.overview}
                        </FlexText>
                    ) : null}
                </View>
            </Pressable>
        ),
        [colors, handleOpenEpisode],
    );

    const ListHeaderComponent = useCallback(
        () => (
            <View style={{ marginTop: inset.top + 66, paddingHorizontal: 16, marginBottom: 8 }}>
                <FlexText style={[common.heading, { fontSize: 28 }]}>{title}</FlexText>
                <FlexText style={[common.bodySmall, { color: (colors as any).muted, marginTop: 2 }]}>
                    {subtitle}
                </FlexText>
            </View>
        ),
        [inset.top, common, colors, title, subtitle],
    );

    const ListFooterComponent = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
                    {[1, 2, 3, 4, 5].map((key) => (
                        <View key={key} style={[styles.row, { padding: 0 }]}>
                            <ShimmerEffect style={styles.thumbnail} />
                            <View style={{ flex: 1, gap: 8 }}>
                                <ShimmerEffect style={{ height: 16, width: "80%", borderRadius: 4 }} />
                                <ShimmerEffect style={{ height: 12, width: "60%", borderRadius: 4 }} />
                            </View>
                        </View>
                    ))}
                </View>
            );
        }

        if (isError) {
            return (
                <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    <View style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(255,0,0,0.12)" }}>
                        <Text style={{ color: "white", fontWeight: "700" }}>
                            Failed to load. Try going back and retrying.
                        </Text>
                    </View>
                </View>
            );
        }

        if (!hasNextPage) return null;

        return (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                <TouchableOpacity
                    onPress={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    style={[
                        styles.loadMoreButton,
                        { backgroundColor: colors.card, opacity: isFetchingNextPage ? 0.7 : 1 },
                    ]}
                >
                    {isFetchingNextPage ? (
                        <Spinner size="md" color={colors.text} />
                    ) : (
                        <FlexText style={{ color: colors.text, fontWeight: "700" }}>Load more</FlexText>
                    )}
                </TouchableOpacity>
            </View>
        );
    }, [colors, fetchNextPage, hasNextPage, isError, isLoading, isFetchingNextPage]);

    // ─── Episode mode early render ─────────────────────────────────────────────
    if (isEpisodeMode) {
        const episodes: any[] = seasonQuery.data?.episodes ?? [];
        return (
            <View style={common.screen}>
                {/* Floating back */}
                <View style={{ position: "absolute", top: inset.top + 16, left: 16, zIndex: 1000 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ backgroundColor: colors.containerContent, borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <FlashList
                    data={episodes}
                    keyExtractor={(item) => `ep-${item.episode_number}`}
                    ListHeaderComponent={ListHeaderComponent}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: inset.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderEpisodeItem}
                    ListFooterComponent={
                        seasonQuery.isLoading ? (
                            <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
                                {[1, 2, 3, 4, 5].map((key) => (
                                    <View key={key} style={[styles.row, { padding: 0 }]}>
                                        <ShimmerEffect style={styles.thumbnail} />
                                        <View style={{ flex: 1, gap: 8 }}>
                                            <ShimmerEffect style={{ height: 16, width: "80%", borderRadius: 4 }} />
                                            <ShimmerEffect style={{ height: 12, width: "60%", borderRadius: 4 }} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : null
                    }
                />

                {/* Episode Detail Sheet — page-level */}
                {selectedEpisodeNumber !== null && movieId !== undefined && seasonNumber !== undefined && (
                    <EpisodeDetailSheet
                        ref={episodeSheetRef}
                        tvId={movieId}
                        seasonNumber={seasonNumber}
                        episodeNumber={selectedEpisodeNumber}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={common.screen}>
            {/* Floating back button — same style as ShowList */}
            <View style={{ position: "absolute", top: inset.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlashList
                data={items}
                keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : index.toString()}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: inset.bottom + 24 }}
                showsVerticalScrollIndicator={false}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={inset.top}
                    />
                }
            />
        </View>
    );
};

export default MovieListScreen;

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 12,
        gap: 12,
        marginBottom: 12,
    },
    thumbnail: {
        width: 90,
        height: 135, // 2:3 portrait ratio
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
    },
    description: {
        fontSize: 13,
        fontWeight: "400",
    },
    loadMoreButton: {
        borderRadius: 9999,
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: "center",
        alignItems: "center",
    },
});
