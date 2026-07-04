import { FlexText } from '@/components/FlexText';
import { CommentsSheet } from '@/components/post/CommentsSheet';
import { LikersSheet } from '@/components/post/LikersSheet';
import { PostItem } from '@/components/PostItem';
import { useThemeContext } from '@/context/ThemeContext';
import { createCommonStyles } from '@/styles/common';
import { Post } from '@/types/post';
import type { LikersSheetHandle } from '@/types/sheetHandles';
import { useHashtagPostsViewModel } from '@/viewmodels/HashtagPostsViewModel';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useRouter } from 'expo-router';
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ListRenderItemInfo, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

interface HashtagPostsScreenProps {
    tag: string;
}

const HashtagPostsScreen = ({ tag }: HashtagPostsScreenProps) => {
    const router = useRouter();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const vm = useHashtagPostsViewModel(tag);
    const { t } = useTranslation();

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

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Post>) => (
            <View style={{ marginBottom: 30 }}>
                <PostItem
                    post={item}
                    onLikeCountPress={handleLikeCountPress}
                    onCommentPress={handleCommentPress}
                />
            </View>
        ),
        [handleLikeCountPress, handleCommentPress]
    );

    const renderFooter = useCallback(() => {
        if (vm.isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <Spinner size="md" color={colors.text} />
                </View>
            );
        }
        return <View style={{ height: 80 }} />;
    }, [vm.isFetchingNextPage, colors.text]);

    const renderEmpty = useCallback(() => {
        if (vm.isLoading) {
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
                                theme === 'dark'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(0,0,0,0.04)',
                        },
                    ]}
                >
                    <FlexText style={{ fontSize: 32 }}>#</FlexText>
                </View>
                <FlexText
                    style={[
                        common.heading,
                        { fontSize: 20, marginTop: 20, marginBottom: 8 },
                    ]}
                >
                    {t('hashtag.posts.emptyTitle')}
                </FlexText>
                <FlexText
                    style={[
                        common.body,
                        {
                            color: colors.muted,
                            textAlign: 'center',
                            lineHeight: 22,
                        },
                    ]}
                >
                    {t('hashtag.posts.emptyBody', { tag })}
                </FlexText>
            </View>
        );
    }, [vm.isLoading, colors, common, theme, tag, t]);

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: vm.insets.top + 66,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                }}
            >
                <FlexText style={[common.heading, { fontSize: 28 }]}>
                    #{vm.hashtagLabel}
                </FlexText>
                <FlexText
                    style={[
                        common.bodySmall,
                        { color: colors.muted, marginTop: 2 },
                    ]}
                >
                    {vm.totalCount > 0
                        ? t('hashtag.posts.count', { count: vm.totalCount })
                        : t('hashtag.posts.title')}
                </FlexText>
            </View>
        ),
        [vm.insets.top, vm.hashtagLabel, vm.totalCount, common, colors.muted, t]
    );

    return (
        <View style={common.screen}>
            {/* Floating back button — same pattern as Bookmarks */}
            <View
                style={{
                    position: 'absolute',
                    top: vm.insets.top + 16,
                    left: 16,
                    zIndex: 1000,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={vm.posts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onEndReached={vm.handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={vm.refetch}
                refreshing={vm.isRefetching}
                contentContainerStyle={
                    vm.posts.length === 0 ? styles.emptyContainer : undefined
                }
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isRefetching}
                        onRefresh={vm.refetch}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={vm.insets.top}
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

export default HashtagPostsScreen;

const styles = StyleSheet.create({
    footerLoader: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    refreshIndicator: {
        borderRadius: 999,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
