import PauseIcon from "@/assets/images/svg/pause.svg";
import PlayIcon from "@/assets/images/svg/play.svg";
import SoundMuteIcon from "@/assets/images/svg/sound-mute-1.svg";
import SoundIcon from "@/assets/images/svg/sound.svg";
import { useFeedVideoStore } from '@/stores/feedVideo';
import { BlueskyVideoView } from '@bsky.app/video';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const ASPECT_RATIO = 3 / 4;

/**
 * FeedVideoPlayer — Uses Bluesky's native video component (@bsky.app/video).
 *
 * Unlike the old react-native-video approach, BlueskyVideoView handles:
 *   - Native-level autoplay tied to scroll position (via updateActiveVideoViewAsync)
 *   - HLS streaming with automatic quality adaptation
 *   - Efficient memory management (only one video active at a time, natively)
 *   - Fullscreen transitions
 *
 * The `autoplay` prop + `updateActiveVideoViewAsync` (called from List.tsx on
 * scroll settle) work together: the native module tracks all mounted
 * BlueskyVideoView instances and activates the one most visible on screen.
 */

interface FeedVideoPlayerProps {
    videoUrl: string;
}

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = React.memo(({ videoUrl }) => {
    const { width: screenWidth } = useWindowDimensions();
    const videoHeight = screenWidth / ASPECT_RATIO;
    const isMuted = useFeedVideoStore(s => s.isMuted);
    const setEnded = useFeedVideoStore(s => s.setEnded);
    const videoRef = useRef<BlueskyVideoView>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const handleTogglePlayback = useCallback(() => {
        videoRef.current?.togglePlayback();
    }, []);

    const handleEnterFullscreen = useCallback(() => {
        videoRef.current?.enterFullscreen(true);
    }, []);

    const formattedTime = React.useMemo(() => {
        if (isNaN(timeRemaining) || timeRemaining < 0) return '0:00';
        const mins = Math.floor(timeRemaining / 60);
        const secs = Math.floor(timeRemaining % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [timeRemaining]);

    if (!videoUrl) {
        return null;
    }

    return (
        <View style={[styles.container, { width: screenWidth, height: videoHeight }]}>
            <BlueskyVideoView
                ref={videoRef}
                url={videoUrl}
                autoplay={true}
                beginMuted={isMuted}
                style={styles.video}
                onActiveChange={e => {
                    setIsActive(e.nativeEvent.isActive);
                }}
                onLoadingChange={e => {
                    setIsLoading(e.nativeEvent.isLoading);
                }}
                onMutedChange={e => {
                    useFeedVideoStore.getState().setMuted(e.nativeEvent.isMuted);
                }}
                onStatusChange={e => {
                    setIsPlaying(e.nativeEvent.status === 'playing');
                    if (e.nativeEvent.status === 'paused' && !isActive) {
                        setEnded(true);
                    }
                }}
                onTimeRemainingChange={e => {
                    setTimeRemaining(e.nativeEvent.timeRemaining);
                }}
                onError={e => {
                    console.warn('[FeedVideoPlayer] Error:', e.nativeEvent.error);
                }}
                accessibilityLabel="Video"
                accessibilityHint=""
            />

            {/* Controls overlay: visible when video is active and not loading. */}
            {isActive && !isLoading && (
                <>
                    {/* Fullscreen tap area */}
                    <Pressable
                        onPress={handleEnterFullscreen}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Play/Pause Button */}
                    <Pressable
                        onPress={handleTogglePlayback}
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
                            <PauseIcon width={16} height={16} color="#ffffff" />
                        ) : (
                            <PlayIcon width={16} height={16} color="#ffffff" />
                        )}
                    </Pressable>
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
                    <Pressable
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
                    </Pressable>
                </>
            )}

            {/* Loading spinner overlay — matches Bluesky's pattern */}
            {isActive && isLoading && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}

            {/* Thumbnail overlay when not active (native manages this, but we
                add a play button hint for UX consistency) */}
            {!isActive && (
                <Pressable
                    onPress={handleTogglePlayback}
                    style={styles.inactiveOverlay}
                >
                    <View style={styles.playButton}>
                        <PlayIcon width={28} height={28} color="#ffffff" />
                    </View>
                </Pressable>
            )}
        </View>
    );
});
FeedVideoPlayer.displayName = 'FeedVideoPlayer';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inactiveOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
