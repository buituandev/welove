import ShareIcon from "@/assets/images/svg/share-1.svg";
import CommentsIcon from "@/assets/images/svg/tips.svg";
import { FlexText } from "@/components/FlexText";
import { getCachedUri } from "@/services/videoCache";
import { VideoItem } from "@/types/video";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useEventListener } from "expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Avatar } from "heroui-native/avatar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AppState,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View
} from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { FloatingHeart } from "./FloatingHeart";
import { ShotSeekBar } from "./ShotSeekBar";

// ─── Props ──────────────────────────────────────────────────────────
export interface ShotItemProps {
    item: VideoItem;
    isActive: boolean;
    shouldPreload: boolean;
    isFocused: boolean;
    itemHeight: number;
    isPaused: boolean;
    isLiked: boolean;
    likeCount: number;
    onLikePress: () => void;
    onCommentPress: () => void;
    onSeekingChange?: (seeking: boolean) => void;
    colors: any;
    insets: any;
    isCommentsOpen: boolean;
}

// ─── Component ──────────────────────────────────────────────────────
export const ShotItem = React.memo(function ShotItem({
    item,
    isActive,
    shouldPreload,
    isFocused,
    itemHeight,
    isPaused: externalPaused,
    isLiked,
    likeCount,
    onLikePress,
    onCommentPress,
    onSeekingChange,
    colors,
    insets,
    isCommentsOpen,
}: ShotItemProps) {
    const { width: screenWidth } = useWindowDimensions();
    // ─── Per-item URI resolution ─────────────────────────────────
    const [resolvedUri, setResolvedUri] = useState(item.media_url);

    useEffect(() => {
        let cancelled = false;
        getCachedUri(item.media_url).then(uri => {
            if (!cancelled) setResolvedUri(uri);
        });
        return () => { cancelled = true; };
    }, [item.media_url]);

    // ─── Local user-paused state (reference pattern: per-item toggle) ──
    const [userPaused, setUserPaused] = useState(false);

    // ─── Thumbnail placeholder visibility state ───────────────────
    const [readyToDisplay, setReadyToDisplay] = useState(false);

    const placeholderOpacity = useSharedValue(1);
    const placeholderStyle = useAnimatedStyle(() => {
        return {
            opacity: placeholderOpacity.value,
        };
    });

    useEffect(() => {
        placeholderOpacity.value = withTiming(readyToDisplay ? 0 : 1, { duration: 250 });
    }, [readyToDisplay, placeholderOpacity]);

    const isActiveRef = useRef(isActive);
    isActiveRef.current = isActive;

    const userPausedRef = useRef(userPaused);
    userPausedRef.current = userPaused;

    const externalPausedRef = useRef(externalPaused);
    externalPausedRef.current = externalPaused;

    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;

    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sourceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



    // ─── Player setup ──────
    const player = useVideoPlayer(resolvedUri || null, (p) => {
        p.loop = true;
        p.muted = true; // Always start muted; mute state applied via effect
        // 4 updates/sec is more than enough for the seek bar — 0.05 (20/sec)
        // was flooding the JS thread with events across multiple concurrent players,
        // contributing to ANR when the user navigated to the VideoPlayer screen.
        p.timeUpdateEventInterval = 0.25;
    });

    const playerRef = useRef(player);

    useEffect(() => {
        setReadyToDisplay(false);
    }, [resolvedUri, player]);

    // Pause & mute when the player instance changes or the component unmounts.
    // NOTE: do NOT call player.release() here — useVideoPlayer already releases
    // the previous player when the source changes or on unmount. Calling release()
    // ourselves causes ERR_USING_RELEASED_SHARED_OBJECT when our cleanup effect
    // runs after useVideoPlayer has already freed the native object.
    useEffect(() => {
        return () => {
            if (player) {
                try {
                    if (player.muted !== true) player.muted = true;
                    if (player.playing) player.pause();
                } catch { /* player already released by useVideoPlayer — ignore */ }
            }
        };
    }, [player]);


    // ─── Immediately pause & mute when screen loses focus ─────────────────
    // This fires as soon as the user navigates away (e.g. to VideoPlayer), ensuring
    // no reel keeps playing or emitting timeUpdate events in the background.
    useEffect(() => {
        if (!isFocused && player) {
            // Cancel any pending play-delay timeout
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
                playTimeoutRef.current = null;
            }
            try {
                if (player.muted !== true) player.muted = true;
                if (player.playing) player.pause();
            } catch { }
        }
    }, [isFocused, player]);

    // ─── Track currently loaded URI ──────────────────────────────────────
    const loadedUriRef = useRef<string | null>(null);

    // ─── Source management & preloading ──────────────────────────────────
    useEffect(() => {
        if (!player) return;

        if (sourceTimeoutRef.current) {
            clearTimeout(sourceTimeoutRef.current);
            sourceTimeoutRef.current = null;
        }

        const currentUri = loadedUriRef.current;

        if (shouldPreload || isActive) {
            if (!currentUri || currentUri !== resolvedUri) {
                // Debounce source replacement by 100ms
                sourceTimeoutRef.current = setTimeout(() => {
                    player
                        .replaceAsync(resolvedUri)
                        .then(() => {
                            loadedUriRef.current = resolvedUri;
                        })
                        .catch(() => { });
                }, 100);
            }
        }

        return () => {
            if (sourceTimeoutRef.current) {
                clearTimeout(sourceTimeoutRef.current);
                sourceTimeoutRef.current = null;
            }
        };
    }, [shouldPreload, isActive, player, resolvedUri]);

    // ─── Active-state management ──────────────────────────────────────────
    const wasActiveRef = useRef(isActive);
    const videoIdRef = useRef(item.id);

    useEffect(() => {
        if (!player) return;

        const wasActive = wasActiveRef.current;
        wasActiveRef.current = isActive;

        const playerChanged = player !== playerRef.current;
        if (playerChanged) {
            playerRef.current = player;
        }

        const videoChanged = item.id !== videoIdRef.current;
        if (videoChanged) {
            videoIdRef.current = item.id;
        }

        // Clear any existing play timeout
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }

        const becameActive = (isActive && !wasActive) || playerChanged || videoChanged;

        if (becameActive) {
            // Clear user-pause when a new video becomes active
            setUserPaused(false);
        }

        // Compute overall shouldPlay for this render
        const appState = AppState.currentState;
        const shouldPlay = isActive && !userPaused && !externalPaused && appState === "active" && isFocused;

        if (shouldPlay) {
            // Delay play/unmute by 150ms during active transitions to prevent lag during fast swiping
            const delay = (isActive && !wasActive) ? 150 : 0;

            const startPlayback = () => {
                if (player.status === "readyToPlay") {
                    if (player.muted !== false) player.muted = false;
                    if (!player.playing) {
                        player.play();
                    }
                } else {
                    // Not yet ready — seek to start so it plays from 0 when buffer arrives
                    if (!player.playing && player.currentTime < 0.1) {
                        player.currentTime = 0;
                    }
                }
            };

            if (delay > 0) {
                playTimeoutRef.current = setTimeout(() => {
                    startPlayback();
                    playTimeoutRef.current = null;
                }, delay);
            } else {
                startPlayback();
            }
        } else {
            // Immediately mute and pause
            if (player.muted !== true) player.muted = true;
            if (player.playing) {
                player.pause();
            }
            if (shouldPreload && !isActive && !userPaused) {
                player.currentTime = 0;
            }
        }

        return () => {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
                playTimeoutRef.current = null;
            }
        };
    }, [isActive, userPaused, externalPaused, player, shouldPreload, item.id, isFocused, isCommentsOpen]);

    // ─── AppState listener ────────────────────────────────────────────────
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) => {
            if (!player) return;
            const currentIsActive = isActiveRef.current;
            const currentUserPaused = userPausedRef.current;
            const currentExternalPaused = externalPausedRef.current;
            const currentIsFocused = isFocusedRef.current;

            if (currentIsActive && state === "active" && !currentUserPaused && !currentExternalPaused && currentIsFocused) {
                if (player.muted !== false) player.muted = false;
                player.play();
            } else {
                if (player.muted !== true) player.muted = true;
                player.pause();
            }
        });
        return () => subscription.remove();
    }, [player]);

    // ─── Auto-play when readyToPlay fires ────────────────────────────────
    const handleStatusChange = useCallback(() => {
        const currentIsActive = isActiveRef.current;
        const currentUserPaused = userPausedRef.current;
        const currentExternalPaused = externalPausedRef.current;
        const currentIsFocused = isFocusedRef.current;

        const shouldPlay = currentIsActive && !currentUserPaused && !currentExternalPaused && AppState.currentState === "active" && currentIsFocused;

        if (shouldPlay && player.status === "readyToPlay") {
            if (player.muted !== false) player.muted = false;
            if (!player.playing) {
                player.play();
            }
        }
    }, [player]);

    useEventListener(player, "statusChange", ({ status }) => {
        if (status === "readyToPlay") {
            setReadyToDisplay(true);
        }
        handleStatusChange();
    });

    useEventListener(player, "volumeChange", () => {
        // console.log(`[Volume/Mute changed: player.muted = ${player.muted}`);
    });

    // ─── Progress tracking ────────────────────────────────────────────────
    const [progress, setProgress] = useState(0);

    const handleProgress = useCallback(() => {
        if (!isActiveRef.current) return;
        const dur = player.duration;
        const cur = player.currentTime;
        if (dur > 0 && Number.isFinite(cur)) {
            setProgress(Math.min(1, Math.max(0, cur / dur)));
        }
    }, [player]);

    useEventListener(player, "timeUpdate", handleProgress);

    const handleSeek = useCallback(
        (p: number) => {
            if (!isActive || !player) return;
            const dur = player.duration;
            if (dur > 0 && Number.isFinite(dur)) {
                const t = Math.max(0, Math.min(1, p)) * dur;
                player.currentTime = t;
            }
        },
        [isActive, player],
    );

    const duration = useMemo(
        () => player?.duration ?? 0,
        [player?.duration],
    );

    // ─── Double-tap to like / single-tap to pause ─────────────────────────
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
    const lastTapTime = useRef(0);
    const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleVideoPress = (e: any) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
        }

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Double tap — like
            if (!isLiked) {
                onLikePress();
            }
            const { locationX, locationY } = e.nativeEvent;
            setHearts(prev => [...prev, { id: now + Math.random(), x: locationX, y: locationY }]);
            lastTapTime.current = now;
        } else {
            lastTapTime.current = now;
            singleTapTimer.current = setTimeout(() => {
                setUserPaused(prev => !prev);
                singleTapTimer.current = null;
            }, DOUBLE_TAP_DELAY);
        }
    };

    const removeHeart = useCallback((id: number) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    }, []);

    return (
        <View style={[styles.itemContainer, { height: itemHeight, width: screenWidth }]}>
            {/* Video area — covers full cell height (no shrink on comments open) */}
            <View style={[styles.videoArea, { height: itemHeight, width: screenWidth }]}>
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    nativeControls={false}
                    onFirstFrameRender={() => {
                        setReadyToDisplay(true);
                    }}
                />

                {/* Gray Placeholder: displayed until first video frame is ready to render */}
                <Reanimated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: '#1C1C1E' },
                        placeholderStyle
                    ]}
                    pointerEvents="none"
                />
            </View>

            {/* Tap layer — covers full item for pause/like */}
            <TouchableWithoutFeedback onPress={handleVideoPress}>
                <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>

            {/* Floating hearts */}
            {hearts.map(heart => (
                <FloatingHeart
                    key={heart.id}
                    x={heart.x}
                    y={heart.y}
                    onComplete={() => removeHeart(heart.id)}
                />
            ))}

            {/* Paused indicator */}
            {(userPaused || externalPaused) && isActive && (
                <View style={styles.pausedOverlay} pointerEvents="none">
                    <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
                </View>
            )}

            {/* Seek bar — only rendered for active item (matches reference) */}
            {isActive && (
                <ShotSeekBar
                    progress={progress}
                    duration={duration}
                    onSeek={handleSeek}
                    onSeekingChange={onSeekingChange}
                    bottom={insets.bottom + 95}
                />
            )}

            {/* Bottom info — username & caption */}
            <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 130 }]} pointerEvents="box-none">
                <TouchableOpacity
                    onPress={() => router.push(`/profile/${item.profile_id}`)}
                    style={styles.profileRow}
                >
                    {item.profile_avatar && (
                        <Avatar style={styles.avatar}>
                            <Avatar.Image source={{ uri: item.profile_avatar }}></Avatar.Image>
                            <Avatar.Fallback>{item?.profile_name?.[0] || 'U'}</Avatar.Fallback>
                        </Avatar>
                    )}
                    <FlexText style={styles.profileName}>{item.profile_name}</FlexText>
                </TouchableOpacity>
                {item.caption && (
                    <FlexText style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </FlexText>
                )}
            </View>

            {/* Right side actions */}
            <View style={[styles.rightActions, { bottom: insets.bottom + 140 }]}>
                {/* Like */}
                <TouchableOpacity style={styles.actionButton} onPress={onLikePress} hitSlop={10}>
                    {isLiked
                        ? <Image source={require('@/assets/images/svg/like11.png')} style={{ width: 36, height: 36 }} contentFit="cover" />
                        : <Image source={require('@/assets/images/svg/like10.png')} style={{ width: 36, height: 36 }} contentFit="cover" />
                    }
                    <FlexText style={[styles.actionText, isLiked && { color: 'white' }]}>
                        {likeCount > 0 ? likeCount : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Comments */}
                <TouchableOpacity style={styles.actionButton} onPress={onCommentPress} hitSlop={10}>
                    <CommentsIcon width={32} height={32} color="white" />
                    <FlexText style={styles.actionText}>
                        {item.comment_count > 0 ? item.comment_count : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity style={styles.actionButton}>
                    <ShareIcon width={32} height={32} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.shouldPreload === nextProps.shouldPreload &&
        prevProps.isPaused === nextProps.isPaused &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.itemHeight === nextProps.itemHeight &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.comment_count === nextProps.item.comment_count &&
        prevProps.isLiked === nextProps.isLiked &&
        prevProps.likeCount === nextProps.likeCount &&
        prevProps.isCommentsOpen === nextProps.isCommentsOpen
    );
});

ShotItem.displayName = 'ShotItem';

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: '#000',
        overflow: "hidden",
    },
    videoArea: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContent: {
        height: '100%',
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 70,
        paddingHorizontal: 16,
        zIndex: 1000,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        marginRight: 10,
    },
    profileName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    caption: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        lineHeight: 18,
    },
    rightActions: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        marginTop: 2,
        fontWeight: '600',
    },
});
