import { FlexText } from "@/components/FlexText";
import { useReanimatedTrueSheet } from "@lodev09/react-native-true-sheet/reanimated";
import { MaterialTopTabBarProps } from "expo-router/build/react-navigation/material-top-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

interface ShotsTopTabBarProps extends MaterialTopTabBarProps {
    insets: any;
    t: any;
}

export const ShotsTopTabBar = ({ state, navigation, insets, t }: ShotsTopTabBarProps) => {
    const { height: screenHeight } = useWindowDimensions();
    // Hide the tab bar when comment sheet is open
    const { animatedPosition } = useReanimatedTrueSheet();
    const tabBarStyle = useAnimatedStyle(() => {
        // animatedPosition ≈ SCREEN_HEIGHT when sheet is dismissed, smaller when open
        const isSheetOpen = animatedPosition.value < screenHeight - 10;
        return {
            opacity: isSheetOpen ? 0 : 1,
            pointerEvents: isSheetOpen ? 'none' : 'auto',
        };
    });

    return (
        <Reanimated.View style={[styles.topHeader, { paddingTop: insets.top + 8 }, tabBarStyle]}>
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const title = route.name === 'random' ? t('shots.tabs.following') : t('shots.tabs.thisDay');

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        style={styles.headerTab}
                        onPress={onPress}
                    >
                        <FlexText style={[styles.headerTitle, isFocused ? styles.activeTabTitle : styles.inactiveTabTitle]}>
                            {title}
                        </FlexText>
                        <View style={[styles.activeTabIndicator, !isFocused && { backgroundColor: 'transparent' }]} />
                    </TouchableOpacity>
                );
            })}
        </Reanimated.View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    topHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    headerTab: {
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    activeTabTitle: {
        color: '#fff',
    },
    inactiveTabTitle: {
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabIndicator: {
        width: 24,
        height: 3,
        backgroundColor: '#fff',
        borderRadius: 2,
        marginTop: 6,
    },
});
