import { FlexText } from '@/components/FlexText';
import { GalleryModal } from '@/components/gallery/GalleryModal';
import { ShimmerEffect } from '@/components/shimmer/Shimmer';
import { useThemeContext } from '@/context/ThemeContext';
import { useTvEpisodeDetails } from '@/hooks/useMovies';
import { useGalleryStore } from '@/stores/gallery';
import { CastMember } from '@/types/moviedb';
import { TMDBVideoResult } from '@/types/moviedb/movie-entities';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { FlashList } from '@shopify/flash-list';
import { Image } from "expo-image";
import { router } from 'expo-router';
import * as WebBrowser from "expo-web-browser";
import React, { forwardRef, memo, useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressable as GesturePressable } from 'react-native-gesture-handler';
import { createCommonStyles } from "../../../styles/common";
import { useSheetBackHandler } from "../../profile/sheets/useSheetBackHandler";

const getImageUrl = (path: string | null | undefined, size: number = 500) => {
    if (!path) return `https://via.placeholder.com/${size}x750?text=No+Image`;
    return `https://image.tmdb.org/t/p/w${size}${path}`;
};

interface EpisodeDetailSheetProps {
    tvId: number;
    seasonNumber: number;
    episodeNumber: number | null;
}

const EpisodeCastItem = memo(({ item, colors, common }: { item: CastMember; colors: any; common: any }) => {
    const getCastAvatarSource = () => {
        if (item.profile_path) return { uri: getImageUrl(item.profile_path, 185) };
        return item.name.length % 2 === 0
            ? require('../../../assets/images/AV17.png')
            : require('../../../assets/images/AV86.png');
    };

    return (
        <GesturePressable
            onPress={() => router.push({ pathname: "/person_detail", params: { id: item.id } })}
            style={{ gap: 6, alignItems: "center", width: 80 }}
        >
            <Image
                source={getCastAvatarSource()}
                style={{ width: 64, height: 64, borderRadius: 9999 }}
                contentFit="cover"
            />
            <Text numberOfLines={2} style={{ color: colors.text, textAlign: "center", fontSize: 12, fontFamily: 'GoogleSansFlexRegular' }}>
                {item.name}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, fontFamily: 'GoogleSansFlexRegular' }}>
                {item.character}
            </Text>
        </GesturePressable>
    );
});

EpisodeCastItem.displayName = "EpisodeCastItem";

const EpisodeVideoItem = memo(({ item }: { item: TMDBVideoResult }) => {
    const isYouTube = item.site.toLowerCase() === "youtube";
    const thumbnailUrl = isYouTube ? `https://img.youtube.com/vi/${item.key}/hqdefault.jpg` : null;

    return (
        <Pressable
            onPress={() => {
                if (isYouTube) {
                    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${item.key}`);
                } else {
                    WebBrowser.openBrowserAsync(`https://vimeo.com/${item.key}`);
                }
            }}
            style={({ pressed }) => ({ width: 220, opacity: pressed ? 0.85 : 1 })}
        >
            <View style={{ width: 220, aspectRatio: 16 / 9, borderRadius: 12, overflow: "hidden" }}>
                <Image
                    source={{ uri: thumbnailUrl || getImageUrl(null) }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                />
                <View style={{ ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.25)" }}>
                    <Ionicons name="play-circle" size={40} color="white" style={{ opacity: 0.9 }} />
                </View>
            </View>
            <FlexText numberOfLines={2} style={{ color: "white", marginTop: 6, fontSize: 12, fontFamily: 'GoogleSansFlexRegular' }}>
                {item.name}
            </FlexText>
            <FlexText numberOfLines={1} style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, marginTop: 2, fontFamily: 'GoogleSansFlexRegular' }}>
                {item.type}
            </FlexText>
        </Pressable>
    );
});

EpisodeVideoItem.displayName = "EpisodeVideoItem";

