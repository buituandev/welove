import { FlexText } from "@/components/FlexText";
import { CastMember } from "@/types/moviedb";
import { TMDBVideoResult } from "@/types/moviedb/movie-entities";
import { TMDBMovieImage } from "@/types/moviedb/movie-images";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlatList as GestureFlatList, Pressable as GesturePressable } from "react-native-gesture-handler";
import { SectionHeader, sharedStyles } from "./shared/TvDetailAtoms";
import { getImageUrl } from "./shared/tvDetailUtils";

// ─── Gallery Row ──────────────────────────────────────────────────────────────

interface TvGalleryRowProps {
    backdrops: TMDBMovieImage[];
    galleryImages: { uri: string; caption?: string }[];
    openGallery: (images: { uri: string; caption?: string }[], index: number) => void;
}

export const TvGalleryRow = ({ backdrops, galleryImages, openGallery }: TvGalleryRowProps) => {
    const renderItem = useCallback(
        ({ item, index }: { item: TMDBMovieImage; index: number }) => (
            <GesturePressable
                onPress={() => openGallery(galleryImages, index)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
                <Image
                    source={{ uri: getImageUrl(item.file_path, 780) }}
                    style={{ width: 250, aspectRatio: item.aspect_ratio || 16 / 9, borderRadius: 12 }}
                    contentFit="cover"
                />
            </GesturePressable>
        ),
        [galleryImages, openGallery],
    );

    if (backdrops.length === 0) return null;

    return (
        <View>
            <Text style={[sharedStyles.sectionTitle, { marginBottom: 12, paddingHorizontal: 16 }]}>Gallery</Text>
            <GestureFlatList
                horizontal
                data={backdrops}
                keyExtractor={(item, index) => item?.file_path ? `${item.file_path}-${index}` : index.toString()}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            />
        </View>
    );
};

// ─── Videos Row ───────────────────────────────────────────────────────────────

interface TvVideosRowProps {
    videos: TMDBVideoResult[];
}

export const TvVideosRow = ({ videos }: TvVideosRowProps) => {
    const renderItem = useCallback(({ item }: { item: TMDBVideoResult }) => {
        const isYouTube = item?.site?.toLowerCase() === "youtube";
        const thumbnailUrl = isYouTube ? `https://img.youtube.com/vi/${item.key}/hqdefault.jpg` : null;
        return (
            <GesturePressable
                onPress={() =>
                    item?.key && WebBrowser.openBrowserAsync(
                        isYouTube
                            ? `https://www.youtube.com/watch?v=${item.key}`
                            : `https://vimeo.com/${item.key}`,
                    )
                }
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
                <FlexText numberOfLines={2} style={[sharedStyles.label, { marginTop: 8, fontSize: 13 }]}>{item?.name || ""}</FlexText>
                <FlexText numberOfLines={1} style={[sharedStyles.muted, { fontSize: 11, marginTop: 2 }]}>{item?.type || ""}</FlexText>
            </GesturePressable>
        );
    }, []);

    if (videos.length === 0) return null;

    return (
        <View>
            <Text style={[sharedStyles.sectionTitle, { marginBottom: 12, paddingHorizontal: 16 }]}>Videos</Text>
            <GestureFlatList
                horizontal
                data={videos}
                keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : index.toString()}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            />
        </View>
    );
};

// ─── Cast Row ─────────────────────────────────────────────────────────────────

interface TvCastRowProps {
    cast: CastMember[];
}

export const TvCastRow = ({ cast }: TvCastRowProps) => {
    const renderItem = useCallback(({ item }: { item: CastMember }) => {
        if (!item) return null;
        const name = item.name || "";
        const avatarSource = item.profile_path
            ? { uri: getImageUrl(item.profile_path, 185) }
            : name.length % 2 === 0
                ? require('../../../assets/images/AV17.png')
                : require('../../../assets/images/AV86.png');
        return (
            <GesturePressable
                onPress={() => item.id && router.push({ pathname: "/person_detail", params: { id: item.id } })}
                style={{ gap: 6, alignItems: "center", width: 80 }}
            >
                <Image source={avatarSource} style={{ width: 70, height: 70, borderRadius: 9999 }} contentFit="cover" />
                <Text numberOfLines={2} style={[sharedStyles.label, { textAlign: "center", fontSize: 12 }]}>{item.name || ""}</Text>
                <Text numberOfLines={1} style={[sharedStyles.muted, { fontSize: 11 }]}>{item.character || ""}</Text>
            </GesturePressable>
        );
    }, []);

    if (cast.length === 0) return null;

    return (
        <View>
            <Text style={[sharedStyles.sectionTitle, { marginBottom: 12, paddingHorizontal: 16 }]}>Cast & Crew</Text>
            <GestureFlatList
                horizontal
                data={cast}
                keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : index.toString()}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}
            />
        </View>
    );
};

// ─── TV Card (used by Similar + Recommendations) ──────────────────────────────

const TvCard = ({ item }: { item: any }) => (
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
        <FlexText numberOfLines={2} ellipsizeMode="tail" style={[sharedStyles.label, { width: "100%", flexShrink: 1, marginTop: 4, marginBottom: 4, fontSize: 14 }]}>
            {item.name}
        </FlexText>
    </GesturePressable>
);

const renderTvCard = ({ item }: { item: any }) => <TvCard item={item} />;
const tvKeyExtractor = (item: any, index: number) => `${item.id}-${index}`;

// ─── Similar Shows Row ────────────────────────────────────────────────────────

interface TvSimilarRowProps {
    tvId: number;
    tvName: string;
    items: any[];
}

export const TvSimilarRow = ({ tvId, tvName, items }: TvSimilarRowProps) => {
    if (items.length === 0) return null;
    return (
        <View>
            <SectionHeader
                title="Similar Shows"
                onChevronPress={() => router.push({ pathname: "/movie_list", params: { mode: "tv_similar", movieId: tvId, title: tvName } })}
            />
            <GestureFlatList
                horizontal
                data={items}
                keyExtractor={tvKeyExtractor}
                renderItem={renderTvCard}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
};

// ─── Recommendations Row ──────────────────────────────────────────────────────

interface TvRecommendationsRowProps {
    tvId: number;
    tvName: string;
    items: any[];
}

export const TvRecommendationsRow = ({ tvId, tvName, items }: TvRecommendationsRowProps) => {
    if (items.length === 0) return null;
    return (
        <View>
            <SectionHeader
                title="Recommendations"
                onChevronPress={() => router.push({ pathname: "/movie_list", params: { mode: "tv_recommendations", movieId: tvId, title: tvName } })}
            />
            <GestureFlatList
                horizontal
                data={items}
                keyExtractor={tvKeyExtractor}
                renderItem={renderTvCard}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
};
