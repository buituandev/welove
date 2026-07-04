import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { CgvMovie } from '@/types/cgv';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import dayjs from "dayjs";
import { Image } from "expo-image";
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, memo, useCallback } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NitroInAppBrowser from 'react-native-nitro-in-app-browser';
import { createCommonStyles } from "../../../styles/common";
import { useSheetBackHandler } from "../../profile/sheets/useSheetBackHandler";

const getRatingColor = (code?: string) => {
    const c = code?.toUpperCase();
    if (c === "P") return "#4CAF50"; // Green
    if (c === "K") return "#2196F3"; // Blue
    if (c === "T13" || c === "13") return "#FF9800"; // Orange
    if (c === "T16" || c === "16") return "#E91E63"; // Pink/Purple
    if (c === "T18" || c === "18") return "#F44336"; // Red
    return "#9E9E9E"; // Grey
};

const CGV_BRAND_COLOR = "#ee2e26";

const getRatingDescription = (code?: string): string => {
    const c = code?.trim().toUpperCase();

    switch (c) {
        case "P":
            return "P - Phim được phép phổ biến đến người xem ở mọi độ tuổi.";
        case "K":
            return "K - Phim được phổ biến đến người xem dưới 13 tuổi với điều kiện xem cùng cha, mẹ hoặc người giám hộ.";
        case "T13":
            return "T13 - Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên.";
        case "T16":
            return "T16 - Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên.";
        case "T18":
            return "T18 - Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên.";
        case "C":
            return "C - Phim không được phép phổ biến.";
        default:
            return "Chưa phân loại độ tuổi.";
    }
};


interface CgvDetailSheetProps {
    movie: CgvMovie | null;
}

export const CgvDetailSheet = memo(forwardRef<TrueSheet, CgvDetailSheetProps>(({ movie }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const backHandler = useSheetBackHandler(ref);

    const handleWatchTrailer = useCallback(async () => {
        if (movie?.movie_trailer) {
            try {
                await NitroInAppBrowser.open(movie.movie_trailer, {
                    barColor: '#000000',
                    controlColor: '#ffffff',
                    presentationStyle: 'fullScreen',
                });
            } catch (error) {
                console.error("Failed to open trailer:", error);
            }
        }
    }, [movie?.movie_trailer]);

    const handleBookTickets = useCallback(async () => {
        if (Platform.OS === 'android') {
            try {
                await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
                    category: 'android.intent.category.LAUNCHER',
                    packageName: 'com.cgv.cinema.vn',
                });
                return;
            } catch (error) {
                console.log("CGV App not installed or failed to launch, opening browser:", error);
            }
        }

        try {
            await NitroInAppBrowser.open("https://www.cgv.vn/", {
                barColor: CGV_BRAND_COLOR,
                controlColor: '#ffffff',
                presentationStyle: 'fullScreen',
            });
        } catch (error) {
            console.error("Failed to open CGV booking site:", error);
        }
    }, []);

    if (!movie) return null;

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={colors.surfaceContainerLow}
            grabberOptions={{
                color: colors.onSurfaceVariant,
            }}
            cornerRadius={36}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1 }}>
                <ScrollView
                    nestedScrollEnabled
                    contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Banner & Blurred Background effect */}
                    <View style={{ position: 'relative', width: '100%', height: 260, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Background blurred cover */}
                        <Image
                            source={{ uri: movie.thumbnail }}
                            style={{ ...StyleSheet.absoluteFill, opacity: 0.15 }}
                            blurRadius={0}
                            contentFit="cover"
                        />
                        <LinearGradient
                            colors={['transparent', colors.surfaceContainerLow]}
                            style={StyleSheet.absoluteFill}
                        />
                        <Image
                            source={{ uri: movie.thumbnail }}
                            style={{
                                width: 160,
                                height: 240,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.outline,
                                marginTop: 40
                            }}
                            contentFit="cover"
                        />
                    </View>

                    {/* Movie Info */}
                    <View style={{ paddingHorizontal: 16, gap: 16 }}>
                        <View>
                            <FlexText style={[common.heading, { fontSize: 24, textAlign: 'center' }]}>
                                {movie.name}
                            </FlexText>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
                                {movie.movie_genre}
                            </FlexText>
                        </View>

                        {/* Inline Metadata Row */}
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap", marginVertical: 4 }}>
                            {movie.codes && (
                                <View style={{ backgroundColor: theme === 'dark' ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <FlexText style={{ color: colors.onSurface, fontSize: 12, fontWeight: "600" }}>
                                        {movie.codes}
                                    </FlexText>
                                </View>
                            )}
                            {movie.movie_endtime > 0 && (
                                <>
                                    {movie.codes && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.muted || "rgba(255,255,255,0.3)" }} />}
                                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, fontFamily: 'GoogleSansFlexRegular' }}>
                                        {movie.movie_endtime} phút
                                    </Text>
                                </>
                            )}
                            {movie.release_date && (
                                <>
                                    {(movie.codes || movie.movie_endtime > 0) && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.muted || "rgba(255,255,255,0.3)" }} />}
                                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, fontFamily: 'GoogleSansFlexRegular' }}>
                                        Khởi chiếu {dayjs(movie.release_date).format("DD/MM/YYYY")}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Rating Age Disclaimer */}
                        {movie.rating_code && (
                            <View style={{ flexDirection: "row", backgroundColor: colors.surfaceContainerHigh, padding: 12, borderRadius: 12, gap: 12, alignItems: 'center' }}>
                                <View style={{
                                    backgroundColor: getRatingColor(movie.rating_code),
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 6,
                                }}>
                                    <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>
                                        {movie.rating_code.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={{ color: colors.onSurface, fontSize: 13, flex: 1, lineHeight: 18, fontFamily: 'GoogleSansFlexRegular' }}>
                                    {getRatingDescription(movie.rating_code)}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={{ gap: 12, marginTop: 12 }}>
                            {movie.movie_trailer && (
                                <TouchableOpacity
                                    onPress={handleWatchTrailer}
                                    style={{
                                        backgroundColor: CGV_BRAND_COLOR,
                                        flexDirection: 'row',
                                        height: 52,
                                        borderRadius: 26,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <Ionicons name="play-circle" size={24} color="white" />
                                    <FlexText style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                                        Xem Trailer
                                    </FlexText>
                                </TouchableOpacity>
                            )}

                            {movie.is_booking && (
                                <TouchableOpacity
                                    onPress={handleBookTickets}
                                    style={{
                                        backgroundColor: colors.secondaryContainer,
                                        flexDirection: 'row',
                                        height: 52,
                                        borderRadius: 26,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <Ionicons name="ticket-outline" size={22} color={colors.onSecondary} />
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <FlexText style={{ color: colors.onSecondary, fontSize: 16, fontWeight: '700' }}>
                                            Đặt Vé Ngay
                                        </FlexText>
                                        <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/CGV_logo.svg/960px-CGV_logo.svg.png' }}
                                            style={{
                                                aspectRatio: 8 / 5,
                                                height: 24,
                                            }}
                                            contentFit="contain"
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </TrueSheet>
    );
}));

CgvDetailSheet.displayName = "CgvDetailSheet";
