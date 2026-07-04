import { useThemeContext } from '@/context/ThemeContext';
import { createCommonStyles } from '@/styles/common';
import { Post } from '@/types/post';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';

dayjs.extend(relativeTime);

interface PostMetaInfoProps {
    post: Post;
}

const ITEM_HEIGHT = 20; // Fixed height for a single line of text

const MetaInfoCycler = ({ items, colors, common }: { items: string[], colors: any, common: any }) => {
    // 1. Create a "Carousel" list: [Item A, Item B, Item A]. 
    // The duplicate at the end allows us to loop seamlessly.
    const carouselItems = [...items, items[0]];
    const translateY = useSharedValue(0);

    useEffect(() => {
        // This function manages the animation sequence
        const runSequence = (targetIndex: number) => {
            const nextOffset = -targetIndex * ITEM_HEIGHT;

            // Wait 3s, then slide up to the next item
            translateY.value = withDelay(3000, withSpring(nextOffset, {
                damping: 20,   // Higher damping = less bouncy, more stable
                stiffness: 90, // Softer spring feels more like a ticker
                mass: 1,
            }, (finished) => {
                if (finished) {
                    const isLastItem = targetIndex === carouselItems.length - 1;

                    if (isLastItem) {
                        // HIT THE BOTTOM: We are currently showing the duplicate 'Item A'.
                        // 1. Reset instantly to the real 'Item A' at the top (0px).
                        translateY.value = 0;
                        // 2. Start the loop again, aiming for 'Item B' (index 1).
                        runOnJS(runSequence)(1);
                    } else {
                        // NORMAL STEP: Just move to the next item.
                        runOnJS(runSequence)(targetIndex + 1);
                    }
                }
            }));
        };

        // Start the loop (aiming for index 1)
        runSequence(1);

        return () => cancelAnimation(translateY);
    }, [items]); // Reset if the actual data changes

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <View style={styles.container}>
            {/* SIZER:
               Renders all items invisibly. This forces the parent container 
               to be exactly as wide as the widest text item.
            */}
            <View style={styles.sizer}>
                {items.map((t, i) => (
                    <Animated.Text key={i} style={[common.label, { fontSize: 12, opacity: 0, height: 0 }]}>
                        {t}
                    </Animated.Text>
                ))}
            </View>

            {/* CAROUSEL:
               An absolute view that fills the container. 
               Inside, we have a tall vertical column of text that slides up.
            */}
            <View style={styles.carouselWindow}>
                <Animated.View style={animatedStyle}>
                    {carouselItems.map((item, index) => (
                        <View key={index} style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
                            <Animated.Text
                                style={[common.label, { color: colors.muted, fontSize: 12 }]}
                                numberOfLines={1}
                            >
                                {item}
                            </Animated.Text>
                        </View>
                    ))}
                </Animated.View>
            </View>
        </View>
    );
};

export const PostMetaInfo = ({ post }: PostMetaInfoProps) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const items: string[] = [];

    // 1. Time
    items.push(dayjs(post.created_at).fromNow());

    // 2. Location
    if (post.location) {
        if (typeof post.location === 'string') items.push(post.location);
        else if (post.location.name) items.push(post.location.name);
    }

    // 3. Music
    if (post.music?.title && post.music?.artist) {
        items.push(`${post.music.title} - ${post.music.artist}`);
    }

    if (items.length === 0) return null;

    if (items.length === 1) {
        return (
            <View>
                <Animated.Text style={[common.label, { color: colors.muted, fontSize: 12 }]}>
                    {items[0]}
                </Animated.Text>
            </View>
        );
    }

    return <MetaInfoCycler items={items} colors={colors} common={common} />;
};

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    sizer: {
        // Forces width to match widest content
        flexDirection: 'column',
        height: 0,
        opacity: 0,
    },
    carouselWindow: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'flex-start', // Align to top so translateY works from 0 down
        width: '100%', // Ensures it takes the width reserved by Sizer
    }
});