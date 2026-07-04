import BookmarkIcon from "@/icons/bookmark";
import { useBookmarks } from "@/services/bookmark";
import { BookmarkedPost } from "@/types/bookmarkedpost";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useRouter } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../../components/FlexText";
import { CommentsSheet } from "../../components/post/CommentsSheet";
import { LikersSheet } from "../../components/post/LikersSheet";
import { PostItem } from "../../components/PostItem";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Post } from "../../types/post";
import type { LikersSheetHandle } from "../../types/sheetHandles";

const BookmarksScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useBookmarks();

    const posts = useMemo(() => {
        const pages = data?.pages;
        if (!pages) return [];
        return pages.flatMap((page) => page.data);
    }, [data?.pages]);

    const likersSheetRef = useRef<LikersSheetHandle>(null);
    const commentsSheetRef = useRef<TrueSheet>(null);
    const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(null);
    const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
    const pendingCommentOpen = useRef(false);

    React.useEffect(() => {
        if (pendingCommentOpen.current && selectedCommentPostId) {
            pendingCommentOpen.current = false;
            commentsSheetRef.current?.present();
        }
    }, [selectedCommentPostId]);

    const handleLikeCountPress = useCallback((post: Post) => {
        setSelectedLikePostId(post.id);
        likersSheetRef.current?.present();
    }, []);

    const handleCommentPress = useCallback((post: Post) => {
        pendingCommentOpen.current = true;
        setSelectedCommentPostId(post.id);
    }, []);

    const handleCommentSheetDismiss = useCallback(() => {
        setSelectedCommentPostId(null);
    }, []);

    const handleLikersSheetDismiss = useCallback(() => {
        setSelectedLikePostId(null);
    }, []);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderItem = useCallback(
        ({ item }: { item: BookmarkedPost }) => (
            <View style={{ marginBottom: 30 }}>
                <PostItem
                    post={item}
                    isBookmarked={true}
                    onLikeCountPress={handleLikeCountPress}
                    onCommentPress={handleCommentPress}
                />
            </View>
        ),
        [handleLikeCountPress, handleCommentPress]
    );

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <View style={[styles.refreshIndicator, { backgroundColor: colors.card }]}>
                        <Spinner size="md" color={colors.text} />
                    </View>
                </View>
            );
        }
        return <View style={{ height: 80 }} />;
    }, [isFetchingNextPage, colors.text, colors.card]);

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonGroup key={i} isLoading variant="shimmer" style={{ marginBottom: 30 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                                <SkeletonGroup.Item className="h-10 w-10 rounded-full" />
                                <View style={{ marginLeft: 12, flex: 1, gap: 6 }}>
                                    <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
                                    <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
                                </View>
                            </View>
                            <View style={{ gap: 8, marginBottom: 12 }}>
                                <SkeletonGroup.Item className="h-4 w-full rounded-md" />
                                <SkeletonGroup.Item className="h-4 w-5/6 rounded-md" />
                                <SkeletonGroup.Item className="h-4 w-2/3 rounded-md" />
                            </View>
                            <SkeletonGroup.Item className="h-48 w-full rounded-xl" />
                        </SkeletonGroup>
                    ))}
                </View>
            );
        }
        return (
            <View style={styles.emptyState}>
                <View
                    style={[
                        styles.emptyIconContainer,
                        {
                            backgroundColor:
                                theme === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.04)",
                        },
                    ]}
                >
                    <BookmarkIcon size={32} color={colors.muted} />
                </View>
                <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
                    {t('bookmarks.emptyTitle')}
                </FlexText>
                <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
                    {t('bookmarks.emptyBody')}
                </FlexText>
            </View>
        );
    }, [isLoading, colors, common, theme, t]);

    // Title + subtitle rendered as the first item in the list,
    // sits below the spacer that clears the floating back button.
    const ListHeaderComponent = useCallback(() => (
        <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16, marginBottom: 8 }}>
            <FlexText style={[common.heading, { fontSize: 28 }]}>
                {t('bookmarks.title')}
            </FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                {posts.length > 0
                    ? t('bookmarks.savedCount', { count: posts.length })
                    : t('bookmarks.yourSavedPosts')}
            </FlexText>
        </View>
    ), [insets.top, common, colors.muted, posts.length, t]);

    return (
        <View style={common.screen}>
            {/* Floating back button — same pattern as Settings */}
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </View>

            {/* Bookmarks list */}
            <FlatList
                data={posts}
                keyExtractor={(item) => item.bookmark_id ?? item.id}
                renderItem={renderItem}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isRefetching}
                contentContainerStyle={
                    posts.length === 0 ? styles.emptyContainer : undefined
                }
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={insets.top}
                    />
                }
            />

            <LikersSheet ref={likersSheetRef} postId={selectedLikePostId} onDismiss={handleLikersSheetDismiss} />
            <CommentsSheet
                ref={commentsSheetRef}
                postId={selectedCommentPostId}
                onDismiss={handleCommentSheetDismiss}
            />
        </View>
    );
};

export default BookmarksScreen;

const styles = StyleSheet.create({
    footerLoader: {
        paddingVertical: 24,
        alignItems: "center",
    },
    refreshIndicator: {
        borderRadius: 999,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
});
