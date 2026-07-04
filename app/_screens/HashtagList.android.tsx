import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useRouter } from 'expo-router';
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrendingHashtagsViewModel } from '@/viewmodels/TrendingHashtagsViewModel';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';

// Jetpack Compose components from @expo/ui
import {
    Column,
    Host,
    LazyColumn,
    PullToRefreshBox,
    Row,
    Shape,
    Surface,
    Text
} from "@expo/ui/jetpack-compose";
import {
    fillMaxSize,
    fillMaxWidth,
    padding,
    size,
} from "@expo/ui/jetpack-compose/modifiers";

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

    const getCornerRadii = (index: number, total: number) => {
        const large = 24;
        const small = 5;
        if (total <= 1) {
            return { topStart: large, topEnd: large, bottomStart: large, bottomEnd: large };
        }
        if (index === 0) {
            return { topStart: large, topEnd: large, bottomStart: small, bottomEnd: small };
        }
        if (index === total - 1) {
            return { topStart: small, topEnd: small, bottomStart: large, bottomEnd: large };
        }
        return { topStart: small, topEnd: small, bottomStart: small, bottomEnd: small };
    };

    return (
        <View style={common.screen}>
            {/* Floating back button (RN Overlay on top of Compose View) */}
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

            <Host style={{ flex: 1 }} >
                <PullToRefreshBox
                    isRefreshing={isRefetching}
                    onRefresh={handleRefresh}
                    contentAlignment="topCenter"
                    modifiers={[fillMaxSize()]}
                >
                    <LazyColumn
                        verticalArrangement={{ spacedBy: 3 }}
                        contentPadding={{ start: 16, end: 16, bottom: 40 }}
                        modifiers={[fillMaxSize()]}
                    >
                        {/* Header Section */}
                        <Column modifiers={[padding(0, insets.top + 66, 0, 16)]}>
                            <Text color={colors.text as any} style={{ fontSize: 28, fontWeight: '700', fontFamily: 'GoogleSansFlexBold' }}>
                                {t('hashtag.list.title')}
                            </Text>
                            <Text color={colors.muted as any} style={{ fontSize: 14, fontWeight: '400', fontFamily: 'GoogleSansFlexRegular' }} modifiers={[padding(0, 2, 0, 0)]}>
                                {allTags.length > 0
                                    ? t('hashtag.list.tagsCount', { count: allTags.length })
                                    : t('hashtag.list.subtitle')}
                            </Text>
                        </Column>

                        {/* Loading/Skeleton State */}
                        {isLoading && Array.from({ length: 6 }).map((_, i) => {
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

                        {/* Loaded List Items */}
                        {!isLoading && allTags.map((item, index) => (
                            <Surface
                                key={item.id}
                                color={colors.containerContent as any}
                                shape={Shape.RoundedCorner({ cornerRadii: getCornerRadii(index, allTags.length) })}
                                onClick={() => navigateToTag(item.tag)}
                                modifiers={[fillMaxWidth()]}
                            >
                                <Row
                                    verticalAlignment="center"
                                    horizontalArrangement="spaceBetween"
                                    modifiers={[fillMaxWidth(), padding(16, 14, 16, 14)]}
                                >
                                    <Column>
                                        <Text color={colors.text as any} style={{ fontSize: 16, fontWeight: '600', fontFamily: 'GoogleSansFlexMedium' }}>
                                            #{item.tag}
                                        </Text>
                                        {item.count != null && (
                                            <Text color={colors.muted as any} style={{ fontSize: 12, fontFamily: 'GoogleSansFlexRegular' }} modifiers={[padding(0, 2, 0, 0)]}>
                                                {t('hashtag.posts.count', { count: item.count })}
                                            </Text>
                                        )}
                                    </Column>
                                </Row>
                            </Surface>
                        ))}

                        {/* Empty State */}
                        {!isLoading && allTags.length === 0 && (
                            <Column
                                horizontalAlignment="center"
                                verticalArrangement="center"
                                modifiers={[fillMaxSize(), padding(40, 80, 40, 80)]}
                            >
                                <Surface
                                    color={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                                    shape={Shape.RoundedCorner({ cornerRadii: { topStart: 40, topEnd: 40, bottomStart: 40, bottomEnd: 40 } })}
                                    modifiers={[size(80, 80)]}
                                >
                                    <Row verticalAlignment="center" horizontalArrangement="center" modifiers={[fillMaxSize()]}>
                                        <Text color={colors.text as any} style={{ fontSize: 32, fontFamily: 'GoogleSansFlexRegular' }}>#</Text>
                                    </Row>
                                </Surface>
                                <Text color={colors.text as any} style={{ fontSize: 20, fontWeight: '700', textAlign: 'center', fontFamily: 'GoogleSansFlexBold' }} modifiers={[padding(0, 20, 0, 0)]}>
                                    {t('hashtag.list.emptyTitle')}
                                </Text>
                                <Text color={colors.muted as any} style={{ fontSize: 14, textAlign: 'center', lineHeight: 22, fontFamily: 'GoogleSansFlexRegular' }} modifiers={[padding(0, 8, 0, 0)]}>
                                    {t('hashtag.list.emptyBody')}
                                </Text>
                            </Column>
                        )}
                    </LazyColumn>
                </PullToRefreshBox>
            </Host>
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
});
