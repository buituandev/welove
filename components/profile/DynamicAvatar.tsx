import { Image } from 'expo-image';
import React, { useEffect, useRef } from "react";
import { Animated, Easing, ImageStyle, StyleSheet, View } from "react-native";

interface DynamicAvatarProps {
    uri: string;
    threedEmoji?: string | null;
    styles: ImageStyle;
    avatarDuration?: number;
    emojiDuration?: number;
}

const DynamicAvatar: React.FC<DynamicAvatarProps> = ({
    uri,
    threedEmoji,
    styles,
    avatarDuration = 30000,
    emojiDuration = 4000,
}) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const emojiOpacity = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const rotateY = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const startRotation = () => {
        rotateAnim.setValue(0);
        Animated.timing(rotateAnim, {
            toValue: 1,
            duration: emojiDuration - 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        if (!threedEmoji) return;

        const scheduleNext = (currentlyShowingEmoji: boolean) => {
            const waitDuration = currentlyShowingEmoji ? emojiDuration : avatarDuration;

            timeoutRef.current = setTimeout(() => {
                const nextShow = !currentlyShowingEmoji;

                if (nextShow) {
                    startRotation();
                } else {
                    rotateAnim.setValue(0);
                }

                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: nextShow ? 0 : 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(emojiOpacity, {
                        toValue: nextShow ? 1 : 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]).start();

                scheduleNext(nextShow);
            }, waitDuration);
        };

        scheduleNext(false);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [threedEmoji, avatarDuration, emojiDuration]);

    // Simple avatar without 3D emoji
    if (!threedEmoji) {
        return (
            <Image
                source={{ uri }}
                contentFit="cover"
                style={styles}
            />
        );
    }

    // Avatar with 3D emoji crossfade
    return (
        <View style={[styles, localStyles.container]}>
            <Animated.Image
                source={{ uri }}
                resizeMode="cover"
                style={[
                    StyleSheet.absoluteFill,
                    { opacity: fadeAnim, borderRadius: (styles.borderRadius as number) || 0 },
                ]}
            />
            <Animated.Image
                source={{ uri: threedEmoji }}
                resizeMode="cover"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: emojiOpacity,
                        borderRadius: (styles.borderRadius as number) || 0,
                        transform: [
                            { perspective: 1000 },
                            { rotateY: rotateY },
                        ],
                    },
                ]}
            />
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

export default DynamicAvatar;