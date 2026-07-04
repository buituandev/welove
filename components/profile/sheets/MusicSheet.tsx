import { FlexText } from '@/components/FlexText';
import { useDeezerSearch, type DeezerTrack } from '@/services/deezer';
import { useAddMusic, useDeleteMusic } from '@/services/music';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Alert,
    FlatList,
    Keyboard,
    Linking,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Image as ExpoImage } from 'expo-image';
import { useThemeContext } from "../../../context/ThemeContext";
import { useAudioStore } from '../../../stores/audio';
import { createCommonStyles } from "../../../styles/common";
import { ProfileMusic } from '../../../types/profilemusic';
import { useSheetBackHandler } from "./useSheetBackHandler";

// ============================================================================
// Props
// ============================================================================

interface MusicSheetProps {
    data: ProfileMusic[];
    profileId?: string;       // Required for add/delete mutations
    isOwner?: boolean;        // Show edit controls only for profile owner
    onEndReached?: () => void;
}

// ============================================================================
// Deezer Search Sheet (stacked on top of MusicSheet)
// ============================================================================

interface AddMusicSheetProps {
    profileId: string;
    onAdded: () => void;
}

const AddMusicSheet = memo(
    forwardRef<TrueSheet, AddMusicSheetProps>(({ profileId, onAdded }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { stopPlayback } = useAudioStore();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        useImperativeHandle(ref, () => ({
            present: (index?: number, animated?: boolean) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;
                return sheetRef.current?.present(index, animated) || Promise.resolve();
            },
            dismiss: (animated?: boolean) => {
                if (!isPresented.current) return Promise.resolve();
                isPresented.current = false;
                return sheetRef.current?.dismiss(animated) || Promise.resolve();
            },
            resize: (index: number) => {
                return sheetRef.current?.resize(index) || Promise.resolve();
            },
            dismissStack: (animated?: boolean) => {
                return sheetRef.current?.dismissStack(animated) || Promise.resolve();
            },
        } as any), []);

        const [query, setQuery] = useState('');
        const [debouncedQuery, setDebouncedQuery] = useState('');
        const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const { data: searchResult, isFetching } = useDeezerSearch(debouncedQuery, 20);
        const tracks = searchResult?.data ?? [];

        const { mutate: addMusic, isPending: isAdding } = useAddMusic(profileId);

        const handleQueryChange = useCallback((text: string) => {
            setQuery(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setDebouncedQuery(text), 400);
        }, []);

        const handleAdd = useCallback((track: DeezerTrack) => {
            Keyboard.dismiss();
            addMusic({ deezer_id: track.deezer_id, trackData: track }, {
                onSuccess: () => {
                    setQuery('');
                    setDebouncedQuery('');
                    onAdded();
                    (ref as any)?.current?.dismiss();
                },
                onError: () => {
                    Alert.alert(t('profile.sheets.music.errorTitle'), t('profile.sheets.music.addError'));
                },
            });
        }, [addMusic, onAdded, ref, t]);

        const listHeader = (
            <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
                {/* Header */}
                <View style={addStyles.headerRow}>
                    <View>
                        <FlexText style={[common.heading, { fontSize: 22 }]}>
                            {t('profile.sheets.music.addTitle')}
                        </FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            {t('profile.sheets.music.addSubtitle')}
                        </FlexText>
                    </View>
                </View>

                {/* Search Bar — Custom Styled TextInput */}
                <View
                    style={[
                        addStyles.searchBar,
                        {
                            backgroundColor:
                                theme === "dark"
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.04)",
                        },
                    ]}
                >
                    <Ionicons name="search" size={18} color={colors.muted} />
                    <TextInput
                        value={query}
                        onChangeText={handleQueryChange}
                        placeholder={t('profile.sheets.music.searchPlaceholder')}
                        placeholderTextColor={colors.muted}
                        style={[addStyles.searchInput, { color: colors.text }]}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleQueryChange("")}>
                            <Ionicons name="close-circle" size={18} color={colors.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Loading Indicator */}
                {isFetching && (
                    <View style={addStyles.loadingRow}>
                        <Spinner color={colors.text} size="lg" />
                    </View>
                )}

                {/* No results */}
                {!isFetching && debouncedQuery.length > 0 && tracks.length === 0 && (
                    <View style={addStyles.emptyState}>
                        <Ionicons name="musical-notes-outline" size={48} color={colors.muted} />
                        <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                            {t('profile.sheets.music.noResults')}
                        </FlexText>
                    </View>
                )}

                {/* Idle — nothing typed yet */}
                {debouncedQuery.length === 0 && (
                    <View style={addStyles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={colors.muted} />
                        <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                            {t('profile.sheets.music.searchHint')}
                        </FlexText>
                    </View>
                )}
            </View>
        );

        const renderItem = useCallback(({ item }: { item: DeezerTrack }) => (
            <View style={{ paddingHorizontal: 24 }}>
                <DeezerTrackItem
                    track={item}
                    colors={colors}
                    common={common}
                    onAdd={handleAdd}
                    isAdding={isAdding}
                />
            </View>
        ), [colors, common, handleAdd, isAdding]);

        return (
            <TrueSheet
                ref={sheetRef}
                scrollable
                detents={[0.92]}
                cornerRadius={32}
                backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                grabberOptions={{ color: colors.muted || '#C4C4C4', height: 5, width: 40 }}
                onDidPresent={() => {
                    isPresented.current = true;
                    backHandler.onDidPresent();
                }}
                onDidDismiss={() => {
                    isPresented.current = false;
                    backHandler.onDidDismiss();
                    stopPlayback();
                    setQuery('');
                    setDebouncedQuery('');
                }}
            >
                <FlatList
                    nestedScrollEnabled
                    data={tracks}
                    keyExtractor={(item) => item.deezer_id}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                />
            </TrueSheet>
        );
    })
);

