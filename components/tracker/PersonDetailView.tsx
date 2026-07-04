/* eslint-disable react-hooks/preserve-manual-memoization */
import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { useThemeContext } from "@/context/ThemeContext";
import { usePersonDetails } from "@/hooks/useMovies";
import { useGalleryStore } from "@/stores/gallery";
import { enrichProfileData } from "@/utils/zodiacCalculation";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Canvas, ImageShader, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { getColors } from "react-native-image-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { personDetailStorage as storage } from "../../services/storage";
import { getBestLogo, getLogoDimensions } from "./logoUtils";

// ─── MMKV cache ────────────────────────────────────────────

const DARK_DOMINANT_CACHE_PREFIX = "person:darkDominant:";

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




// ─── Main Component ───────────────────────────────────────────────────────────

interface PersonDetailViewProps {
    personId: number;
}

export const PersonDetailView = ({ personId }: PersonDetailViewProps) => {
    const { colors } = useThemeContext();
    const blurTargetRef = useRef<View | null>(null);
    const { width } = useWindowDimensions();
    const posterHeight = 500;
    const inset = useSafeAreaInsets();

    const { data: person, isLoading, isError } = usePersonDetails(personId);
    const bestLogo = useMemo(() => getBestLogo(person?.images?.logos), [person?.images?.logos]);


    // Defer heavy rendering until after push animation
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const [enrichedData, setEnrichedData] = useState<any>(null);

    useEffect(() => {
        if (person?.birthday) {
            enrichProfileData(person.birthday).then(setEnrichedData);
        }
    }, [person?.birthday]);

    const posterUrl = person ? getImageUrl(person.profile_path, 780) : null;
    const skiaImage = useImage(posterUrl ?? "");

    // Gallery store
    const openGallery = useGalleryStore((s) => s.openGallery);

    // Build gallery images from TMDB profiles
    const galleryImages = useMemo(() => {
        const profiles = person?.images?.profiles ?? [];
        return profiles.map((img: any) => ({
            uri: getImageUrl(img.file_path, 1280),
            caption: person?.name,
        }));
    }, [person?.images?.profiles, person?.name]);

    // Credits (Movies)
    const movieCredits = useMemo(() => {
        if (!person?.movie_credits?.cast) return [];
        return [...person.movie_credits.cast]
            .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
            .sort((a, b) => b.popularity - a.popularity);
    }, [person?.movie_credits?.cast]);

    // Credits (TV Shows)
    const tvCredits = useMemo(() => {
        if (!person?.tv_credits?.cast) return [];
        return [...person.tv_credits.cast]
            .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
            .sort((a, b) => b.popularity - a.popularity);
    }, [person?.tv_credits?.cast]);

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
        ({ item, index }: { item: any; index: number }) => (
            <Pressable
                onPress={() => openGallery(galleryImages, index)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
                <Image
                    source={{ uri: getImageUrl(item.file_path, 780) }}
                    style={{ width: 140, aspectRatio: item.aspect_ratio || 2 / 3, borderRadius: 12 }}
                    contentFit="cover"
                />
            </Pressable>
        ),
        [galleryImages, openGallery],
    );

    const renderMovieCreditItem = useCallback(
        ({ item }: { item: any }) => {
            return (
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
                    {item.character ? (
                        <FlexText numberOfLines={1} style={[styles.textStyle, { color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }]}>
                            {item.character}
                        </FlexText>
                    ) : null}
                    <IMDbBadge score={item.vote_average} />
                </GesturePressable>
            )
        },
        [],
    );

    const renderTvCreditItem = useCallback(
        ({ item }: { item: any }) => {
            return (
                <GesturePressable
                    onPress={() => router.push({ pathname: "/tv_detail", params: { id: item.id } })}
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
                        {item.name}
                    </FlexText>
                    {item.character ? (
                        <FlexText numberOfLines={1} style={[styles.textStyle, { color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 4 }]}>
                            {item.character}
                        </FlexText>
                    ) : null}
                    <IMDbBadge score={item.vote_average} />
                </GesturePressable>
            )
        },
        [],
    );

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

    if (isError || !person) {
        return (
            <View style={[styles.screen, { backgroundColor: darkDominant, justifyContent: "center", alignItems: "center", gap: 12 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Failed to load person data.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: "white", opacity: 0.6 }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const profiles = person.images?.profiles ?? [];
    const age = person.birthday ? Math.floor((new Date().getTime() - new Date(person.birthday).getTime()) / 31557600000) : null;
    const deathAge = person.birthday && person.deathday ? Math.floor((new Date(person.deathday).getTime() - new Date(person.birthday).getTime()) / 31557600000) : null;

    return (
        <View style={[styles.screen, { backgroundColor: darkDominant }]}>
            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Poster header — exact same Skia pattern */}
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
                                    {person.name}
                                </FlexText>
                            )}
                            {/* Meta row — same dot separator */}
                            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap", justifyContent: "center", paddingHorizontal: 16 }}>
                                <FlexText style={[styles.textStyle, { color: "white" }]}>{person.known_for_department}</FlexText>

                                {person.place_of_birth ? (
                                    <>
                                        <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                        <FlexText style={[styles.textStyle, { color: "white" }]}>{person.place_of_birth}</FlexText>
                                    </>
                                ) : null}

                                {person.birthday ? (
                                    <>
                                        <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                                        <FlexText style={[styles.textStyle, { color: "white" }]}>
                                            {person.deathday ? `† ${new Date(person.deathday).getFullYear()} (Died at ${deathAge})` : `${age} yrs old`}
                                        </FlexText>
                                    </>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    {/* ─── Enriched Zodiac & Info ─── */}
                    {enrichedData && (
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12 }]}>Personal Trivia</Text>
                            <View style={{ gap: 8 }}>
                                <FlexText style={[styles.textStyle, { color: "rgba(255,255,255,0.85)" }]}>
                                    <Text style={{ fontWeight: "700", color: "white" }}>Zodiac Sign:</Text> {enrichedData.zodiacSign.charAt(0).toUpperCase() + enrichedData.zodiacSign.slice(1)}
                                </FlexText>
                                <FlexText style={[styles.textStyle, { color: "rgba(255,255,255,0.85)" }]}>
                                    <Text style={{ fontWeight: "700", color: "white" }}>Chinese Zodiac:</Text> {enrichedData.chineseZodiac.charAt(0).toUpperCase() + enrichedData.chineseZodiac.slice(1)}
                                </FlexText>
                                <FlexText style={[styles.textStyle, { color: "rgba(255,255,255,0.85)" }]}>
                                    <Text style={{ fontWeight: "700", color: "white" }}>Generation:</Text> {enrichedData.generation}
                                </FlexText>
                                <FlexText style={[styles.textStyle, { color: "rgba(255,255,255,0.85)", lineHeight: 22 }]}>
                                    <Text style={{ fontWeight: "700", color: "white" }}>On this day ({new Date(person.birthday).toLocaleString('en-US', { month: 'long', day: 'numeric' })}):</Text> {enrichedData.historicalEvent}
                                </FlexText>
                            </View>
                        </View>
                    )}

                    {/* ─── Biography */}
                    {person.biography ? (
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 8 }]}>Biography</Text>
                            <Text style={{ color: "white", fontSize: 14, lineHeight: 22, opacity: 0.85 }}>
                                {person.biography}
                            </Text>
                        </View>
                    ) : null}

                    {/* ─── Movie Credits */}
                    {movieCredits.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                Movies
                            </Text>
                            <FlatList
                                horizontal
                                data={movieCredits}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                renderItem={renderMovieCreditItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── TV Credits */}
                    {tvCredits.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                TV Shows
                            </Text>
                            <FlatList
                                horizontal
                                data={tvCredits}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                renderItem={renderTvCreditItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}

                    {/* ─── Gallery (profiles) */}
                    {profiles.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, paddingHorizontal: 16 }]}>
                                Photos
                            </Text>
                            <FlatList
                                horizontal
                                data={profiles}
                                keyExtractor={(item: any, i) => `${item.file_path}-${i}`}
                                renderItem={renderGalleryItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                            />
                        </View>
                    )}
                </ScrollView>
            </BlurTargetView>
            <GalleryModal />

            {/* Float Back Button over everything */}
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
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { position: "relative", overflow: "hidden" },
    headerOverlay: { position: "absolute", bottom: 0, left: 16, right: 16, justifyContent: "flex-end", alignItems: "center" },
    textStyle: { fontSize: 14, fontWeight: "500" },
    sectionTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
});
