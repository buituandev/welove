import DialogIcon from "@/assets/images/svg/chat-double.svg";
import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { ReviewsSheet } from "@/components/tracker/sheets/ReviewsSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useMovieDetails, useMovieImages, useMovieRecommendationsInfinite, useMovieReviewsInfinite, useMovieSimilarInfinite, useMovieWatchProviders } from "@/hooks/useMovies";
import { useGalleryStore } from "@/stores/gallery";
import { CastMember } from "@/types/moviedb";
import { Movie } from "@/types/moviedb/movie";
import { TMDBVideoResult } from "@/types/moviedb/movie-entities";
import { TMDBMovieImage } from "@/types/moviedb/movie-images";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { Canvas, ImageShader, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { Pressable as GesturePressable, Pressable } from "react-native-gesture-handler";
import { getColors } from "react-native-image-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { movieDetailStorage as storage } from "../../services/storage";
import WallpaperOverlay from "../WallpaperOverlay";
import { getBestLogo, getLogoDimensions } from "./logoUtils";

// ─── MMKV cache (same pattern as ShowDetailScreen) ────────────────────────────

const DARK_DOMINANT_CACHE_PREFIX = "movie:darkDominant:";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const withAlpha = (hex: string, alphaHex: string) => {
    if (typeof hex !== "string") return hex as unknown as string;
    if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) return hex.slice(0, 7) + alphaHex;
    return hex;
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const darkenHex = (hex: string, amount: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const a = Math.max(0, Math.min(1, amount));
    return `#${clamp255(rgb.r * (1 - a)).toString(16).padStart(2, "0")}${clamp255(rgb.g * (1 - a)).toString(16).padStart(2, "0")}${clamp255(rgb.b * (1 - a)).toString(16).padStart(2, "0")}`;
};

const getImageUrl = (path: string | null | undefined, size: number = 500) => {
    if (!path) return `https://via.placeholder.com/${size}x750?text=No+Image`;
    return `https://image.tmdb.org/t/p/w${size}${path}`;
};




// ─── Sub-components ───────────────────────────────────────────────────────────

const GenrePill = ({ name }: { name: string }) => (
    <View style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
        backgroundColor: withAlpha("#FFFFFF", "20"),
        borderWidth: 1, borderColor: withAlpha("#FFFFFF", "30"),
    }}>
        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{name}</Text>
    </View>
);

const InfoRow = ({ label, value, isLink = false }: { label: string; value: string, isLink?: boolean }) => (
    <View style={{ gap: 2 }}>
        <Text style={[styles.textStyle, { color: "white" }]}>{label}</Text>
        {isLink ? (
            <Pressable onPress={() => WebBrowser.openBrowserAsync(value)}>
                <Text style={[styles.textStyle, { color: "#007AFF" }]}>{value}</Text>
            </Pressable>
        ) : (
            <Text style={[styles.textStyle, { color: "rgba(255, 255, 255, 0.7)" }]}>{value}</Text>
        )}
    </View>
);

