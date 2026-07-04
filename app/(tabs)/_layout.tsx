import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { CurvedTabBar } from "../../components/navigation/tab-bar";
import { useSession } from "../../context/SessionContext";

export default function TabLayout() {
    const { session, hasProfile } = useSession();
    const { t } = useTranslation();

    if (!session) {
        return <Redirect href="/login" />;
    }

    if (hasProfile === false) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <Tabs
            tabBar={(props) => <CurvedTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: t('navigation.tabs.home'), animation: 'none' }} />
            <Tabs.Screen name="shots" options={{ title: t('navigation.tabs.shots'), animation: 'none' }} />
            <Tabs.Screen name="tv" options={{ title: 'tvs', animation: 'none' }} />
            <Tabs.Screen
                name="profile"
                options={{ title: t('navigation.tabs.profile'), animation: 'none' }}
                initialParams={{ isMe: true }}
            />
            <Tabs.Screen name="chat" options={{ title: t('navigation.tabs.chat'), animation: 'none' }} />

        </Tabs>
    );
}
