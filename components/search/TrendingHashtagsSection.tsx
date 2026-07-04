import { useTrendingHashtagsViewModel } from '@/viewmodels/TrendingHashtagsViewModel';
import { SquircleView } from 'expo-squircle-view';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import { FlexText } from '../FlexText';

export const TrendingHashtagsSection = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const vm = useTrendingHashtagsViewModel();
    const { t } = useTranslation();

    if (!vm.isLoading && vm.previewTags.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <FlexText style={[common.subheading, { fontSize: 15 }]}>{t('search.sections.trending')}</FlexText>
                {vm.hasMoreTags && (
                    <TouchableOpacity onPress={vm.navigateToAllTags} hitSlop={8}>
                        <FlexText style={[common.bodySmall, { color: colors.primary }]}>
                            {t('search.sections.seeAll')}
                        </FlexText>
                    </TouchableOpacity>
                )}
            </View>

            {vm.isLoading ? (
                <View style={styles.loadingRow}>
                    {[0, 1, 2].map((i) => (
                        <SquircleView
                            cornerSmoothing={60}
                            key={i}
                            style={[
                                styles.tagPillSkeleton,
                                { backgroundColor: colors.surfaceContainer },
                            ]}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.tagsRow}>
                    {vm.previewTags.map((hashtag) => (
                        <TouchableOpacity
                            key={hashtag.id}
                            onPress={() => vm.navigateToTag(hashtag.tag)}
                            activeOpacity={0.7}
                            style={styles.tagPillWrapper}
                        >
                            <SquircleView
                                cornerSmoothing={100}
                                preserveSmoothing
                                style={[
                                    styles.tagPill,
                                    { backgroundColor: colors.surfaceContainer },
                                ]}
                              >
                                <FlexText
                                    style={[
                                        common.bodySmall,
                                        { color: colors.primary, fontWeight: '600' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    #{hashtag.tag}
                                </FlexText>
                                {hashtag.count != null && (
                                    <FlexText
                                        style={[
                                            common.caption,
                                            { color: colors.onSurfaceVariant, marginTop: 2 },
                                        ]}
                                    >
                                        {t('search.sections.postsCount', { count: hashtag.count })}
                                    </FlexText>
                                )}
                            </SquircleView>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    loadingRow: {
        flexDirection: 'row',
        gap: 10,
    },
    tagPillWrapper: {
        flex: 1,
    },
    tagPill: {
        flex: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagPillSkeleton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        opacity: 0.5,
    },
});