// Section header matching ShowDetailScreen & Chat.tsx pattern
const SectionHeader = ({ title, onChevronPress }: { title: string; onChevronPress?: () => void }) => (
    <Pressable
        onPress={onChevronPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
    >
        <FlexText style={[styles.sectionTitle, { color: "white", flex: 1 }]}>{title}</FlexText>
        {onChevronPress && (
            <View style={{ backgroundColor: "rgba(52, 52, 52, 1)", padding: 8, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 999 }}>
                <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
        )}
    </Pressable>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface MovieDetailViewProps {
    movieId: number;
}

export const MovieDetailView = ({ movieId }: MovieDetailViewProps) => {
    const { colors } = useThemeContext();
    const blurTargetRef = useRef<View | null>(null);
    const { width } = useWindowDimensions();
    const posterHeight = 500;
    const inset = useSafeAreaInsets();

    const { data: movie, isLoading, isError } = useMovieDetails(movieId);

    // Defer heavy rendering until after push animation
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const { data: images } = useMovieImages(isReady ? movieId : undefined);
    const bestLogo = useMemo(() => getBestLogo(images?.logos), [images?.logos]);

    const { data: similarData } = useMovieSimilarInfinite(isReady ? movieId : undefined);
    const { data: recData } = useMovieRecommendationsInfinite(isReady ? movieId : undefined);
    const { data: reviewsData, fetchNextPage: fetchNextReviews, isFetchingNextPage: isFetchingReviews } = useMovieReviewsInfinite(isReady ? movieId : undefined);
    const { data: watchProvidersData } = useMovieWatchProviders(isReady ? movieId : undefined);

    const posterUrl = movie ? getImageUrl(movie.poster_path, 780) : null;
    const skiaImage = useImage(posterUrl ?? "");

    // Refs
    const reviewsSheetRef = useRef<TrueSheet>(null);

    // Gallery store
    const openGallery = useGalleryStore((s) => s.openGallery);

    // Build gallery images from TMDB backdrops
    const galleryImages = useMemo(() => {
        const backdrops = images?.backdrops ?? [];
        return backdrops.map((img) => ({
            uri: getImageUrl(img.file_path, 1280),
            caption: movie?.title,
        }));
    }, [images?.backdrops, movie?.title]);

    // First page of similar / recommendations (for the horizontal preview row)
    const similarItems = useMemo<Movie[]>(() => similarData?.pages[0]?.results?.slice(0, 10) ?? [], [similarData]);
    const recItems = useMemo<Movie[]>(() => recData?.pages[0]?.results?.slice(0, 10) ?? [], [recData]);
    const cast = useMemo(() => movie?.credits?.cast ?? [], [movie?.credits?.cast]);
    const videos = useMemo(() => movie?.videos?.results ?? [], [movie?.videos?.results]);
    const reviews = useMemo(() => reviewsData?.pages.flatMap((p) => p.results) ?? [], [reviewsData]);

    const [showWallpaper, setShowWallpaper] = useState(false);
    const [urlWallpaper, setUrlWallpaper] = useState("");

    const watchProviders = useMemo(() => {
        if (!watchProvidersData?.results) return null;
        return watchProvidersData.results["US"] || Object.values(watchProvidersData.results)[0];
    }, [watchProvidersData]);

    // ─── Dominant colour (cached via MMKV) ──────────────────────────────────
    const fallbackBase = useMemo(() => {
        const c = colors.background;
        return typeof c === "string" && c.startsWith("#") && c.length >= 7 ? c.slice(0, 7) : "#000000";
    }, [colors.background]);

    const [darkDominant, setDarkDominant] = useState<string>(darkenHex(fallbackBase, 0.55));

    useEffect(() => {
        if (!posterUrl) return;
        let cancelled = false;
        const run = async () => {
            try {
                const cacheKey = `${DARK_DOMINANT_CACHE_PREFIX}${posterUrl}:${fallbackBase}`;
                const cached = storage.getString(cacheKey);
                if (cached) { if (!cancelled) setDarkDominant(cached); return; }

                const result = await getColors(posterUrl, { fallback: fallbackBase, cache: true, key: posterUrl });
                let dominant: string | undefined | null = null;
                if (result.platform === "android") dominant = result.dominant ?? result.average;
                if (result.platform === "ios") dominant = result.background ?? result.primary;

                const hex = dominant ? (dominant.startsWith("#") ? dominant : `#${dominant}`) : fallbackBase;
                const darker = darkenHex(hex, 0.55);
                storage.set(cacheKey, darker);
                if (!cancelled) setDarkDominant(darker);
            } catch {
                const fallback = darkenHex(fallbackBase, 0.55);
                if (!cancelled) setDarkDominant(fallback);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [posterUrl, fallbackBase]);

    // ─── Render helpers ──────────────────────────────────────────────────────

    const renderGalleryItem = useCallback(
        ({ item, index }: ListRenderItemInfo<TMDBMovieImage>) => (
            <Pressable
                onPress={() => openGallery(galleryImages, index)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
                <Image
                    source={{ uri: getImageUrl(item.file_path, 780) }}
                    style={{ width: 250, aspectRatio: item.aspect_ratio || 16 / 9, borderRadius: 12 }}
                    contentFit="cover"
                />
            </Pressable>
        ),
        [galleryImages, openGallery],
    );

    const galleryKeyExtractor = useCallback((item: TMDBMovieImage, index: number) => `${item.file_path}-${index}`, []);

    const renderCastItem = useCallback(
        ({ item }: ListRenderItemInfo<CastMember>) => {
            if (!item) return null;
            const getCastAvatarSource = () => {
                if (item.profile_path) return { uri: getImageUrl(item.profile_path, 185) };
                // Pseudo-random based on name length to give variety
                const name = item.name || "";
                return name.length % 2 === 0
                    ? require('../../assets/images/AV17.png')
                    : require('../../assets/images/AV86.png');
            };

            return (
                <GesturePressable
                    onPress={() => item.id && router.push({ pathname: "/person_detail", params: { id: item.id } })}
                    style={{ gap: 6, alignItems: "center", width: 80 }}
                >
                    <Image
                        source={getCastAvatarSource()}
                        style={{ width: 70, height: 70, borderRadius: 9999 }}
                        contentFit="cover"
                    />
                    <Text numberOfLines={2} style={[styles.textStyle, { color: "white", textAlign: "center", fontSize: 12 }]}>
                        {item.name || ""}
                    </Text>
                    <Text numberOfLines={1} style={[styles.textStyle, { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 }]}>
                        {item.character || ""}
                    </Text>
                </GesturePressable>
            )
        },
        [],
    );

    const renderVideoItem = useCallback(
        ({ item }: ListRenderItemInfo<TMDBVideoResult>) => {
            const isYouTube = item.site.toLowerCase() === "youtube";
            const thumbnailUrl = isYouTube ? `https://img.youtube.com/vi/${item.key}/hqdefault.jpg` : null;

            return (
                <Pressable
                    onPress={() => {
                        if (isYouTube) {
                            WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${item.key}`);
                        } else {
                            // If it's vimeo or something else, build a fallback URL or pass
                            WebBrowser.openBrowserAsync(`https://vimeo.com/${item.key}`);
                        }
                    }}
                    style={({ pressed }) => ({ width: 250, opacity: pressed ? 0.85 : 1 })}
                >
                    <View style={{ width: 250, aspectRatio: 16 / 9, borderRadius: 12, overflow: "hidden" }}>
                        <Image
                            source={{ uri: thumbnailUrl || getImageUrl(null) }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                        />
                        <View style={{ ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" }}>
                            <Ionicons name="play-circle" size={48} color="white" style={{ opacity: 0.9 }} />
                        </View>
                    </View>
                    <FlexText numberOfLines={2} style={[styles.textStyle, { color: "white", marginTop: 8, fontSize: 13 }]}>
                        {item.name}
                    </FlexText>
                    <FlexText numberOfLines={1} style={[styles.textStyle, { color: "rgba(255, 255, 255, 0.7)", fontSize: 11, marginTop: 2 }]}>
                        {item.type}
                    </FlexText>
                </Pressable>
            );
        },
        []
    );

    const renderMovieCard = useCallback(
        ({ item }: ListRenderItemInfo<Movie>) => (
            <GesturePressable
                onPress={() => router.push({ pathname: "/movie_detail", params: { id: item.id } })}
                style={{ width: 120, marginRight: 12, overflow: "hidden" }}
            >
                <View style={{ width: 120, borderRadius: 16, overflow: "hidden" }}>
                    <Image
                        source={{ uri: getImageUrl(item.poster_path, 342) }}
                        style={{ width: 120, aspectRatio: 2 / 3, borderRadius: 16, borderWidth: 1, borderColor: "rgba(132,132,132,0.34)" }}
                        contentFit="cover"
                    />
                </View>
                <FlexText numberOfLines={2} ellipsizeMode="tail" style={[styles.textStyle, { color: "white", width: "100%", flexShrink: 1, marginTop: 4, marginBottom: 4 }]}>
                    {item.title}
                </FlexText>
            </GesturePressable>
        ),
        [],
    );

    const castKeyExtractor = useCallback((item: CastMember, index: number) => item?.id ? `${item.id}-${index}` : index.toString(), []);
    const movieKeyExtractor = useCallback((item: Movie, index: number) => item?.id ? `${item.id}-${index}` : index.toString(), []);
    const videoKeyExtractor = useCallback((item: TMDBVideoResult, index: number) => item?.id ? `${item.id}-${index}` : index.toString(), []);

    // ─── Loading / Error ─────────────────────────────────────────────────────

    if (isLoading || !isReady) {
        return (
            <View style={[styles.screen, { backgroundColor: darkDominant }]}>
                <SkeletonGroup isLoading={true} variant="shimmer">
                    <View style={{ gap: 16 }}>
                        <SkeletonGroup.Item style={{ height: posterHeight, width: "100%" }} />
                        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
                            <SkeletonGroup.Item style={{ height: 32, width: "60%", borderRadius: 8, alignSelf: "center" }} />
                            <SkeletonGroup.Item style={{ height: 16, width: "100%", borderRadius: 8 }} />
                            <SkeletonGroup.Item style={{ height: 16, width: "80%", borderRadius: 8 }} />
                            <SkeletonGroup.Item style={{ height: 120, width: "100%", borderRadius: 12, marginTop: 24 }} />
                        </View>
                    </View>
                </SkeletonGroup>
            </View>
        );
    }

    if (isError || !movie) {
        return (
            <View style={[styles.screen, { backgroundColor: darkDominant, justifyContent: "center", alignItems: "center", gap: 12 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Failed to load movie.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: "white", opacity: 0.6 }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "—";
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "—";
    const backdrops = images?.backdrops ?? [];

    return (
        <View style={[styles.screen, { backgroundColor: darkDominant }]}>
            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Poster header — exact same Skia pattern as ShowDetailScreen */}
                    <View style={[styles.header, { height: posterHeight }]}>
                        <Canvas style={{ height: posterHeight }}>
                            {skiaImage && (
                                <BlurMask
                                    mask={
                                        <LinearGradient
                                            start={vec(0, posterHeight * 0.5)}
                                            end={vec(0, posterHeight)}
                                            colors={["transparent", "black"]}
                                        />
                                    }
                                >
                                    <ImageShader
                                        image={skiaImage}
                                        x={0} width={width} height={posterHeight}
                                        fit="cover" tx="clamp" ty="clamp"
                                    />
                                </BlurMask>
                            )}
                            <Rect x={0} y={0} width={width} height={posterHeight}>
                                <LinearGradient
                                    start={vec(0, posterHeight)}
                                    end={vec(0, 0)}
                                    colors={[withAlpha(darkDominant, "FF"), withAlpha(darkDominant, "99"), "transparent"]}
                                    positions={[0, 0.25, 1]}
                                />
                            </Rect>
                        </Canvas>

                        <View pointerEvents="none" style={[styles.headerOverlay, { paddingBottom: 24 }]}>
                            {bestLogo ? (
                                <Image
                                    source={{ uri: getImageUrl(bestLogo.file_path, 500) }}
                                    style={getLogoDimensions(bestLogo.aspect_ratio, width)}
                                    contentFit="contain"
                                />
                            ) : (
                                <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700", textAlign: "center" }}>
                                    {movie.title}
                                </FlexText>
                            )}
                            {movie.tagline ? (
                                <Text style={{ color: "white", opacity: 0.6, fontSize: 14, textAlign: "center", fontStyle: "italic", marginTop: 4 }}>
                                    {movie.tagline}
                                </Text>
                            ) : null}
                            {/* Genres */}
                            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                                {movie.genres?.map((g) => <GenrePill key={g.id} name={g.name} />)}
                            </View>

                            {/* Watch Providers */}
                            {watchProviders && (
                                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
                                    {[...(watchProviders.flatrate || []), ...(watchProviders.rent || []), ...(watchProviders.buy || [])]
                                        // deduplicate by provider_id
                                        .filter((v, i, a) => a.findIndex(t => (t.provider_id === v.provider_id)) === i)
                                        .slice(0, 5) // max 5 icons so it doesn't overflow
                                        .map((provider) => (
                                            <Image
                                                key={provider.provider_id}
                                                source={{ uri: getImageUrl(provider.logo_path, 92) }}
                                                style={{ width: 32, height: 32, borderRadius: 8 }}
                                                contentFit="cover"
                                            />
                                        ))}
                                </View>
                            )}

                            {/* Meta row — same dot separator as ShowDetailScreen */}
                            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap", justifyContent: "center", paddingHorizontal: 16 }}>
                                <FlexText style={[styles.textStyle, { color: "white" }]}>{movie.origin_country[0]}</FlexText>
                                <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                <FlexText style={[styles.textStyle, { color: "white" }]}>{releaseYear}</FlexText>
                                <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                <FlexText style={[styles.textStyle, { color: "white" }]}>{runtime}</FlexText>
                                <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                <IMDbBadge score={movie.vote_average} />
                                {movie.production_companies?.slice(0, 3).map((c) => (
                                    <React.Fragment key={c.id}>
                                        <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                        <FlexText style={[styles.textStyle, { color: "white" }]} numberOfLines={1}>
                                            {c.name}
                                        </FlexText>
                                    </React.Fragment>
                                ))}
                                {movie.production_companies?.length > 3 && (
                                    <>
                                        <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                        <FlexText style={[styles.textStyle, { color: "white" }]}>More</FlexText>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ─── Overview */}
                    {movie.overview ? (
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 8 }]}>Overview</Text>
                            <Text style={{ color: "white", fontSize: 15, lineHeight: 22, opacity: 0.85 }}>
                                {movie.overview}
                            </Text>
                        </View>
                    ) : null}

                    {/* ─── Gallery (backdrops) — same as ShowDetailScreen */}
                    {backdrops.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                Gallery
                            </Text>
                            <FlatList
                                horizontal
                                data={backdrops}
                                keyExtractor={galleryKeyExtractor}
                                renderItem={renderGalleryItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Videos (Trailers & Teasers) */}
                    {videos.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                Videos
                            </Text>
                            <FlatList
                                horizontal
                                data={videos}
                                keyExtractor={videoKeyExtractor}
                                renderItem={renderVideoItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Cast */}
                    {cast.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                Cast & Crew
                            </Text>
                            <FlatList
                                horizontal
                                data={cast}
                                keyExtractor={castKeyExtractor}
                                renderItem={renderCastItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Similar Movies — preview row + chevron to full list */}
                    {similarItems.length > 0 && (
                        <View>
                            <SectionHeader
                                title="Similar Movies"
                                onChevronPress={() => router.push({
                                    pathname: "/movie_list",
                                    params: { mode: "similar", movieId: movie.id, title: movie.title },
                                })}
                            />
                            <FlatList
                                horizontal
                                data={similarItems}
                                keyExtractor={movieKeyExtractor}
                                renderItem={renderMovieCard}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Recommendations — preview row + chevron to full list */}
                    {recItems.length > 0 && (
                        <View>
                            <SectionHeader
                                title="Recommendations"
                                onChevronPress={() => router.push({
                                    pathname: "/movie_list",
                                    params: { mode: "recommendations", movieId: movie.id, title: movie.title },
                                })}
                            />
                            <FlatList
                                horizontal
                                data={recItems}
                                keyExtractor={movieKeyExtractor}
                                renderItem={renderMovieCard}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Information */}
                    <View style={{ paddingHorizontal: 16, gap: 12 }}>
                        <Text style={[styles.sectionTitle, { color: "white", marginBottom: 4 }]}>Information</Text>
                        {!!movie.release_date && <InfoRow label="Released" value={movie.release_date} />}
                        {movie.runtime ? <InfoRow label="Runtime" value={runtime} /> : null}
                        {!!movie.status && <InfoRow label="Status" value={movie.status} />}
                        {movie.origin_country && movie.origin_country.length > 0 && (
                            <InfoRow label="Country" value={movie.origin_country.join(", ")} />
                        )}
                        {!!movie.original_language && <InfoRow label="Original Language" value={movie.original_language.toUpperCase()} />}
                        {!!movie.budget && movie.budget > 0 ? <InfoRow label="Budget" value={`$${movie.budget.toLocaleString()}`} /> : null}
                        {!!movie.revenue && movie.revenue > 0 ? <InfoRow label="Revenue" value={`$${movie.revenue.toLocaleString()}`} /> : null}
                        {!!movie.homepage && <InfoRow label="Homepage" isLink value={movie.homepage} />}
                        {movie.production_companies && movie.production_companies.length > 0 && (
                            <InfoRow label="Production Companies" value={movie.production_companies.map((g) => g.name).join(", ")} />
                        )}
                        {movie.spoken_languages && movie.spoken_languages.length > 0 && (
                            <InfoRow label="Spoken Languages" value={movie.spoken_languages.map((g) => g.name).join(", ")} />
                        )}
                        {!!movie.vote_count && movie.vote_count > 0 ? (
                            <InfoRow label="Rating" value={`${movie.vote_average?.toFixed(1)} / 10 (${movie.vote_count?.toLocaleString()} votes)`} />
                        ) : null}
                        {(movie.genres?.length ?? 0) > 0 && (
                            <InfoRow label="Genres" value={movie.genres.map((g) => g.name).join(", ")} />
                        )}
                    </View>

                    <View style={{ height: inset.bottom }} />
                </ScrollView>
            </BlurTargetView>

            {/* ─── Floating back button — same as ShowDetailScreen */}
            <View
                style={{
                    position: "absolute", top: inset.top, left: 16, right: 16,
                    zIndex: 1000, flexDirection: "row", justifyContent: "space-between",
                }}
            >
                <BlurView
                    tint="systemMaterialDark" intensity={80}
                    blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus"
                    style={{ borderRadius: 999, overflow: "hidden" }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                </BlurView>

                <View style={{ flexDirection: "row", gap: 8 }}>
                    {reviews.length > 0 && (
                        <BlurView
                            tint="systemMaterialDark" intensity={80}
                            blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus"
                            style={{ borderRadius: 999, overflow: "hidden" }}
                        >
                            <Pressable
                                onPress={() => reviewsSheetRef.current?.present()}
                                style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                            >
                                <DialogIcon width={28} height={28} color="white" />
                            </Pressable>
                        </BlurView>
                    )}
                    {!!movie.backdrop_path && <BlurView
                        tint="systemMaterialDark" intensity={80}
                        blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus"
                        style={{ borderRadius: 999, overflow: "hidden" }}
                    >
                        <Pressable
                            onPress={() => { setShowWallpaper(true); setUrlWallpaper(posterUrl || ""); }}
                            style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                        >
                            <MaterialIcons name="wallpaper" size={28} color="white" />
                        </Pressable>
                    </BlurView>}
                </View>
            </View>

            {/* GalleryModal overlay — exact same as ShowDetailScreen */}
            <GalleryModal />

            <WallpaperOverlay
                isVisible={showWallpaper}
                onClose={() => setShowWallpaper(false)}
                url={urlWallpaper}
            />

            {/* Reviews Sheet */}
            <ReviewsSheet
                ref={reviewsSheetRef}
                data={reviews}
                onEndReached={fetchNextReviews}
                isLoadingItems={isFetchingReviews}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { position: "relative", overflow: "hidden" },
    headerOverlay: {
        position: "absolute", bottom: 0, left: 16, right: 16,
        justifyContent: "flex-end", alignItems: "center",
    },
    sectionTitle: { fontSize: 20, fontWeight: "700" },
    textStyle: { fontSize: 14 },
});
