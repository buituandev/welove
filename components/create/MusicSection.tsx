import Ionicons from "@react-native-vector-icons/ionicons/static";
import CheckCircle from "@/assets/images/svg/check-circle.svg";
import MusicIcon from "@/assets/images/svg/music-2.svg";
import { SquircleView } from "expo-squircle-view";
import { Spinner } from "heroui-native/spinner";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Image,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { DeezerTrack } from "../../services/deezer";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

// ============================================================================
// MusicSearchResult Component
// ============================================================================

interface MusicSearchResultProps {
    track: DeezerTrack;
    isSelected: boolean;
    onSelect: () => void;
    colors: ThemeColors;
    common: any;
}

const MusicSearchResult = memo(({
    track,
    isSelected,
    onSelect,
    colors,
    common,
}: MusicSearchResultProps) => (
    <SquircleView style={[{
        backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceContainerHigh,
        borderRadius: 8
    }]}>
        <TouchableOpacity
            style={[
                createStyles.musicResultItem,
            ]}
            onPress={onSelect}
        >
            <Image source={{ uri: track.cover_url }} style={createStyles.musicCover} />
            <View style={createStyles.musicInfo}>
                <FlexText style={[common.subheading, createStyles.musicTitle, { color: isSelected ? colors.onPrimaryContainer : colors.onSurface }]} numberOfLines={1}>
                    {track.title}
                </FlexText>
                <FlexText style={[common.caption, createStyles.musicArtist, { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }]} numberOfLines={1}>
                    {track.artist}
                </FlexText>
            </View>
            {isSelected && (
                <CheckCircle width={24} height={24} color={colors.primary} />
            )}
        </TouchableOpacity>
    </SquircleView >
));

MusicSearchResult.displayName = "MusicSearchResult";

// ============================================================================
// SelectedMusicCard Component
// ============================================================================

interface SelectedMusicCardProps {
    track: DeezerTrack;
    colors: ThemeColors;
    common: any;
    onRemove: () => void;
}

const SelectedMusicCard = memo(({
    track,
    colors,
    common,
    onRemove,
}: SelectedMusicCardProps) => (
    <View style={[createStyles.selectedMusic, { backgroundColor: colors.primaryContainer }]}>
        <Image
            source={{ uri: track.cover_url }}
            style={createStyles.selectedMusicCover}
        />
        <View style={createStyles.selectedMusicInfo}>
            <FlexText style={[common.subheading, createStyles.selectedMusicTitle, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                {track.title}
            </FlexText>
            <FlexText style={[common.caption, createStyles.selectedMusicArtist, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                {track.artist}
            </FlexText>
        </View>
        <TouchableOpacity
            style={[createStyles.removeSelectedMusic, { backgroundColor: colors.error }]}
            onPress={onRemove}
        >
            <Ionicons name="close" size={14} color={colors.onError} />
        </TouchableOpacity>
    </View>
));

SelectedMusicCard.displayName = "SelectedMusicCard";

// ============================================================================
// MusicSection Component
// ============================================================================

interface MusicSectionProps {
    visible: boolean;
    colors: ThemeColors;
    common: any;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    selectedTrack: DeezerTrack | null;
    onSelectTrack: (track: DeezerTrack | null) => void;
    musicResults: DeezerTrack[];
    isLoading: boolean;
}

export const MusicSection = memo(({
    visible,
    colors,
    common,
    searchQuery,
    onSearchQueryChange,
    selectedTrack,
    onSelectTrack,
    musicResults,
    isLoading,
}: MusicSectionProps) => {
    const { t } = useTranslation();

    if (!visible) return null;

    return (
        <View style={createStyles.musicSection}>
            <FlexText style={[common.label, { color: colors.onSurface, marginBottom: 12 }]}>
                {t('create.form.addMusic')}
            </FlexText>

            {selectedTrack && (
                <SelectedMusicCard
                    track={selectedTrack}
                    colors={colors}
                    common={common}
                    onRemove={() => onSelectTrack(null)}
                />
            )}

            <View
                style={[
                    createStyles.musicSearchContainer,
                    { backgroundColor: colors.tertiaryContainer },
                ]}
            >
                <MusicIcon width={24} height={24} color={colors.onTertiaryContainer} />
                <TextInput
                    style={[createStyles.musicSearchInput, common.body, { color: colors.onTertiaryContainer }]}
                    placeholder={t('create.form.searchMusicPlaceholder')}
                    placeholderTextColor={colors.onTertiaryContainer}
                    value={searchQuery}
                    onChangeText={onSearchQueryChange}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchQueryChange("")}>
                        <Ionicons name="close" size={18} color={colors.onTertiaryContainer} />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading && (
                <Spinner size="md" color={colors.primary} style={createStyles.musicLoading} />
            )}

            {musicResults.length > 0 && (
                <FlatList
                    data={musicResults}
                    keyExtractor={(item) => item.deezer_id}
                    renderItem={({ item }) => (
                        <MusicSearchResult
                            track={item}
                            isSelected={selectedTrack?.deezer_id === item.deezer_id}
                            onSelect={() => onSelectTrack(item)}
                            colors={colors}
                            common={common}
                        />
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={createStyles.musicResultsList}
                />
            )}
        </View>
    );
});

MusicSection.displayName = "MusicSection";
