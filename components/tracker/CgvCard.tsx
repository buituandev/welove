import { FlexText } from "@/components/FlexText";
import { CgvMovie } from "@/types/cgv";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import dayjs from "dayjs";
import { Image } from "expo-image";

const CARD_WIDTH = 140;

const getRatingColor = (code?: string) => {
    const c = code?.toUpperCase();
    if (c === "P") return "#4CAF50"; // Green
    if (c === "K") return "#2196F3"; // Blue
    if (c === "T13" || c === "13") return "#FF9800"; // Orange
    if (c === "T16" || c === "16") return "#E91E63"; // Pink/Purple
    if (c === "T18" || c === "18") return "#F44336"; // Red
    return "#9E9E9E"; // Grey
};

const getDaysLeft = (releaseDateStr: string | null) => {
    if (!releaseDateStr) return null;
    const releaseDate = dayjs(releaseDateStr);
    const today = dayjs().startOf('day');
    const diff = releaseDate.diff(today, 'day');
    return diff;
};

interface CgvCardProps {
    movie: CgvMovie;
    isUpcoming: boolean;
    onPress: (movie: CgvMovie) => void;
    style?: any;
    showCategory?: boolean;
}

export const CgvCard = React.memo(({ movie, isUpcoming, onPress, style, showCategory }: CgvCardProps) => {
    const daysLeft = isUpcoming ? getDaysLeft(movie.release_date) : null;

    const handlePress = useCallback(() => {
        onPress(movie);
    }, [movie, onPress]);

    return (
        <GesturePressable
            onPress={handlePress}
            style={[{ width: CARD_WIDTH, marginRight: 12, overflow: "hidden", position: "relative" }, style]}
        >
            <View style={{ width: "100%", borderRadius: 16, overflow: "hidden", position: "relative" }}>
                <Image
                    source={{ uri: movie.thumbnail }}
                    style={{
                        width: "100%",
                        aspectRatio: 2 / 3,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: "rgba(132,132,132,0.34)",
                    }}
                    contentFit="cover"
                />
                
                {/* Rating Badge Overlay */}
                {movie.rating_code && movie.rating_code !== "No" && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        backgroundColor: getRatingColor(movie.rating_code),
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        zIndex: 10,
                    }}>
                        <Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>
                            {movie.rating_code.toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Days Left Badge Overlay (Upcoming only) */}
                {daysLeft !== null && daysLeft > 0 && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        zIndex: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.25)",
                    }}>
                        <Text style={{ color: "#FFD700", fontSize: 10, fontWeight: "700" }}>
                            Còn {daysLeft} ngày
                        </Text>
                    </View>
                )}

                {/* Category Overlay Badge */}
                {showCategory && (
                    <View style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: isUpcoming ? '#ff9800' : '#ee2e26',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        zIndex: 10,
                    }}>
                        <FlexText style={{ color: 'white', fontSize: 8, fontWeight: '700' }}>
                            {isUpcoming ? 'Sắp Chiếu' : 'Đang Chiếu'}
                        </FlexText>
                    </View>
                )}
            </View>

            <FlexText
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.textStyle, { color: "white", width: "100%", flexShrink: 1, marginBottom: 4, marginTop: 4 }]}
            >
                {movie.name}
            </FlexText>

            <FlexText
                numberOfLines={1}
                style={[styles.textStyle, { color: "rgba(255,255,255,0.5)", fontSize: 12 }]}
            >
                {movie.movie_genre}
            </FlexText>
        </GesturePressable>
    );
});

CgvCard.displayName = "CgvCard";

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 14,
    },
});
