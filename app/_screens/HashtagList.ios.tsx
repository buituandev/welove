import { CustomSurface } from '@/components/CustomSurface';
import { FlexText } from '@/components/FlexText';
import { useTrendingHashtagsViewModel } from '@/viewmodels/TrendingHashtagsViewModel';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useRouter } from 'expo-router';
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import { Hashtag } from '../../types/hashtag';

const HashtagListScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const {
        allTags,
        isLoading,
        isRefetching,
        handleRefresh,
        navigateToTag,
    } = useTrendingHashtagsViewModel();
    const { t } = useTranslation();

    const renderItem = useCallback(
        ({ item, index }: { item: Hashtag; index: number }) => (
            <CustomSurface
                isFirst={index === 0}
                isLast={index === allTags.length - 1}
                onPress={() => navigateToTag(item.tag)}
                style={styles.tagRow}
            >
                <View style={styles.tagRowLeft}>
                    <FlexText
                        style={[
                            common.body,
                            { color: colors.text, fontWeight: '600' },
                        ]}
                    >
                        #{item.tag}
                    </FlexText>
                    {item.count != null && (
                        <FlexText style={[common.caption, { color: colors.muted, marginTop: 2 }]}>
                            {t('hashtag.posts.count', { count: item.count })}
                        </FlexText>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </CustomSurface>
        ),
        [colors, common, navigateToTag, allTags.length, t]
    );

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 3 }}>
                    {Array.from({ length: 6 }).map((_, i) => {
                        const isFirst = i === 0;
                        const isLast = i === 5;
                        const cardStyle = isFirst && isLast
                            ? { borderRadius: 24 }
                            : isFirst
                                ? { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }
                                : isLast
                                    ? { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderTopLeftRadius: 5, borderTopRightRadius: 5 }
                                    : { borderRadius: 5 };
                        return (
                            <SkeletonGroup
                                key={i}
                                isLoading
                                variant="shimmer"
                                style={[styles.tagRow, cardStyle, { backgroundColor: colors.containerContent }]}
                            >
                                <View style={styles.tagRowLeft}>
                                    <SkeletonGroup.Item className="h-5 w-32 rounded-md mb-2" />
                                    <SkeletonGroup.Item className="h-4 w-16 rounded-md" />
                                </View>
                                <SkeletonGroup.Item className="h-4 w-4 rounded-full" />
                            </SkeletonGroup>
                        );
                    })}
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
                    {t('hashtag.list.emptyTitle')}
                </FlexText>
                <FlexText
                    style={[
                        common.body,
                        { color: colors.muted, textAlign: 'center', lineHeight: 22 },
                    ]}
                >
                    {t('hashtag.list.emptyBody')}
                </FlexText>
            </View>
        );
    }, [isLoading, colors, common, theme, t]);

    const ListHeaderComponent = useCallback(
        () => (
            <View
                style={{
                    marginTop: insets.top + 66,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                }}
            >
                <FlexText style={[common.heading, { fontSize: 28 }]}>{t('hashtag.list.title')}</FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    {allTags.length > 0
                        ? t('hashtag.list.tagsCount', { count: allTags.length })
                        : t('hashtag.list.subtitle')}
                </FlexText>
            </View>
        ),
        [insets.top, common, colors.muted, allTags.length, t]
    );

    return (
        <View style={common.screen}>
            {/* Floating back button */}
            <View
                style={{
                    position: 'absolute',
                    top: insets.top + 16,
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
                data={allTags}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    { paddingHorizontal: 16, gap: 3, paddingBottom: 40 },
                    allTags.length === 0 && styles.emptyContainer,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        progressViewOffset={insets.top}
                    />
                }
            />
        </View>
    );
};

export default HashtagListScreen;

const styles = StyleSheet.create({
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    tagRowLeft: {
        flex: 1,
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
