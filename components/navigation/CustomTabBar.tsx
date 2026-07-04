import HomeIcon from "@/assets/images/svg/homeyt.svg";
import CarouselIcon from "@/assets/images/svg/image-carousel.svg";
import MediaLibraryIcon from "@/assets/images/svg/libyt.svg";
import TvIcon from "@/assets/images/svg/tv-2.svg";
import UserIcon from "@/assets/images/svg/user-1.svg";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { SquircleView } from "expo-squircle-view";
import React, { RefObject, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { useScrollStore } from "../../stores/scroll";

const getOpacityColor = (hexColor: string, opacityHex: string = "22") => {
    if (typeof hexColor === "string" && hexColor.startsWith("#")) {
        if (hexColor.length === 4) {
            const r = hexColor[1];
            const g = hexColor[2];
            const b = hexColor[3];
            return `#${r}${r}${g}${g}${b}${b}${opacityHex}`;
        }
        if (hexColor.length === 7) {
            return `${hexColor}${opacityHex}`;
        }
        if (hexColor.length === 9) {
            return hexColor.slice(0, 7) + opacityHex;
        }
    }
    return hexColor;
};

const Home = ({ size, ...props }: any) => <HomeIcon width={size} height={size} {...props} />;
const MediaLibrary = ({ size, ...props }: any) => <MediaLibraryIcon width={size} height={size} {...props} />;
const Tv = ({ size, ...props }: any) => <TvIcon width={size} height={size} {...props} />;
const User = ({ size, ...props }: any) => <UserIcon width={size} height={size} {...props} />;
const Carousel = ({ size, ...props }: any) => <CarouselIcon width={size} height={size} {...props} />;

type TabName = "index" | "shots" | "tv" | "profile" | "chat";

interface TabConfig {
    name: TabName;
    IconOutlined: any;
    IconSolid: any;
}

// TEMP: add tab names here to hide them from the bar without deleting routes.
const DISABLED_TABS: TabName[] = [];

const tabs: TabConfig[] = [
    {
        name: "index",
        IconOutlined: Home,
        IconSolid: Home,
    },
    {
        name: "shots",
        IconOutlined: MediaLibrary,
        IconSolid: MediaLibrary
    },
    {
        name: "tv",
        IconOutlined: Tv,
        IconSolid: Tv,
    },
    {
        name: "chat",
        IconOutlined: User,
        IconSolid: User,
    },
    {
        name: "profile",
        IconOutlined: Carousel,
        IconSolid: Carousel,
    },
];

const AnimatedTabButton = ({
    route,
    isFocused,
    tabConfig,
    color,
    onPress,
    onLongPress,
    descriptors,
    colors,
    label,
}: {
    route: any;
    isFocused: boolean;
    tabConfig: TabConfig;
    color: string;
    onPress: () => void;
    onLongPress: () => void;
    descriptors: any;
    colors: any;
    label: string;
}) => {
    const scaleAnim = React.useMemo(() => new Animated.Value(isFocused ? 1 : 0.95), [isFocused]);
    const opacityAnim = React.useMemo(() => new Animated.Value(isFocused ? 1 : 0.6), [isFocused]);
    const iconScaleAnim = React.useMemo(() => new Animated.Value(1), []);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isFocused ? 1 : 0.95,
                useNativeDriver: true,
                friction: 7,
                tension: 40,
            }),
            Animated.spring(opacityAnim, {
                toValue: isFocused ? 1 : 0.6,
                useNativeDriver: true,
                friction: 7,
                tension: 40,
            }),
        ]).start();
    }, [isFocused, scaleAnim, opacityAnim]);

    const handlePressIn = () => {
        Animated.spring(iconScaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(iconScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    const Icon = isFocused ? tabConfig.IconSolid : tabConfig.IconOutlined;

    return (
        <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            style={styles.tabBarItem}
            onPress={() => {
                handlePressOut();
                onPress();
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={onLongPress}
            activeOpacity={1}
        >
            <Animated.View
                style={{
                    transform: [{ scale: Animated.multiply(scaleAnim, iconScaleAnim) }],
                    opacity: opacityAnim,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon
                    size={24}
                    color={color}
                    fill={isFocused ? getOpacityColor(color, "33") : "none"}
                />
                {/* <Text
                    style={[
                        styles.tabBarLabel,
                        {
                            color,
                            fontWeight: isFocused ? "bold" : "normal",
                        },
                    ]}
                >
                    {tabConfig.label}
                </Text> */}
            </Animated.View>
        </TouchableOpacity>
    );
};

/**
 * @deprecated Use `CurvedTabBar` from `@/components/navigation/tab-bar` instead.
 */
export const CustomTabBar = ({ state, descriptors, navigation, blurTargetRef }: BottomTabBarProps & { blurTargetRef?: RefObject<View | null> }) => {
    const { colors, theme } = useThemeContext();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const bottomSpacing = 13 + insets.bottom;

    const [layout, setLayout] = React.useState({ width: 0, height: 0 });
    const translateX = React.useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        if (layout.width > 0) {
            const tabWidth = (layout.width - 10) / state.routes.length;
            Animated.spring(translateX, {
                toValue: state.index * tabWidth,
                useNativeDriver: true,
                friction: 8,
                tension: 50,
            }).start();
        }
    }, [state.index, layout.width, state.routes.length, translateX]);

    const tabWidth = layout.width > 0 ? (layout.width - 10) / state.routes.length : 0;

    const { colors: fadeColors, locations: fadeLocations } = easeGradient({
        colorStops: {
            0: {
                color: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255,255,255,0.8)',
            },
            1: {
                color: theme === 'dark' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)',
            },
        },
        extraColorStopsPerTransition: 8,
    });

    return (
        <>
            <LinearGradient
                pointerEvents="none"
                colors={fadeColors as [string, string, ...string[]]}
                locations={fadeLocations as [number, number, ...number[]]}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: bottomSpacing + 55 + 40,
                    zIndex: 0,
                }}
            />
            <SquircleView
                cornerSmoothing={60}
                borderRadius={999}
                style={[
                    styles.tabBarContainer,
                    {
                        marginBottom: bottomSpacing,
                        zIndex: 1,
                        shadowColor: theme === "dark" ? "rgb(111, 137, 158)" : "rgba(0,0,0,0.12)",
                        shadowOpacity: theme === "dark" ? 0.22 : 0.12,
                    },
                ]}
            >
                <View
                    style={[styles.tabBarContent, { backgroundColor: theme === 'dark' ? colors.background + "" : colors.containerContent + "" }]}
                    onLayout={(e) => setLayout(e.nativeEvent.layout)}
                >
                    {/* Animated Pill */}
                    {layout.width > 0 && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                width: tabWidth,
                                height: '100%',
                                left: 5,
                                top: 5,
                                transform: [{ translateX }],
                                zIndex: 0,
                            }}
                        >
                            <SquircleView
                                cornerSmoothing={60}
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.secondaryMuted + "CC",
                                    borderRadius: 999,
                                }}
                            />
                        </Animated.View>
                    )}

                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        // Map route names to tab config
                        const tabConfig = tabs.find((tab) => tab.name === route.name);
                        if (!tabConfig) return null;

                        // TEMP: skip tabs that are temporarily disabled
                        if (DISABLED_TABS.includes(route.name as TabName)) return null;

                        const label =
                            route.name === "index"
                                ? t("navigation.tabs.home")
                                : route.name === "shots"
                                    ? t("navigation.tabs.shots")
                                    : route.name === "chat"
                                        ? t("navigation.tabs.create")
                                        : t("navigation.tabs.profile");

                        const color = isFocused ? colors.secondary : colors.tabInactive;
                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (isFocused) {
                                useScrollStore.getState().triggerScrollToTop(route.name);
                            }

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: "tabLongPress",
                                target: route.key,
                            });
                        };

                        return (
                            <AnimatedTabButton
                                key={route.key}
                                route={route}
                                isFocused={isFocused}
                                tabConfig={tabConfig}
                                label={label}
                                color={color}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                descriptors={descriptors}
                                colors={colors}
                            />
                        );
                    })}
                </View>
            </SquircleView>
        </>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        height: 58,
        position: "absolute",
        marginHorizontal: 20,
        borderTopWidth: 0,
        // shadowColor: "#000",
        // shadowOffset: {
        //     width: 0,
        //     height: 4,
        // },
        // shadowOpacity: 0.12,
        // shadowRadius: 16,
        // elevation: 10,
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBarContent: {
        flex: 1,
        flexDirection: "row",
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: "hidden",
    },
    tabBarItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        gap: 2,
    },
    tabBarLabel: {
        fontSize: 12,
        marginTop: 2,
    },
});