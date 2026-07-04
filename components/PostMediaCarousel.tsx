import PauseIcon from "@/assets/images/svg/pause.svg";
import PlayIcon from "@/assets/images/svg/play.svg";
import SoundMuteIcon from "@/assets/images/svg/sound-mute-1.svg";
import SoundIcon from "@/assets/images/svg/sound.svg";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { useGalleryStore } from "@/stores/gallery";
import { useSettingsStore } from "@/stores/settings";
import { Media } from "@/types/post";
import { buildFallbackUrls, choosenMediaPath } from "@/utils/imageurl";
import { BlueskyVideoView, updateActiveVideoViewAsync } from "@bsky.app/video";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable as RNPressable, Text, useWindowDimensions, View, ViewabilityConfig, ViewToken } from "react-native";
import { FlatList, Pressable } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";


interface PostMediaCarouselProps {
    media: Media[];
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    isAdult?: boolean;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
}

const ASPECT_RATIO = 3 / 4;

// Defined outside component so it's never recreated
const PLACEHOLDER_IMAGE_VIDEO = 'https://placehold.net/3-600x800.png';

// ─── VideoCarouselItem ────────────────────────────────────────────────────────
interface VideoCarouselItemProps {
    item: Media;
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    placeholderImageVideo: string;
    mediaHeight: number;
    screenWidth: number;
}