AddMusicSheet.displayName = 'AddMusicSheet';

// ============================================================================
// Deezer Track Item (search result) — with preview playback
// ============================================================================

const DeezerTrackItem = memo(function DeezerTrackItem({
    track,
    colors,
    common,
    onAdd,
    isAdding,
}: {
    track: DeezerTrack;
    colors: any;
    common: any;
    onAdd: (track: DeezerTrack) => void;
    isAdding: boolean;
}) {
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
    const previewId = `deezer-preview-${track.deezer_id}`;
    const isPlaying = currentlyPlayingId === previewId;

    const handlePreview = useCallback(() => {
        if (!track.preview) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(previewId, track.preview, {
                title: track.title,
                artist: track.artist,
                coverUrl: track.cover_url,
            });
        }
    }, [isPlaying, playTrack, stopPlayback, previewId, track]);

    const handleAdd = useCallback(() => onAdd(track), [onAdd, track]);

    return (
        <View style={styles.card}>
            {/* Album art — tap to preview */}
            <TouchableOpacity
                onPress={handlePreview}
                activeOpacity={0.85}
                disabled={!track.preview}
                style={styles.artworkContainer}
            >
                <ExpoImage
                    source={{ uri: track.cover_url }}
                    style={styles.artwork}
                    contentFit="cover"
                />
                {/* Play/pause overlay */}
                <View style={[StyleSheet.absoluteFill, styles.artworkOverlay]}>
                    <View style={[
                        styles.playIconWrapper,
                        { backgroundColor: isPlaying ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' },
                    ]}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={14}
                            color="#ffffff"
                            style={{ marginLeft: isPlaying ? 0 : 1 }}
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Track info */}
            <View style={styles.textContainer}>
                <FlexText style={[common.heading, { fontSize: 15, marginBottom: 2 }]} numberOfLines={1}>
                    {track.title}
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted }]} numberOfLines={1}>
                    {track.artist}
                </FlexText>
                {isPlaying && (
                    <FlexText style={[common.bodySmall, { color: colors.verify || colors.muted, fontSize: 11, marginTop: 2 }]}>
                        ♪ Previewing...
                    </FlexText>
                )}
            </View>

            {/* Add button */}
            <TouchableOpacity
                onPress={handleAdd}
                disabled={isAdding}
                activeOpacity={0.75}
                style={[addStyles.addButton, { backgroundColor: colors.card, opacity: isAdding ? 0.5 : 1 }]}
            >
                <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
});

DeezerTrackItem.displayName = 'DeezerTrackItem';


// ============================================================================
// Music Item (in main list)
// ============================================================================

