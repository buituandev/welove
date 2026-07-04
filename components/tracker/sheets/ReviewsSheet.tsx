import { FlexText } from '@/components/FlexText';
import { TMDBReview } from '@/types/moviedb/movie-entities';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NitroInAppBrowser from 'react-native-nitro-in-app-browser';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { useSheetBackHandler } from "../../profile/sheets/useSheetBackHandler";

interface ReviewsSheetProps {
    data: TMDBReview[];
    onEndReached?: () => void;
    isLoadingItems?: boolean;
}

const getAvatarSource = (path: string | null | undefined, author: string) => {
    if (!path) {
        // Pseudo-random based on author name length
        const isAlternate = author.length % 2 === 0;
        return isAlternate ? require('../../../assets/images/AV17.png') : require('../../../assets/images/AV86.png');
    }
    // Some paths contain full URL (e.g. from Gravatar)
    if (path.startsWith("/http")) return { uri: path.slice(1) };
    return { uri: `https://image.tmdb.org/t/p/w185${path}` };
};

const ReviewItem = memo(({ item, colors, common }: { item: TMDBReview; colors: any; common: any }) => {
    const handleOpenReview = async () => {
        if (item.url) {
            try {
                await NitroInAppBrowser.open(item.url, {
                    barColor: 'red',
                    controlColor: '#000000',
                    dismissButtonLabel: 'close',
                    presentationStyle: 'fullScreen',
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <TouchableOpacity
            onPress={handleOpenReview}
            activeOpacity={0.7}
            style={[styles.card, { backgroundColor: (colors.card || "rgba(255,255,255,0.05)") }]}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 }}>
                <Image
                    source={getAvatarSource(item.author_details?.avatar_path, item.author)}
                    style={styles.avatarContainer}
                    contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                    <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                        {item.author_details?.name || item.author}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                        @{item.author_details?.username || item.author}
                    </FlexText>
                </View>
                {item.author_details?.rating && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>{item.author_details.rating.toFixed(1)}</Text>
                    </View>
                )}
            </View>

            <FlexText style={[common.bodySmall, { color: colors.text }]} numberOfLines={6} ellipsizeMode="tail">
                {item.content}
            </FlexText>

            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 12, fontSize: 12 }]}>
                {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </FlexText>
        </TouchableOpacity>
    );
});

ReviewItem.displayName = "ReviewItem";

export const ReviewsSheet = memo(forwardRef<TrueSheet, ReviewsSheetProps>(({ data, onEndReached, isLoadingItems }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const backHandler = useSheetBackHandler(ref);

    const renderFooter = useCallback(() => {
        if (!isLoadingItems) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <Spinner size="md" color={colors.text} />
            </View>
        );
    }, [isLoadingItems, colors.text]);

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            cornerRadius={36}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24, paddingHorizontal: 8 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>Reviews</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {data.length} {data.length === 1 ? "Review" : "Reviews"}
                    </FlexText>
                </View>

                {/* List */}
                <FlatList
                    nestedScrollEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ReviewItem key={item.id} item={item} colors={colors} common={common} />
                    )}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        !isLoadingItems ? (
                            <View style={{ paddingVertical: 40, alignItems: "center" }}>
                                <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
                                <FlexText style={{ color: colors.muted, marginTop: 12 }}>No reviews found for this movie.</FlexText>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            </View>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
});
