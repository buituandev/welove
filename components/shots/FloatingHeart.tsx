import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { useEffect } from "react";
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface FloatingHeartProps {
    x: number;
    y: number;
    onComplete: () => void;
}

export const FloatingHeart = React.memo(({ x, y, onComplete }: FloatingHeartProps) => {
    const scale = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Pop in
        scale.value = withSequence(
            withSpring(1.2, { damping: 10, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 200 })
        );
        // Float up
        translateY.value = withTiming(-150, { duration: 1000 });
        // Fade out
        opacity.value = withSequence(
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 400 }, (finished) => {
                if (finished) {
                    scheduleOnRN(onComplete);
                }
            })
        );
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: x - 50, // center horizontally (icon size 100)
            top: y - 50,  // center vertically
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: '-15deg' }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Reanimated.View style={[style, { zIndex: 9999 }]} pointerEvents="none">
            <Ionicons name="heart" size={100} color="#ff4d6d" />
        </Reanimated.View>
    );
});
FloatingHeart.displayName = 'FloatingHeart';