const VideoCarouselItem = React.memo(({
    item,
    postId,
    profileName,
    content,
    colors,
    placeholderImageVideo,
    mediaHeight,
    screenWidth,
}: VideoCarouselItemProps) => {
    const videoRef = useRef<BlueskyVideoView>(null);
    const isMuted = useFeedVideoStore(s => s.isMuted);
    const disableAutoplay = useSettingsStore(s => s.disableAutoplay);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<'playing' | 'paused' | 'pending'>('pending');
    const [timeRemaining, setTimeRemaining] = useState(0);

    const videoUrl = choosenMediaPath(item);

    const fallbackUrls = useMemo(() => buildFallbackUrls(item, placeholderImageVideo), [item, placeholderImageVideo]);
    const [prev, setPrev] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(item.blurhash, item.id),
        [item.blurhash, item.id],
    );

    const handleThumbnailError = useCallback(() => {
        setPrev(p => (p < fallbackUrls.length - 1 ? p + 1 : p));
    }, [fallbackUrls.length]);

    const handleFullScreenPress = useCallback(() => {
        videoRef.current?.enterFullscreen(true);
    }, []);

    const handleMiddlePress = useCallback(() => {
        if (isPlaying) {
            handleFullScreenPress();
        } else {
            videoRef.current?.togglePlayback();
        }
    }, [isPlaying, handleFullScreenPress]);

    const formattedTime = useMemo(() => {
        if (isNaN(timeRemaining) || timeRemaining < 0) return '0:00';
        const mins = Math.floor(timeRemaining / 60);
        const secs = Math.floor(timeRemaining % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [timeRemaining]);

    if (!isActive && status !== 'pending') {
        setStatus('pending');
    }

    // Whether to show the thumbnail overlay (same logic as Bluesky's InnerWrapper)
    const showOverlay =
        !isActive ||
        isLoading ||
        (status === 'paused' && !isActive) ||
        status === 'pending';

    return (
        <View style={{ width: screenWidth }}>
            <View style={{ width: '100%', aspectRatio: ASPECT_RATIO }}>
                {/* BlueskyVideoView: the native module handles autoplay via
                    updateActiveVideoViewAsync. Each mounted instance registers
                    itself, and the native side activates only the most visible one. */}
                {videoUrl ? (
                    <BlueskyVideoView
                        ref={videoRef}
                        url={videoUrl}
                        autoplay={!disableAutoplay}
                        beginMuted={isMuted}
                        style={{ width: screenWidth, height: mediaHeight, borderRadius: 0 }}
                        onActiveChange={e => {
                            const active = e.nativeEvent.isActive;
                            setIsActive(active);
                            if (active) {
                                useFeedVideoStore.getState().setActiveVideo(postId, item.id, videoUrl);
                            } else if (useFeedVideoStore.getState().activePostId === postId) {
                                useFeedVideoStore.getState().clearActiveVideo();
                            }
                        }}
                        onLoadingChange={e => {
                            setIsLoading(e.nativeEvent.isLoading);
                        }}
                        onMutedChange={e => {
                            useFeedVideoStore.getState().setMuted(e.nativeEvent.isMuted);
                        }}
                        onStatusChange={e => {
                            setStatus(e.nativeEvent.status);
                            setIsPlaying(e.nativeEvent.status === 'playing');
                        }}
                        onTimeRemainingChange={e => {
                            setTimeRemaining(e.nativeEvent.timeRemaining);
                        }}
                        onError={e => {
                            console.warn('[VideoCarousel] Error:', e.nativeEvent.error);
                        }}
                        accessibilityLabel="Video"
                        accessibilityHint=""
                    />
                ) : null}

                {/* Thumbnail overlay: visible when video is not active or loading.
                    Uses display/zIndex pattern from Bluesky to avoid flicker. */}
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'transparent',
                    ...Platform.select({
                        android: {display: showOverlay ? 'flex' : 'none'},
                        ios: {zIndex: showOverlay ? 1 : -1},
                    })
                }}>
                    <ExpoImage
                        source={{ uri: fallbackUrls[prev] }}
                        recyclingKey={fallbackUrls[prev]}
                        style={{ width: screenWidth, height: mediaHeight }}
                        contentFit="cover"
                        onError={handleThumbnailError}
                        placeholder={{ blurhash: placeholderBlurhash }}
                        cachePolicy="memory-disk"
                    />
                    {/* Play button on thumbnail */}
                    <RNPressable
                        onPress={() => videoRef.current?.togglePlayback()}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                        }}
                    >
                        {isActive && isLoading ? (
                            <ActivityIndicator size="large" color="white" />
                        ) : (
                            <View style={{
                                width: 56, height: 56, borderRadius: 28,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <PlayIcon width={32} height={32} color="#ffffff" />
                            </View>
                        )}
                    </RNPressable>
                </View>

                {/* Fullscreen tap zone when video is playing */}
                {/* Controls overlay: visible when video is active and not loading. */}
                {isActive && !isLoading && (
                    <>
                        {/* Fullscreen tap zone */}
                        <RNPressable
                            onPress={handleMiddlePress}
                            style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            }}
                        />
                        {/* Play/Pause Button */}
                        <RNPressable
                            onPress={() => videoRef.current?.togglePlayback()}
                            style={{
                                position: 'absolute',
                                left: 12,
                                bottom: 12,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 10,
                            }}
                        >
                            {isPlaying ? (
                                <PauseIcon width={24} height={24} color="#ffffff" />
                            ) : (
                                <PlayIcon width={24} height={24} color="#ffffff" />
                            )}
                        </RNPressable>
                        {/* Time remaining badge */}
                        <View
                            style={{
                                position: 'absolute',
                                left: 56,
                                bottom: 12,
                                height: 36,
                                paddingHorizontal: 12,
                                borderRadius: 18,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 10,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#ffffff',
                                    fontSize: 12,
                                    fontWeight: '600',
                                    fontVariant: ['tabular-nums'],
                                }}
                            >
                                {formattedTime}
                            </Text>
                        </View>
                        {/* Mute/Unmute Button */}
                        <RNPressable
                            onPress={() => videoRef.current?.toggleMuted()}
                            style={{
                                position: 'absolute',
                                right: 12,
                                bottom: 12,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 10,
                            }}
                        >
                            {isMuted ? (
                                <SoundMuteIcon width={16} height={16} color="#ffffff" />
                            ) : (
                                <SoundIcon width={16} height={16} color="#ffffff" />
                            )}
                        </RNPressable>
                    </>
                )}
            </View>
        </View>
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content,
);
VideoCarouselItem.displayName = "VideoCarouselItem";

// ─── PhotoCarouselItem ────────────────────────────────────────────────────────
interface PhotoCarouselItemProps {
    item: Media;
    photoIndex: number;
    colors: any;
    mediaHeight: number;
    screenWidth: number;
    onPress: () => void;
}

