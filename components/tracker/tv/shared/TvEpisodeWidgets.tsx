import { FlexText } from "@/components/FlexText";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { getImageUrl } from "./tvDetailUtils";

// ─── Season Dropdown ─────────────────────────────────────────────────────────

export interface SeasonDropdownProps {
    seasons: any[];
    selectedSeason: number;
    onSelectSeason: (num: number) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const SeasonDropdown = ({ seasons, selectedSeason, onSelectSeason, isOpen, onToggle }: SeasonDropdownProps) => {
    const currentSeason = seasons.find((s: any) => s.season_number === selectedSeason);
    const displayName = currentSeason
        ? (currentSeason.season_number === 0 ? "Specials" : `Season ${currentSeason.season_number}`)
        : `Season ${selectedSeason}`;

    return (
        <View style={{ paddingHorizontal: 16, zIndex: 100 }}>
            {/* Trigger */}
            <Pressable
                onPress={onToggle}
                style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                })}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="layers-outline" size={18} color="white" />
                    <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>{displayName}</Text>
                    {currentSeason?.episode_count ? (
                        <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>
                                {currentSeason.episode_count} eps
                            </Text>
                        </View>
                    ) : null}
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>

            {/* Dropdown List */}
            {isOpen && (
                <View style={{
                    marginTop: 6,
                    backgroundColor: "rgba(30,30,30,0.98)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    overflow: "hidden",
                }}>
                    {seasons.map((season: any, index: number) => {
                        const isSelected = season.season_number === selectedSeason;
                        const label = season.season_number === 0 ? "Specials" : `Season ${season.season_number}`;
                        return (
                            <Pressable
                                key={season.id}
                                onPress={() => onSelectSeason(season.season_number)}
                                style={({ pressed }) => ({
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingHorizontal: 16,
                                    paddingVertical: 13,
                                    backgroundColor: pressed
                                        ? "rgba(255,255,255,0.1)"
                                        : isSelected
                                            ? "rgba(255,255,255,0.06)"
                                            : "transparent",
                                    borderBottomWidth: index < seasons.length - 1 ? StyleSheet.hairlineWidth : 0,
                                    borderBottomColor: "rgba(255,255,255,0.08)",
                                })}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    {season.poster_path ? (
                                        <Image
                                            source={{ uri: getImageUrl(season.poster_path, 92) }}
                                            style={{ width: 32, height: 48, borderRadius: 6 }}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View style={{ width: 32, height: 48, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" }}>
                                            <Ionicons name="film-outline" size={16} color="rgba(255,255,255,0.3)" />
                                        </View>
                                    )}
                                    <View>
                                        <Text style={{ color: isSelected ? "#007AFF" : "white", fontSize: 14, fontWeight: isSelected ? "700" : "500" }}>
                                            {label}
                                        </Text>
                                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                                            {season.episode_count} episodes{season.air_date ? ` · ${new Date(season.air_date).getFullYear()}` : ""}
                                        </Text>
                                    </View>
                                </View>
                                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

// ─── Episode Card ─────────────────────────────────────────────────────────────

export interface EpisodeCardProps {
    episode: any;
    onPress: () => void;
}

export const EpisodeCard = React.memo(({ episode, onPress }: EpisodeCardProps) => (
    <GesturePressable
        onPress={onPress}
        style={{ flexDirection: "row", gap: 12, paddingVertical: 10, paddingHorizontal: 16 }}
    >
        {/* Thumbnail */}
        <View style={{ width: 130, aspectRatio: 16 / 9, borderRadius: 10, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" }}>
            {episode.still_path ? (
                <Image
                    source={{ uri: getImageUrl(episode.still_path, 300) }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                />
            ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.2)" />
                </View>
            )}
            <View style={{ position: "absolute", top: 4, left: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>E{episode.episode_number}</Text>
            </View>
        </View>

        {/* Info */}
        <View style={{ flex: 1, justifyContent: "center", gap: 4 }}>
            <FlexText numberOfLines={2} style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                {episode.name}
            </FlexText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {episode.air_date && (
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{episode.air_date}</Text>
                )}
                {episode.runtime ? (
                    <>
                        <View style={{ height: 3, width: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 9999 }} />
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{episode.runtime}m</Text>
                    </>
                ) : null}
                {episode.vote_average > 0 && (
                    <>
                        <View style={{ height: 3, width: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 9999 }} />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="star" size={10} color="#FFD700" />
                            <Text style={{ color: "#FFD700", fontSize: 11, fontWeight: "600" }}>
                                {episode.vote_average.toFixed(1)}
                            </Text>
                        </View>
                    </>
                )}
            </View>
            {episode.overview ? (
                <Text numberOfLines={2} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 17 }}>
                    {episode.overview}
                </Text>
            ) : null}
        </View>

        {/* Chevron */}
        <View style={{ justifyContent: "center" }}>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
        </View>
    </GesturePressable>
));
