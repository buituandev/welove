import { SkeletonGroup } from "heroui-native/skeleton-group";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { sharedStyles } from "./shared/TvDetailAtoms";
import { EpisodeCard, SeasonDropdown } from "./shared/TvEpisodeWidgets";

const EPISODE_PREVIEW_LIMIT = 2;

interface TvSeasonsSectionProps {
    tvId: number;
    tvName: string;
    selectedSeasonNumber: number;
    seasons: any[];
    seasonDropdownOpen: boolean;
    onSelectSeason: (num: number) => void;
    onToggleDropdown: () => void;
    episodesVisible: boolean;
    onToggleEpisodesVisible: () => void;
    seasonOverview: string | null | undefined;
    isSeasonLoading: boolean;
    episodes: any[];
    onEpisodePress: (episodeNumber: number) => void;
}

export const TvSeasonsSection = ({
    tvId,
    tvName,
    seasons,
    selectedSeasonNumber,
    seasonDropdownOpen,
    onSelectSeason,
    onToggleDropdown,
    episodesVisible,
    onToggleEpisodesVisible,
    seasonOverview,
    isSeasonLoading,
    episodes,
    onEpisodePress,
}: TvSeasonsSectionProps) => {
    if (seasons.length === 0) return null;

    return (
        <View style={{ gap: 12 }}>
            {/* ─── Section Header with eye toggle ─── */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
                <Text style={[sharedStyles.sectionTitle, { flex: 1 }]}>
                    Seasons & Episodes
                </Text>
                <Pressable
                    onPress={onToggleEpisodesVisible}
                    style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 999,
                        backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                    })}
                    hitSlop={8}
                >
                    <Ionicons
                        name={episodesVisible ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="rgba(255,255,255,0.6)"
                    />
                </Pressable>
            </View>

            {/* ─── Collapsible body ─── */}
            {episodesVisible && (
                <>
                    {/* Season Dropdown */}
                    <SeasonDropdown
                        seasons={seasons}
                        selectedSeason={selectedSeasonNumber}
                        onSelectSeason={onSelectSeason}
                        isOpen={seasonDropdownOpen}
                        onToggle={onToggleDropdown}
                    />

                    {/* Season Overview */}
                    {!!seasonOverview && (
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={{ color: "white", fontSize: 13, lineHeight: 19, opacity: 0.7 }}>
                                {seasonOverview}
                            </Text>
                        </View>
                    )}

                    {/* Episodes List */}
                    {isSeasonLoading ? (
                        <EpisodeListSkeleton />
                    ) : episodes.length > 0 ? (
                        <EpisodeList
                            episodes={episodes}
                            tvId={tvId}
                            tvName={tvName}
                            seasonNumber={selectedSeasonNumber}
                            onEpisodePress={onEpisodePress}
                        />
                    ) : (
                        <EmptyEpisodes />
                    )}
                </>
            )}
        </View>
    );
};

interface EpisodeListProps {
    episodes: any[];
    tvId: number;
    tvName: string;
    seasonNumber: number;
    onEpisodePress: (n: number) => void;
}

const EpisodeList = ({ episodes, tvId, tvName, seasonNumber, onEpisodePress }: EpisodeListProps) => {
    const preview = episodes.slice(0, EPISODE_PREVIEW_LIMIT);
    const hasMore = episodes.length > EPISODE_PREVIEW_LIMIT;

    return (
        <View>
            {preview.map((ep: any, index: number) => (
                <React.Fragment key={`ep-${ep.episode_number}`}>
                    <EpisodeCard episode={ep} onPress={() => onEpisodePress(ep.episode_number)} />
                    {index < preview.length - 1 && (
                        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 16 }} />
                    )}
                </React.Fragment>
            ))}

            {hasMore && (
                <>
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 16, marginTop: 4 }} />
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: "/movie_list",
                                params: {
                                    mode: "tv_season_episodes",
                                    movieId: tvId,
                                    seasonNumber,
                                    title: tvName,
                                },
                            })
                        }
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            marginHorizontal: 16,
                            marginTop: 10,
                            marginBottom: 4,
                            paddingVertical: 13,
                            borderRadius: 14,
                            backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                        })}
                    >
                        <Ionicons name="list-outline" size={18} color="rgba(255,255,255,0.8)" />
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                            View all {episodes.length} episodes
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                </>
            )}
        </View>
    );
};

// ─── Episode List Skeleton ─────────────────────────────────────────────────────

const EpisodeListSkeleton = () => (
    <SkeletonGroup isLoading={true} variant="shimmer">
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                    <SkeletonGroup.Item style={{ width: 130, height: 73, borderRadius: 10 }} />
                    <View style={{ flex: 1, gap: 8, justifyContent: "center" }}>
                        <SkeletonGroup.Item style={{ height: 14, width: "80%", borderRadius: 6 }} />
                        <SkeletonGroup.Item style={{ height: 12, width: "50%", borderRadius: 6 }} />
                        <SkeletonGroup.Item style={{ height: 12, width: "90%", borderRadius: 6 }} />
                    </View>
                </View>
            ))}
        </View>
    </SkeletonGroup>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyEpisodes = () => (
    <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <Ionicons name="film-outline" size={32} color="rgba(255,255,255,0.3)" />
        <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 14 }}>
            No episodes available
        </Text>
    </View>
);