const PhotoCarouselItem = React.memo(({
    item,
    colors,
    mediaHeight,
    screenWidth,
    onPress,
}: PhotoCarouselItemProps) => {
    return (
        <View style={{ width: screenWidth }}>
            <Pressable android_ripple={{ color: colors.divider, foreground: true }} onPress={onPress}>
                <View style={{
                    width: screenWidth,
                    height: mediaHeight,
                    backgroundColor: colors.divider,
                    overflow: 'hidden',
                }}>
                    <ExpoImage
                        source={{ uri: choosenMediaPath(item) }}
                        recyclingKey={choosenMediaPath(item)}
                        contentFit="cover"
                        style={{ width: '100%', height: '100%' }}
                    />
                </View>
            </Pressable>
        </View>
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.photoIndex === next.photoIndex &&
    prev.onPress === next.onPress,
);
PhotoCarouselItem.displayName = "PhotoCarouselItem";

// ─── MediaCarouselItem ────────────────────────────────────────────────────────
interface MediaCarouselItemProps {
    item: Media;
    index: number;
    media: Media[];
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    placeholderImageVideo: string;
    mediaHeight: number;
    screenWidth: number;
    onPhotoPress: (photoIndex: number) => void;
}

const MediaCarouselItem = React.memo(({
    item,
    index,
    media,
    postId,
    profileName,
    content,
    colors,
    placeholderImageVideo,
    mediaHeight,
    screenWidth,
    onPhotoPress,
}: MediaCarouselItemProps) => {
    // Photo index: how many photos came before this slot
    const photoIndex = useMemo(() =>
        media.slice(0, index).filter(m => m.type === 'photo').length,
        [media, index]
    );

    // Stable callback — avoids breaking React.memo on PhotoCarouselItem
    const handlePhotoPress = useCallback(() => {
        onPhotoPress(photoIndex);
    }, [onPhotoPress, photoIndex]);

    if (item.type === 'video') {
        return (
            <VideoCarouselItem
                item={item}
                postId={postId}
                profileName={profileName}
                content={content}
                colors={colors}
                placeholderImageVideo={placeholderImageVideo}
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
            />
        );
    }

    return (
        <PhotoCarouselItem
            item={item}
            photoIndex={photoIndex}
            colors={colors}
            mediaHeight={mediaHeight}
            screenWidth={screenWidth}
            onPress={handlePhotoPress}
        />
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.index === next.index &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.onPhotoPress === next.onPhotoPress,
);
MediaCarouselItem.displayName = "MediaCarouselItem";

// ─── AnimatedMediaWrapper ─────────────────────────────────────────────────────
interface AnimatedMediaWrapperProps {
    pressAnim: SharedValue<number>;
    children: React.ReactNode;
}

const AnimatedMediaWrapper = React.memo(({ pressAnim, children }: AnimatedMediaWrapperProps) => {
    const animStyle = useAnimatedStyle(() => {
        const scale = interpolate(pressAnim.value, [0, 1], [1, 0.9]);
        const borderRadius = interpolate(pressAnim.value, [0, 1], [0, 30]);
        return { transform: [{ scale }], borderRadius };
    }, []);

    return (
        <Animated.View style={[{ flex: 1, overflow: "hidden" }, animStyle]}>
            {children}
        </Animated.View>
    );
});
AnimatedMediaWrapper.displayName = "AnimatedMediaWrapper";

// ─── ClassicMediaCarousel ─────────────────────────────────────────────────────
const ClassicMediaCarousel = React.memo(({
    media, postId, profileName, content, colors,
    isAdult = false, isVerified, musicUrl, musicTitle,
}: PostMediaCarouselProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const mediaHeight = screenWidth / ASPECT_RATIO;
    const pressAnim = useSharedValue<number>(0);
    const pressAnimRef = useRef(pressAnim);
    const isMomentumScrolling = useRef(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const openGallery = useGalleryStore(state => state.openGallery);

    const galleryImages = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => ({
            uri: m.url,
            caption: content,
            profileName,
            isVerified,
            musicUrl,
            musicTitle,
            blurhash: m.blurhash,
        })),
        [media, content, profileName, isVerified, musicUrl, musicTitle]);

    const handlePhotoPress = useCallback((photoIndex: number) => {
        openGallery(galleryImages, photoIndex);
    }, [openGallery, galleryImages]);

    // ── Viewability (stable pair — never recreated) ──────────────────────────
    // With @bsky.app/video, the native module handles video activation.
    // This callback now only tracks the carousel active index for dot indicators.
    const handleViewableItemsChangedImpl = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const idx = viewableItems[0].index ?? 0;
            setActiveIndex(idx);
            currentIndexRef.current = idx;
            // Native autoplay: scan for active video when horizontal slide changes
            updateActiveVideoViewAsync();
        }
    }, []);

    const handleViewableItemsChangedRef = useRef(handleViewableItemsChangedImpl);
    useEffect(() => {
        handleViewableItemsChangedRef.current = handleViewableItemsChangedImpl;
    }, [handleViewableItemsChangedImpl]);

    // Stable pair — created once, never causes the "changing on the fly" warning
    const viewabilityConfigCallbackPairs = useMemo(() => [
        {
            viewabilityConfig: {
                itemVisiblePercentThreshold: 50,
            } as ViewabilityConfig,
            onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
                handleViewableItemsChangedRef.current({ viewableItems });
            },
        },
    ], []);

    // Prefetch all media for this post on first mount
    useEffect(() => {
        if (!media || media.length === 0) return;
        const videoThumbnails = media.filter(m => m.type === 'video' && m.thumbnail_url).map(m => m.thumbnail_url as string);
        const photoUrls = media.filter(m => m.type === 'photo' && m.url).map(m => m.url);
        if (videoThumbnails.length > 0) ExpoImage.prefetch(videoThumbnails);
        if (photoUrls.length > 0) ExpoImage.prefetch(photoUrls);
    }, [media]);

    const keyExtractor = useCallback((item: Media) => item.id, []);

    // renderItem is stable as long as the props it closes over don't change.
    // media identity is stable (useMemo in FeedTab), so this rarely recreates.
    const renderMediaItem = useCallback(({ item, index }: { item: Media; index: number }) => (
        <AnimatedMediaWrapper pressAnim={pressAnim}>
            <MediaCarouselItem
                item={item}
                index={index}
                media={media}
                postId={postId}
                profileName={profileName}
                content={content}
                colors={colors}
                placeholderImageVideo={PLACEHOLDER_IMAGE_VIDEO}
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
                onPhotoPress={handlePhotoPress}
            />
        </AnimatedMediaWrapper>
    ), [pressAnim, media, postId, profileName, content, colors, mediaHeight, screenWidth, handlePhotoPress]);

    if (!media || media.length === 0) return null;

    return (
        <View style={{ marginBottom: 16 }}>
            <FlatList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
                renderItem={renderMediaItem}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                onScrollBeginDrag={() => {
                    isMomentumScrolling.current = false;
                    pressAnimRef.current.value = withTiming(1, { duration: 150 });
                }}
                onScrollEndDrag={() => {
                    if (!isMomentumScrolling.current) {
                        pressAnimRef.current.value = withDelay(1200, withTiming(0, { duration: 400 }));
                    }
                }}
                onMomentumScrollBegin={() => {
                    isMomentumScrolling.current = true;
                }}
                onMomentumScrollEnd={() => {
                    isMomentumScrolling.current = false;
                    pressAnimRef.current.value = withDelay(120, withTiming(0, { duration: 400 }));
                }}
                getItemLayout={(_data, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                })}
            />

            {media.length > 1 && (
                <View style={{ position: 'absolute', bottom: 12, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 }}>
                    {media.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 2,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}, (prev, next) =>
    prev.postId === next.postId &&
    prev.media === next.media &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.isAdult === next.isAdult &&
    prev.isVerified === next.isVerified &&
    prev.musicUrl === next.musicUrl &&
    prev.musicTitle === next.musicTitle,
);
ClassicMediaCarousel.displayName = "ClassicMediaCarousel";

export const PostMediaCarousel = (props: PostMediaCarouselProps) => {
    return <ClassicMediaCarousel {...props} />;
};
