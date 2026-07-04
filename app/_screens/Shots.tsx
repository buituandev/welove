import { ShotsFeedTab, ShotsTopTabBar } from "@/components/shots";
import {
    ReanimatedTrueSheetProvider,
} from "@lodev09/react-native-true-sheet/reanimated";
import { createMaterialTopTabNavigator } from "expo-router/build/react-navigation/material-top-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Navigator ──────────────────────────────────────────────────────

const Tab = createMaterialTopTabNavigator();

const RandomFeedScreen = () => <ShotsFeedTab feedType="random" />;
const OnThisDayFeedScreen = () => <ShotsFeedTab feedType="on_this_day" />;

const ShotsInner = () => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            initialRouteName="random"
            tabBar={(props: any) => <ShotsTopTabBar {...props} insets={insets} t={t} />}
            screenOptions={{
                sceneStyle: { backgroundColor: '#000' },
            }}
        >
            <Tab.Screen name="on_this_day" component={OnThisDayFeedScreen} />
            <Tab.Screen name="random" component={RandomFeedScreen} />
        </Tab.Navigator>
    );
};

// ─── Main Shots Screen ──────────────────────────────────────────────
// Wrapped with ReanimatedTrueSheetProvider so that useReanimatedTrueSheet()
// inside ShotItem can read animatedPosition from the CommentsSheet.
const ShotsScreen = () => (
    <ReanimatedTrueSheetProvider>
        <ShotsInner />
    </ReanimatedTrueSheetProvider>
);

export default ShotsScreen;