export const EpisodeDetailSheet = memo(forwardRef<TrueSheet, EpisodeDetailSheetProps>(({ tvId, seasonNumber, episodeNumber }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const backHandler = useSheetBackHandler(ref);
    const openGallery = useGalleryStore((s) => s.openGallery);

    const { data: episode, isLoading } = useTvEpisodeDetails(
        tvId,
        seasonNumber,
        episodeNumber ?? undefined,
    );

    const cast = useMemo(() => episode?.credits?.cast?.slice(0, 20) ?? [], [episode?.credits?.cast]);
    const guestStars = useMemo(() => episode?.credits?.guest_stars?.slice(0, 20) ?? [], [episode?.credits?.guest_stars]);
    const crew = useMemo(() => episode?.credits?.crew?.slice(0, 15) ?? [], [episode?.credits?.crew]);
    const stills = useMemo(() => episode?.images?.stills?.slice(0, 20) ?? [], [episode?.images?.stills]);
    const videos = useMemo(() => episode?.videos?.results?.slice(0, 10) ?? [], [episode?.videos?.results]);

    const galleryImages = useMemo(() =>
        stills.map((img: any) => ({
            uri: getImageUrl(img.file_path, 1280),
            caption: episode?.name,
        })),
        [stills, episode?.name],
    );

    const renderCastItem = useCallback(
        ({ item }: { item: CastMember }) => (
            <EpisodeCastItem item={item} colors={colors} common={common} />
        ),
        [colors, common],
    );

    const renderVideoItem = useCallback(
        ({ item }: { item: TMDBVideoResult }) => <EpisodeVideoItem item={item} />,
        [],
    );

    const SectionLabel = useCallback(({ title }: { title: string }) => (
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 10, paddingHorizontal: 4, fontFamily: 'GoogleSansFlexRegular' }}>
            {title}
        </Text>
    ), [colors.text]);

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            cornerRadius={36}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingTop: 16 }}>
                {isLoading || !episode ? (
                    <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 16 }}>
                        <ShimmerEffect style={{ height: 200, width: "100%", borderRadius: 16 }} />
                        <ShimmerEffect style={{ height: 24, width: "60%", borderRadius: 8 }} />
                        <ShimmerEffect style={{ height: 14, width: "100%", borderRadius: 8 }} />
                        <ShimmerEffect style={{ height: 14, width: "80%", borderRadius: 8 }} />
                        <ShimmerEffect style={{ height: 80, width: "100%", borderRadius: 12 }} />
                    </View>
                ) : (
                    <ScrollView
                        nestedScrollEnabled
                        contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Episode Still Image */}
                        {episode.still_path && (
                            <Pressable
                                onPress={() => {
                                    if (galleryImages.length > 0) {
                                        openGallery(galleryImages, 0);
                                    }
                                }}
                            >
                                <Image
                                    source={{ uri: getImageUrl(episode.still_path, 780) }}
                                    style={{ width: "100%", aspectRatio: 16 / 9 }}
                                    contentFit="cover"
                                />
                            </Pressable>
                        )}

                        <View style={{ paddingHorizontal: 16, gap: 16 }}>
                            {/* Episode Title & Meta */}
                            <View>
                                <FlexText style={[common.heading, { fontSize: 22 }]}>
                                    {episode.name}
                                </FlexText>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                                        <Text style={{ color: colors.muted, fontSize: 13, fontFamily: 'GoogleSansFlexRegular' }}>
                                            {episode.air_date || "TBA"}
                                        </Text>
                                    </View>
                                    <View style={{ height: 3, width: 3, backgroundColor: colors.muted, borderRadius: 9999 }} />
                                    <Text style={{ color: colors.muted, fontSize: 13, fontFamily: 'GoogleSansFlexRegular' }}>
                                        S{seasonNumber} E{episode.episode_number}
                                    </Text>
                                    {episode.runtime ? (
                                        <>
                                            <View style={{ height: 3, width: 3, backgroundColor: colors.muted, borderRadius: 9999 }} />
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <Ionicons name="time-outline" size={14} color={colors.muted} />
                                                <Text style={{ color: colors.muted, fontSize: 13, fontFamily: 'GoogleSansFlexRegular' }}>
                                                    {episode.runtime}m
                                                </Text>
                                            </View>
                                        </>
                                    ) : null}
                                    {episode.vote_average > 0 && (
                                        <>
                                            <View style={{ height: 3, width: 3, backgroundColor: colors.muted, borderRadius: 9999 }} />
                                            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 }}>
                                                <Ionicons name="star" size={12} color="#FFD700" />
                                                <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "700" }}>
                                                    {episode.vote_average.toFixed(1)}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Overview */}
                            {episode.overview ? (
                                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, opacity: 0.85, fontFamily: 'GoogleSansFlexRegular' }}>
                                    {episode.overview}
                                </Text>
                            ) : null}
                        </View>

                        {/* ─── Stills Gallery ─── */}
                        {stills.length > 1 && (
                            <View>
                                <View style={{ paddingHorizontal: 16 }}>
                                    <SectionLabel title="Stills" />
                                </View>
                                <FlashList
                                    horizontal
                                    nestedScrollEnabled
                                    data={stills}
                                    keyExtractor={(item: any, index: number) => `${item.file_path}-${index}`}
                                    renderItem={({ item, index }: { item: any; index: number }) => (
                                        <Pressable onPress={() => openGallery(galleryImages, index)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                                            <Image
                                                source={{ uri: getImageUrl(item.file_path, 780) }}
                                                style={{ width: 220, aspectRatio: item.aspect_ratio || 16 / 9, borderRadius: 12 }}
                                                contentFit="cover"
                                            />
                                        </Pressable>
                                    )}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
                                />
                            </View>
                        )}

                        {/* ─── Videos ─── */}
                        {videos.length > 0 && (
                            <View>
                                <View style={{ paddingHorizontal: 16 }}>
                                    <SectionLabel title="Videos" />
                                </View>
                                <FlashList
                                    horizontal
                                    nestedScrollEnabled
                                    data={videos}
                                    keyExtractor={(item: TMDBVideoResult, index: number) => `${item.id}-${index}`}
                                    renderItem={renderVideoItem}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
                                />
                            </View>
                        )}

                        {/* ─── Cast ─── */}
                        {cast.length > 0 && (
                            <View>
                                <View style={{ paddingHorizontal: 16 }}>
                                    <SectionLabel title="Cast" />
                                </View>
                                <FlashList
                                    horizontal
                                    nestedScrollEnabled
                                    data={cast}
                                    keyExtractor={(item: CastMember, index: number) => `cast-${item.id}-${index}`}
                                    renderItem={renderCastItem}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
                                />
                            </View>
                        )}

                        {/* ─── Guest Stars ─── */}
                        {guestStars.length > 0 && (
                            <View>
                                <View style={{ paddingHorizontal: 16 }}>
                                    <SectionLabel title="Guest Stars" />
                                </View>
                                <FlashList
                                    horizontal
                                    nestedScrollEnabled
                                    data={guestStars}
                                    keyExtractor={(item: any, index: number) => `guest-${item.id}-${index}`}
                                    renderItem={renderCastItem}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
                                />
                            </View>
                        )}

                        {/* ─── Crew (compact list) ─── */}
                        {crew.length > 0 && (
                            <View style={{ paddingHorizontal: 16 }}>
                                <SectionLabel title="Crew" />
                                <View style={{ gap: 8 }}>
                                    {crew.map((member: any, index: number) => (
                                        <GesturePressable
                                            key={`crew-${member.id}-${member.job}-${index}`}
                                            onPress={() => router.push({ pathname: "/person_detail", params: { id: member.id } })}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 10,
                                                backgroundColor: colors.card || "rgba(255,255,255,0.05)",
                                                paddingVertical: 10,
                                                paddingHorizontal: 12,
                                                borderRadius: 12,
                                            }}
                                        >
                                            <Image
                                                source={
                                                    member.profile_path
                                                        ? { uri: getImageUrl(member.profile_path, 185) }
                                                        : member.name.length % 2 === 0
                                                            ? require('../../../assets/images/AV17.png')
                                                            : require('../../../assets/images/AV86.png')
                                                }
                                                style={{ width: 36, height: 36, borderRadius: 9999 }}
                                                contentFit="cover"
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: "600", fontFamily: 'GoogleSansFlexRegular' }}>
                                                    {member.name}
                                                </Text>
                                                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, fontFamily: 'GoogleSansFlexRegular' }}>
                                                    {member.job}
                                                </Text>
                                            </View>
                                        </GesturePressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* ─── Episode Info ─── */}
                        <View style={{ paddingHorizontal: 16, gap: 10 }}>
                            <SectionLabel title="Information" />
                            {episode.air_date && (
                                <View style={{ gap: 2 }}>
                                    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>Air Date</Text>
                                    <Text style={{ color: colors.muted, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>{episode.air_date}</Text>
                                </View>
                            )}
                            {episode.runtime ? (
                                <View style={{ gap: 2 }}>
                                    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>Runtime</Text>
                                    <Text style={{ color: colors.muted, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>{episode.runtime} minutes</Text>
                                </View>
                            ) : null}
                            {episode.vote_count > 0 && (
                                <View style={{ gap: 2 }}>
                                    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>Rating</Text>
                                    <Text style={{ color: colors.muted, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>
                                        {episode.vote_average?.toFixed(1)} / 10 ({episode.vote_count?.toLocaleString()} votes)
                                    </Text>
                                </View>
                            )}
                            {episode.production_code ? (
                                <View style={{ gap: 2 }}>
                                    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>Production Code</Text>
                                    <Text style={{ color: colors.muted, fontSize: 14, fontFamily: 'GoogleSansFlexRegular' }}>{episode.production_code}</Text>
                                </View>
                            ) : null}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Gallery overlay inside the sheet */}
            <GalleryModal />
        </TrueSheet>
    );
}));
