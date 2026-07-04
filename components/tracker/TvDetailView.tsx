/* eslint-disable react-hooks/refs */
import DialogIcon from "@/assets/images/svg/chat-double.svg";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { EpisodeDetailSheet } from "@/components/tracker/sheets/EpisodeDetailSheet";
import { ReviewsSheet } from "@/components/tracker/sheets/ReviewsSheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { BlurTargetView, BlurView } from "expo-blur";
import { router } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WallpaperOverlay from "../WallpaperOverlay";
import { TvInfoSection } from "./tv/TvInfoSection";
import { TvCastRow, TvGalleryRow, TvRecommendationsRow, TvSimilarRow, TvVideosRow } from "./tv/TvMediaRows";
import { TvPosterHeader } from "./tv/TvPosterHeader";
import { TvSeasonsSection } from "./tv/TvSeasonsSection";
import { useTvDetailViewModel } from "./tv/useTvDetailViewModel";

interface TvDetailViewProps {
    tvId: number;
}

export const TvDetailView = ({ tvId }: TvDetailViewProps) => {
    'use no memo';
    const inset = useSafeAreaInsets();
    const blurTargetRef = useRef<View | null>(null);
    // Defer heavy rendering until after push animation
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const vm = useTvDetailViewModel(tvId, isReady);

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (vm.isLoading || !isReady) {
        return (
            <View style={[styles.screen, { backgroundColor: vm.darkDominant }]}>
                <SkeletonGroup isLoading={true} variant="shimmer">
                    <View style={{ gap: 16 }}>
                        <SkeletonGroup.Item style={{ height: 500, width: "100%" }} />
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

    // ─── Error ────────────────────────────────────────────────────────────────
    if (vm.isError || !vm.tv) {
        return (
            <View style={[styles.screen, { backgroundColor: vm.darkDominant, justifyContent: "center", alignItems: "center", gap: 12 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Failed to load TV Series.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: "white", opacity: 0.6 }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: vm.darkDominant }]}>
            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Poster Header ─── */}
                    <TvPosterHeader
                        tv={vm.tv}
                        skiaImage={vm.skiaImage}
                        darkDominant={vm.darkDominant}
                        contentRating={vm.contentRating}
                        watchProviders={vm.watchProviders}
                        firstAirYear={vm.firstAirYear}
                        runtime={vm.runtime}
                        logos={vm.logos}
                    />

                    {/* ─── Overview ─── */}
                    {vm.tv.overview ? (
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={styles.sectionTitle}>Overview</Text>
                            <Text style={{ color: "white", fontSize: 15, lineHeight: 22, opacity: 0.85, marginTop: 8 }}>
                                {vm.tv.overview}
                            </Text>
                        </View>
                    ) : null}

                    {/* ─── Seasons & Episodes ─── */}
                    <TvSeasonsSection
                        tvId={tvId}
                        tvName={vm.tv.name}
                        seasons={vm.seasons}
                        selectedSeasonNumber={vm.selectedSeasonNumber}
                        seasonDropdownOpen={vm.seasonDropdownOpen}
                        onSelectSeason={vm.handleSelectSeason}
                        onToggleDropdown={vm.toggleSeasonDropdown}
                        episodesVisible={vm.episodesVisible}
                        onToggleEpisodesVisible={vm.toggleEpisodesVisible}
                        seasonOverview={vm.seasonData?.overview}
                        isSeasonLoading={vm.isSeasonLoading}
                        episodes={vm.episodes}
                        onEpisodePress={vm.handleOpenEpisode}
                    />

                    {/* ─── Gallery ─── */}
                    <TvGalleryRow
                        backdrops={vm.backdrops}
                        galleryImages={vm.galleryImages}
                        openGallery={vm.openGallery}
                    />

                    {/* ─── Videos ─── */}
                    <TvVideosRow videos={vm.videos} />

                    {/* ─── Cast & Crew ─── */}
                    <TvCastRow cast={vm.cast} />

                    {/* ─── Similar Shows ─── */}
                    <TvSimilarRow tvId={vm.tv.id} tvName={vm.tv.name} items={vm.similarItems} />

                    {/* ─── Recommendations ─── */}
                    <TvRecommendationsRow tvId={vm.tv.id} tvName={vm.tv.name} items={vm.recItems} />

                    {/* ─── Information ─── */}
                    <TvInfoSection tv={vm.tv} />

                    <View style={{ height: inset.bottom }} />
                </ScrollView>
            </BlurTargetView>

            {/* ─── Floating nav bar ─── */}
            <View style={{ position: "absolute", top: inset.top, left: 16, right: 16, zIndex: 1000, flexDirection: "row", justifyContent: "space-between" }}>
                <BlurView tint="systemMaterialDark" intensity={80} blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus" style={{ borderRadius: 999, overflow: "hidden" }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                </BlurView>

                <View style={{ flexDirection: "row", gap: 8 }}>
                    {!!vm.tv.backdrop_path && <BlurView
                        tint="systemMaterialDark" intensity={80}
                        blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus"
                        style={{ borderRadius: 999, overflow: "hidden" }}
                    >
                        <Pressable
                            onPress={() => { vm.setShowWallpaper(true); vm.setUrlWallpaper(vm.posterUrl || ""); }}
                            style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                        >
                            <MaterialIcons name="wallpaper" size={28} color="white" />
                        </Pressable>
                    </BlurView>}
                    {vm.reviews.length > 0 && (
                        <BlurView tint="systemMaterialDark" intensity={80} blurTarget={blurTargetRef} blurMethod="dimezisBlurViewSdk31Plus" style={{ borderRadius: 999, overflow: "hidden" }}>
                            <TouchableOpacity
                                onPress={vm.openReviewsSheet}
                                style={{ borderRadius: 999, width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
                            >
                                <DialogIcon width={28} height={28} color="white" />
                            </TouchableOpacity>
                        </BlurView>
                    )}
                </View>
            </View>

            {/* ─── Overlays & Sheets ─── */}
            <GalleryModal />

            <WallpaperOverlay
                isVisible={vm.showWallpaper}
                onClose={() => vm.setShowWallpaper(false)}
                url={vm.urlWallpaper}
            />

            <ReviewsSheet
                ref={vm.reviewsSheetRef}
                data={vm.reviews}
                onEndReached={vm.fetchNextReviews}
                isLoadingItems={vm.isFetchingReviews}
            />

            {vm.selectedEpisodeNumber !== null && (
                <EpisodeDetailSheet
                    ref={vm.episodeSheetRef}
                    tvId={tvId}
                    seasonNumber={vm.selectedSeasonNumber}
                    episodeNumber={vm.selectedEpisodeNumber}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: "white" },
});
