/* eslint-disable react-hooks/immutability */
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";

const SEEK_SECONDS = 5;
const DOUBLE_TAP_DELAY = 280;
// Long-press threshold must be clearly above DOUBLE_TAP_DELAY to avoid conflict
const LONG_PRESS_DELAY = 400;
// Movement threshold in px — if finger moves more than this before long-press
// fires, we cancel the long-press (prevents accidental speed-up on swipe)
const MOVE_CANCEL_THRESHOLD = 15;

// Speed scrubber config
const BASE_SPEED = 2;
const MIN_SPEED = 1.5;
const MAX_SPEED = 3;
const SPEED_STEP = 0.25;
// How many px of horizontal drag = 1× speed change
const PX_PER_SPEED_UNIT = 80;

function snapSpeed(raw: number): number {
    const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, raw));
    return Math.round(clamped / SPEED_STEP) * SPEED_STEP;
}

// ─── Speed Scrub HUD ──────────────────────────────────────────────────────────

const SPEED_STOPS = [1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
const TRACK_WIDTH = 220;

interface SpeedScrubHUDProps {
    animatedStyle: any;
    speedShared: SharedValue<number>;
}

const SpeedScrubHUD: React.FC<SpeedScrubHUDProps> = ({ animatedStyle, speedShared }) => {
    const dotStyle = useAnimatedStyle(() => {
        const pct = (speedShared.value - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
        return {
            transform: [{ translateX: pct * TRACK_WIDTH - 10 }], // 10 = half dot width
        };
    });

    const fillStyle = useAnimatedStyle(() => {
        const pct = (speedShared.value - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
        return { width: pct * TRACK_WIDTH };
    });

    return (
        <Animated.View style={[styles.scrubHUD, animatedStyle]} pointerEvents="none">
            {/* Track */}
            <View style={[styles.scrubTrack, { width: TRACK_WIDTH }]}>
                {/* Filled portion */}
                <Animated.View style={[styles.scrubFill, fillStyle]} />
                {/* Stop ticks */}
                {SPEED_STOPS.map((s) => {
                    const pct = (s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
                    return (
                        <View
                            key={s}
                            style={[styles.scrubTick, { left: pct * TRACK_WIDTH - 1 }]}
                        />
                    );
                })}
                {/* Thumb dot */}
                <Animated.View style={[styles.scrubDot, dotStyle]} />
            </View>

            {/* Range labels */}
            <View style={[styles.scrubRangeRow, { width: TRACK_WIDTH }]}>
                <Text style={styles.scrubRangeLabel}>{MIN_SPEED}×</Text>
                <Text style={styles.scrubRangeLabel}>{MAX_SPEED}×</Text>
            </View>
        </Animated.View>
    );
};

// ─── Tap Indicator (double-tap seek feedback) ─────────────────────────────────

interface TapIndicatorProps {
    direction: "forward" | "backward";
    animatedStyle: any;
}

const TapIndicator: React.FC<TapIndicatorProps> = ({ direction, animatedStyle }) => {
    const { width: screenWidth } = useWindowDimensions();
    const isForward = direction === "forward";
    const chevrons = [0.35, 0.65, 1] as const;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.tapZone,
                { width: screenWidth / 2 },
                isForward ? styles.tapZoneRight : styles.tapZoneLeft,
                animatedStyle,
            ]}
        >
            <View style={[styles.chevronRow, isForward ? null : styles.chevronRowReversed]}>
                {chevrons.map((alpha, i) => (
                    <Ionicons
                        key={i}
                        name={isForward ? "chevron-forward" : "chevron-back"}
                        size={26}
                        color={`rgba(255,255,255,${alpha})`}
                        style={styles.chevron}
                    />
                ))}
            </View>
            <View style={styles.secondsBadge}>
                <Text style={styles.secondsText}>{SEEK_SECONDS} sec</Text>
            </View>
        </Animated.View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// Gesture states to clearly distinguish what is happening
type GestureState = 'idle' | 'pending' | 'long-press' | 'consumed';

interface LongPressSpeedZoneProps {
    onToggleControls: () => void;
    setPlaybackRate: (rate: number) => void;
    onDoubleTap: (direction: "forward" | "backward") => void;
}

export const LongPressSpeedZone: React.FC<LongPressSpeedZoneProps> = ({
    onToggleControls,
    setPlaybackRate,
    onDoubleTap,
}) => {
    'use no memo';
    const { width: screenWidth } = useWindowDimensions();
    // ── Gesture state machine ──
    const gestureStateRef = useRef<GestureState>('idle');

    // ── Long-press / drag refs ──
    const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragAnchorXRef = useRef(0);
    const currentSpeedRef = useRef(BASE_SPEED);
    const touchStartXRef = useRef(0);
    const touchStartYRef = useRef(0);

    // ── Tap detection refs ──
    const tapCountRef = useRef(0);
    const tapPageXRef = useRef(0);
    const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Animated values ──
    const backwardOpacity = useSharedValue(0);
    const forwardOpacity = useSharedValue(0);
    const scrubOpacity = useSharedValue(0);
    const scrubSpeed = useSharedValue(BASE_SPEED);

    const backwardStyle = useAnimatedStyle(() => ({
        opacity: backwardOpacity.value,
        transform: [{ scale: 0.7 + backwardOpacity.value * 0.3 }],
    }));

    const forwardStyle = useAnimatedStyle(() => ({
        opacity: forwardOpacity.value,
        transform: [{ scale: 0.7 + forwardOpacity.value * 0.3 }],
    }));

    const scrubHUDStyle = useAnimatedStyle(() => ({
        opacity: scrubOpacity.value,
        transform: [{ scale: 0.92 + scrubOpacity.value * 0.08 }],
    }));

    // ── Helpers ──
    const flashIndicator = (target: typeof backwardOpacity) => {
        target.value = withSequence(
            withTiming(1, { duration: 80, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 380 }),
            withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
        );
    };

    const cancelDoubleTapTimer = () => {
        if (doubleTapTimeoutRef.current) {
            clearTimeout(doubleTapTimeoutRef.current);
            doubleTapTimeoutRef.current = null;
        }
    };

    const cancelLongPressTimer = () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    };

    const activateLongPress = (anchorX: number) => {
        gestureStateRef.current = 'long-press';
        dragAnchorXRef.current = anchorX;
        currentSpeedRef.current = BASE_SPEED;
        scrubSpeed.value = BASE_SPEED;
        setPlaybackRate(BASE_SPEED);
        // Animate scrub HUD in
        scrubOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
        // Kill any in-flight tap timers — long-press takes priority
        cancelDoubleTapTimer();
        tapCountRef.current = 0;
    };

    const deactivateLongPress = () => {
        gestureStateRef.current = 'consumed';
        setPlaybackRate(1);
        scrubOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
    };


    return (
        <View
            style={StyleSheet.absoluteFill}
            onTouchStart={(e) => {
                const startX = e.nativeEvent.pageX;
                const startY = e.nativeEvent.pageY;
                touchStartXRef.current = startX;
                touchStartYRef.current = startY;
                gestureStateRef.current = 'pending';

                // Start long-press timer
                longPressTimeoutRef.current = setTimeout(() => {
                    if (gestureStateRef.current === 'pending') {
                        activateLongPress(startX);
                    }
                }, LONG_PRESS_DELAY);
            }}
            onTouchMove={(e) => {
                const dx = e.nativeEvent.pageX - touchStartXRef.current;
                const dy = e.nativeEvent.pageY - touchStartYRef.current;

                if (gestureStateRef.current === 'long-press') {
                    // Already in long-press mode — handle speed drag
                    const dragDelta = e.nativeEvent.pageX - dragAnchorXRef.current;
                    const rawSpeed = BASE_SPEED + dragDelta / PX_PER_SPEED_UNIT;
                    const snapped = snapSpeed(rawSpeed);

                    if (snapped !== currentSpeedRef.current) {
                        currentSpeedRef.current = snapped;
                        scrubSpeed.value = withTiming(snapped, { duration: 80 });
                        setPlaybackRate(snapped);
                    }
                } else if (gestureStateRef.current === 'pending') {
                    // If finger moved too far before long-press triggered, cancel it
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > MOVE_CANCEL_THRESHOLD) {
                        cancelLongPressTimer();
                        gestureStateRef.current = 'consumed'; // prevent tap on release
                    }
                }
            }}
            onTouchEnd={(e) => {
                cancelLongPressTimer();

                const state = gestureStateRef.current;

                if (state === 'long-press') {
                    // Long-press ended — restore speed; do NOT treat as tap
                    deactivateLongPress();
                    return;
                }

                if (state === 'consumed') {
                    // Gesture was consumed (e.g. by swipe) — ignore
                    gestureStateRef.current = 'idle';
                    return;
                }

                // ── Tap detection ──
                gestureStateRef.current = 'idle';
                tapCountRef.current += 1;
                tapPageXRef.current = e.nativeEvent.pageX;

                if (tapCountRef.current === 1) {
                    // Start window for a possible second tap
                    doubleTapTimeoutRef.current = setTimeout(() => {
                        tapCountRef.current = 0;
                        onToggleControls();
                    }, DOUBLE_TAP_DELAY);
                } else if (tapCountRef.current === 2) {
                    // Double-tap confirmed
                    cancelDoubleTapTimer();
                    tapCountRef.current = 0;

                    if (tapPageXRef.current < screenWidth / 2) {
                        onDoubleTap("backward");
                        flashIndicator(backwardOpacity);
                    } else {
                        onDoubleTap("forward");
                        flashIndicator(forwardOpacity);
                    }
                } else {
                    // 3rd+ tap: treat as a new first tap
                    cancelDoubleTapTimer();
                    tapCountRef.current = 1;
                    doubleTapTimeoutRef.current = setTimeout(() => {
                        tapCountRef.current = 0;
                        onToggleControls();
                    }, DOUBLE_TAP_DELAY);
                }
            }}
            onTouchCancel={() => {
                const state = gestureStateRef.current;
                cancelLongPressTimer();

                if (state === 'long-press') {
                    deactivateLongPress();
                } else {
                    cancelDoubleTapTimer();
                    tapCountRef.current = 0;
                    setPlaybackRate(1);
                }
                gestureStateRef.current = 'idle';
            }}
        >
            <TapIndicator direction="backward" animatedStyle={backwardStyle} />
            <TapIndicator direction="forward" animatedStyle={forwardStyle} />
            <SpeedScrubHUD animatedStyle={scrubHUDStyle} speedShared={scrubSpeed} />
        </View>
    );
};

const styles = StyleSheet.create({
    // ── Tap indicator ──
    tapZone: {
        position: "absolute",
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    tapZoneLeft: { left: 0 },
    tapZoneRight: { right: 0 },
    chevronRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: -8,
    },
    chevronRowReversed: {
        flexDirection: "row-reverse",
        marginLeft: 0,
        marginRight: -8,
    },
    chevron: { marginHorizontal: -4 },
    secondsBadge: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
    },
    secondsText: {
        color: "white",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    // ── Speed scrub HUD ──
    scrubHUD: {
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: "center",
        gap: 10,
    },
    scrubTrack: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: 3,
        overflow: "visible",
    },
    scrubFill: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 3,
    },
    scrubTick: {
        position: "absolute",
        top: -3,
        width: 2,
        height: 12,
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 1,
    },
    scrubDot: {
        position: "absolute",
        top: -7,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    scrubRangeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    scrubRangeLabel: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        fontWeight: "500",
    },
});
