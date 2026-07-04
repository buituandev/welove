import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { Image as ExpoImage } from "expo-image";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VerifiedIcon from "../../icons/verified";
import { LikeUser } from "../../types/like";
import type { LikersSheetHandle } from "../../types/sheetHandles";
import { useLikersSheetViewModel } from "../../viewmodels/LikersSheetViewModel";
import { FlexText } from "../FlexText";

// ============================================================================
// Types
// ============================================================================

interface LikersSheetProps {
    postId: string | null;
    onDismiss?: () => void;
}

interface LikerItemProps {
    user: LikeUser;
    colors: any;
    common: any;
    onPress: () => void;
}

// ============================================================================
// LikerItem Component
// ============================================================================

const LikerItem = memo(({ user, colors, common, onPress }: LikerItemProps) => (
    <TouchableOpacity
        style={styles.likerItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <ExpoImage
            source={{ uri: user.profile_avatar }}
            style={[styles.avatar, { backgroundColor: colors.outlineVariant }]}
            contentFit="cover"
        />
        <View style={styles.userInfo}>
            <View style={styles.nameRow}>
                <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                    {user.profile_name}
                </FlexText>
                {user.profile_is_verified && (
                    <VerifiedIcon size={14} />
                )}
            </View>
        </View>
    </TouchableOpacity>
));

LikerItem.displayName = "LikerItem";

// ============================================================================
// LikersSheet Component
// ============================================================================

export const LikersSheet = memo(forwardRef<LikersSheetHandle, LikersSheetProps>(
    ({ postId, onDismiss }, ref) => {
        const insets = useSafeAreaInsets();
        const [index, setIndex] = useState(0);
        const wasOpenRef = useRef(false);

        const controllerRef = useRef<LikersSheetHandle>({
            present: () => {
                wasOpenRef.current = true;
                setIndex(1);
            },
            dismiss: () => {
                setIndex(0);
            }
        });

        const vm = useLikersSheetViewModel(postId, controllerRef);
        const { t } = useTranslation();
        const {
            colors,
            common,
            theme,
            likers,
            totalLikes,
            isLoading,
            isFetchingNextPage,
            handleEndReached,
            handleUserPress,
        } = vm;

        useImperativeHandle(ref, () => ({
            present: () => {
                controllerRef.current.present();
            },
            dismiss: () => {
                controllerRef.current.dismiss();
            },
        }), []);

        const handleIndexChange = useCallback((newIndex: number) => {
            if (newIndex > 0) {
                wasOpenRef.current = true;
            }
            setIndex(newIndex);
        }, []);

        const handleSettle = useCallback((settledIndex: number) => {
            if (settledIndex === 0 && wasOpenRef.current) {
                wasOpenRef.current = false;
                onDismiss?.();
            }
        }, [onDismiss]);

        const renderItem = useCallback(({ item }: { item: LikeUser }) => (
            <LikerItem
                user={item}
                colors={colors}
                common={common}
                onPress={() => handleUserPress(item)}
            />
        ), [colors, common, handleUserPress]);

        const renderFooter = useCallback(() => {
            if (isFetchingNextPage) {
                return (
                    <View style={styles.footerLoader}>
                        <Spinner size="md" color={colors.onSurface} />
                    </View>
                );
            }
            return null;
        }, [isFetchingNextPage, colors.onSurface]);

        const renderEmpty = useCallback(() => {
            if (isLoading) {
                return (
                    <View style={{ paddingTop: 8 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonGroup key={i} isLoading variant="shimmer" style={{ flexDirection: 'row', marginBottom: 20, gap: 16 }}>
                                <SkeletonGroup.Item className="rounded-full" style={{ width: 48, height: 48 }} />
                                <View style={{ gap: 4, flex: 1, justifyContent: 'center' }}>
                                    <SkeletonGroup.Item className="rounded-lg" style={{ width: '40%', height: 16 }} />
                                </View>
                            </SkeletonGroup>
                        ))}
                    </View>
                );
            }
            return (
                <View style={styles.emptyState}>
                    <FlexText style={[common.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                        {t('post.likersSheet.emptyTitle')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
                        {t('post.likersSheet.emptyBody')}
                    </FlexText>
                </View>
            );
        }, [isLoading, colors, common, t]);

        const renderHeader = useCallback(() => (
            <View style={styles.header}>
                <FlexText style={[common.heading]}>{t('post.likersSheet.title')}</FlexText>
                <FlexText style={common.bodySmall}>
                    {totalLikes > 0
                        ? t('post.likersSheet.subtitle', { count: totalLikes })
                        : t('post.likersSheet.emptyTitle')}
                </FlexText>
            </View>
        ), [common, t, totalLikes]);

        return (
            <ModalBottomSheet
                index={index}
                onIndexChange={handleIndexChange}
                onSettle={handleSettle}
                detents={[0, 'content']}
                scrimColor={colors.scrim}
                scrimOpacities={[0, 0.5, 1]}
                extendUnderStatusBar
                surface={
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: colors.surfaceContainerLow,
                                borderTopLeftRadius: 32,
                                borderTopRightRadius: 32,
                                overflow: "hidden",
                            },
                        ]}
                    />
                }
            >
                <View style={[styles.grabber, { backgroundColor: colors.onSurfaceVariant, marginTop: insets.top + 12 }]} />
                <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
                    <FlatList
                        nestedScrollEnabled
                        data={likers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.5}
                        ListHeaderComponent={renderHeader}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmpty}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={true}
                    />
                </View>
            </ModalBottomSheet>
        );
    }
));

LikersSheet.displayName = "LikersSheet";

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 12,
    },
    likerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    userInfo: {
        flex: 1,
        justifyContent: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    footerLoader: {
        alignItems: "center",
        paddingVertical: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 40,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
});
