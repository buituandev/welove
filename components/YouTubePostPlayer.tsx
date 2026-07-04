import { useActiveYouTubeStore } from '@/stores/activeYouTube';
import { extractYouTubeIds, youtubeThumbnailUrl } from '@/utils/youtube';
import { PlayerView } from '@flixsrota/player';
import PlayIcon from "@/assets/images/svg/play.svg";
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Pressable,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    useWindowDimensions,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const ASPECT_RATIO = 16 / 9;

const BUNDLE_ID =
    (Constants.expoConfig as any)?.ios?.bundleIdentifier ||
    (Constants.expoConfig as any)?.android?.package ||
    'com.flixsrota.app';

interface YouTubePostPlayerProps {
    postId: string;
    caption?: string;
}

interface YouTubeSlotProps {
    videoId: string;
    slotKey: string;
    isActive: boolean;
    onActivate: () => void;
    screenWidth: number;
    playerHeight: number;
}

const YouTubeSlot: React.FC<YouTubeSlotProps> = React.memo(
    ({ videoId, slotKey: _slotKey, isActive, onActivate, screenWidth, playerHeight }) => {
        if (isActive) {
            return (
                <View style={{ width: screenWidth, height: playerHeight, backgroundColor: '#000' }}>
                    <PlayerView bundleId={BUNDLE_ID} videoId={videoId} />
                </View>
            );
        }

        return (
            <Pressable
                onPress={onActivate}
                style={{
                    width: screenWidth,
                    height: playerHeight,
                    backgroundColor: '#000',
                }}
            >
                <Image
                    source={{ uri: youtubeThumbnailUrl(videoId) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={120}
                />
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                    }}
                >
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <PlayIcon width={32} height={32} color="#ffffff" />
                    </View>
                </View>
            </Pressable>
        );
    }
);
YouTubeSlot.displayName = 'YouTubeSlot';

export const YouTubePostPlayer: React.FC<YouTubePostPlayerProps> = ({ postId, caption }) => {
    const { width: screenWidth } = useWindowDimensions();
    const playerHeight = screenWidth / ASPECT_RATIO;
    const videoIds = useMemo(() => extractYouTubeIds(caption), [caption]);
    const activeKey = useActiveYouTubeStore((s) => s.activeKey);
    const setActive = useActiveYouTubeStore((s) => s.setActive);

    const [pageIndex, setPageIndex] = useState(0);
    const listRef = useRef<FlatList<string>>(null);

    const makeKey = useCallback((index: number) => `${postId}:${index}`, [postId]);

    const handleMomentumEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            if (idx !== pageIndex) {
                setPageIndex(idx);
                // Swiping to a different video should stop any currently-playing
                // player on this post so only the visible slot can be activated.
                if (activeKey && activeKey.startsWith(`${postId}:`) && activeKey !== makeKey(idx)) {
                    setActive(null);
                }
            }
        },
        [pageIndex, activeKey, postId, makeKey, setActive, screenWidth]
    );

    const renderItem = useCallback(
        ({ item, index }: { item: string; index: number }) => {
            const slotKey = makeKey(index);
            return (
                <YouTubeSlot
                    videoId={item}
                    slotKey={slotKey}
                    isActive={activeKey === slotKey}
                    onActivate={() => setActive(slotKey)}
                    screenWidth={screenWidth}
                    playerHeight={playerHeight}
                />
            );
        },
        [activeKey, makeKey, setActive, screenWidth, playerHeight]
    );

    const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, []);

    if (videoIds.length === 0) return null;

    if (videoIds.length === 1) {
        const slotKey = makeKey(0);
        return (
            <View style={{ marginBottom: 12 }}>
                <YouTubeSlot
                    videoId={videoIds[0]}
                    slotKey={slotKey}
                    isActive={activeKey === slotKey}
                    onActivate={() => setActive(slotKey)}
                    screenWidth={screenWidth}
                    playerHeight={playerHeight}
                />
            </View>
        );
    }

    return (
        <View style={{ marginBottom: 12 }}>
            <FlatList
                ref={listRef}
                data={videoIds}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onMomentumScrollEnd={handleMomentumEnd}
                getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                })}
            />
            <View
                style={{
                    position: 'absolute',
                    bottom: 10,
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'center',
                    gap: 6,
                }}
                pointerEvents="none"
            >
                {videoIds.map((_, i) => (
                    <View
                        key={i}
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: i === pageIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                        }}
                    />
                ))}
            </View>
        </View>
    );
};

YouTubePostPlayer.displayName = 'YouTubePostPlayer';