const MusicItem = memo(({
    item,
    colors,
    common,
    isOwner,
    onDelete,
}: {
    item: ProfileMusic;
    colors: any;
    common: any;
    isOwner: boolean;
    onDelete?: (id: string) => void;
}) => {
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();

    const trackId = `music-sheet-${item.id}`;
    const isPlaying = currentlyPlayingId === trackId;

    const toggleMusic = useCallback(() => {
        if (!item.preview_url) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(trackId, item.preview_url, {
                title: item.title,
                artist: item.artist,
                coverUrl: item.cover_url,
            });
        }
    }, [item, trackId, isPlaying, playTrack, stopPlayback]);

    const handleOpenLink = useCallback(() => {
        if (item.url) Linking.openURL(item.url);
    }, [item.url]);

    const handleDelete = useCallback(() => {
        onDelete?.(item.id);
    }, [item.id, onDelete]);

    return (
        <TouchableOpacity
            onPress={toggleMusic}
            activeOpacity={0.9}
            style={styles.card}
        >
            {/* Album Art & Play Overlay */}
            <View style={styles.artworkContainer}>
                <ExpoImage
                    source={{ uri: item.cover_url }}
                    style={styles.artwork}
                    contentFit="cover"
                />
                <View style={[StyleSheet.absoluteFill, styles.artworkOverlay]}>
                    <View style={[styles.playIconWrapper, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={16}
                            color="#ffffff"
                            style={{ marginLeft: isPlaying ? 0 : 2 }}
                        />
                    </View>
                </View>
            </View>

            {/* Text Info */}
            <View style={styles.textContainer}>
                <FlexText style={[common.heading, { fontSize: 16, marginBottom: 4 }]} numberOfLines={1}>
                    {item.title}
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted }]} numberOfLines={1}>
                    {item.artist}
                </FlexText>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {item.url && (
                    <TouchableOpacity
                        onPress={handleOpenLink}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.linkButton}
                    >
                        <Ionicons name="open-outline" size={20} color={colors.muted} />
                    </TouchableOpacity>
                )}
                {isOwner && onDelete && (
                    <TouchableOpacity
                        onPress={handleDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
});

MusicItem.displayName = 'MusicItem';

// ============================================================================
// Main MusicSheet
// ============================================================================

export const MusicSheet = memo(forwardRef<TrueSheet, MusicSheetProps>(
    ({ data, profileId, isOwner = false, onEndReached }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const { stopPlayback } = useAudioStore();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        useImperativeHandle(ref, () => ({
            present: (index?: number, animated?: boolean) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;
                return sheetRef.current?.present(index, animated) || Promise.resolve();
            },
            dismiss: (animated?: boolean) => {
                if (!isPresented.current) return Promise.resolve();
                isPresented.current = false;
                return sheetRef.current?.dismiss(animated) || Promise.resolve();
            },
            resize: (index: number) => {
                return sheetRef.current?.resize(index) || Promise.resolve();
            },
            dismissStack: (animated?: boolean) => {
                return sheetRef.current?.dismissStack(animated) || Promise.resolve();
            },
        } as any), []);

        // Ref for the stacked "Add Music" sheet
        const addSheetRef = useRef<TrueSheet>(null);

        const { mutate: deleteMusic } = useDeleteMusic(profileId ?? '');

        const handleDelete = useCallback((musicId: string) => {
            Alert.alert(
                t('profile.sheets.music.deleteTitle'),
                t('profile.sheets.music.deleteMessage'),
                [
                    { text: t('profile.sheets.music.cancel'), style: 'cancel' },
                    {
                        text: t('profile.sheets.music.delete'),
                        style: 'destructive',
                        onPress: () => {
                            stopPlayback();
                            deleteMusic(musicId);
                        },
                    },
                ]
            );
        }, [deleteMusic, stopPlayback, t]);

        const lastAddPresentTime = useRef(0);
        const handleOpenAddSheet = useCallback(() => {
            const now = Date.now();
            if (now - lastAddPresentTime.current < 500) return;
            lastAddPresentTime.current = now;
            addSheetRef.current?.present();
        }, []);

        const handleAdded = useCallback(() => {
            // Sheet dismisses itself; nothing extra needed
        }, []);

        const renderItem = useCallback(({ item }: { item: ProfileMusic }) => (
            <View style={{ paddingHorizontal: 24 }}>
                <MusicItem
                    item={item}
                    colors={colors}
                    common={common}
                    isOwner={isOwner}
                    onDelete={isOwner ? handleDelete : undefined}
                />
            </View>
        ), [colors, common, isOwner, handleDelete]);

        // Safety check early return placed after all hooks!
        if ((!data || data.length === 0) && !isOwner) return null;

        const listHeader = (
            <View style={styles.header}>
                <View>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>
                        {t('profile.sheets.music.title')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.music.subtitle')}
                    </FlexText>
                </View>
                {isOwner && profileId && (
                    <TouchableOpacity
                        onPress={handleOpenAddSheet}
                        style={[styles.addTrackButton, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="add" size={20} color={colors.text} />
                        <FlexText style={[common.bodySmall, { color: colors.text, marginLeft: 4, fontWeight: '600' }]}>
                            {t('profile.sheets.music.addMusic')}
                        </FlexText>
                    </TouchableOpacity>
                )}
            </View>
        );

        return (
            <>
                <TrueSheet
                    ref={sheetRef}
                    scrollable
                    backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                    grabberOptions={{
                        color: colors.muted || '#C4C4C4',
                        height: 5,
                        width: 40,
                    }}
                    cornerRadius={32}
                    detents={[0.7, 1]}
                    onDidPresent={() => {
                        isPresented.current = true;
                        backHandler.onDidPresent();
                    }}
                    onDidDismiss={() => {
                        isPresented.current = false;
                        backHandler.onDidDismiss();
                        stopPlayback();
                    }}
                >
                    <FlatList
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.5}
                        data={data}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={
                            <View style={addStyles.emptyState}>
                                <Ionicons name="musical-notes-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                                    {t('profile.sheets.music.emptyList', 'No tracks added yet')}
                                </FlexText>
                            </View>
                        }
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    />
                </TrueSheet>

                {/* Stacked: Add Music Sheet */}
                {isOwner && profileId && (
                    <AddMusicSheet
                        ref={addSheetRef}
                        profileId={profileId}
                        onAdded={handleAdded}
                    />
                )}
            </>
        );
    }
));

MusicSheet.displayName = 'MusicSheet';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    addTrackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    artworkContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    artworkOverlay: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
        flex: 1,
        justifyContent: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    linkButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
});

const addStyles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingRow: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        height: 44,
        borderRadius: 999,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
});