/* eslint-disable react-hooks/refs */
import { FlexText } from "@/components/FlexText";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { VideoFeedType, VideoItem } from "@/types/video";
import { useShotsViewModel } from "@/viewmodels/ShotsViewModel";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useIsFocused } from "expo-router/react-navigation";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    LayoutChangeEvent,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewToken,
    useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    DECELERATION_RATE,
    Direction,
    DRAW_DISTANCE_MULTIPLIER,
    FALLBACK_ITEM_HEIGHT,
    ITEM_OVERLAP,
    PRELOAD_AHEAD,
    PRELOAD_BEHIND,
    SCROLL_EVENT_THROTTLE,
    USE_PLACEHOLDER_OUTSIDE_PRELOAD,
} from "./constants";
import { ShotItem } from "./ShotItem";

// ─── Feed Tab (adopting reference VideoFeedList pattern with LegendList) ─
export const ShotsFeedTab = ({ feedType }: { feedType: VideoFeedType }) => {
    const { width: screenWidth } = useWindowDimensions();
    const vm = useShotsViewModel(feedType);
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const { t } = useTranslation();

    // ─── Ref-based active index + direction tracking (reference pattern) ──
    const currentIndexRef = useRef(0);
    const directionRef = useRef<Direction>("down");

    // renderTrigger: bumped on index change OR pause change so LegendList
    // re-evaluates renderItem with the latest closure values for ALL visible items.
    const [renderTrigger, setRenderTrigger] = useState(0);

    // ─── Seeking state (disables scroll during seek-bar drag) ────────────
    const [seeking, setSeeking] = useState(false);
    const handleSeekingChange = useCallback((value: boolean) => {
        setSeeking(value);
    }, []);

    // ─── Measured container height for precise snapping (reference pattern) ─
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(
        Platform.OS === "ios" ? FALLBACK_ITEM_HEIGHT : null,
    );
    const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const h = Math.ceil(e.nativeEvent.layout.height);
        if (h > 0) setMeasuredHeight(h);
    }, []);

    const itemHeight = useMemo(
        () => (measuredHeight ?? FALLBACK_ITEM_HEIGHT) + ITEM_OVERLAP,
        [measuredHeight],
    );
    const listReady = useMemo(() => measuredHeight !== null, [measuredHeight]);
    const listRef = useRef<FlatList | null>(null);

    // ─── Viewability config (reference pattern) ───────────────────────────
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        waitForInteraction: false,
        minimumViewTime: 0,
    }).current;

    // ─── Viewable items changed handler (reference pattern) ──────────────
    const handleVideoChange = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const nextIndex = viewableItems[0]?.index ?? -1;
            if (nextIndex === -1 || vm.videos.length === 0) {
                return;
            }
            const maxIndex = vm.videos.length - 1;
            const clampedIndex = Math.max(0, Math.min(nextIndex, maxIndex));
            const prevIndex = currentIndexRef.current;

            if (clampedIndex === prevIndex) {
                return;
            }

            directionRef.current = clampedIndex > prevIndex ? "down" : "up";
            currentIndexRef.current = clampedIndex;

            // Sync with ViewModel's activeIndex for like state, comments, etc.
            vm.onViewableItemsChanged({
                viewableItems: [{
                    index: clampedIndex,
                    item: vm.videos[clampedIndex],
                    isViewable: true,
                    key: vm.videos[clampedIndex]?.id,
                }],
            });

            setRenderTrigger(t => t + 1);
        },
        [vm.videos.length, vm.onViewableItemsChanged],
    );

    // ─── renderItem — direction-aware preloading matching reference exactly ─
    const vmRef = useRef(vm);
    vmRef.current = vm;

    const renderItem = useCallback(
        ({ item, index }: { item: VideoItem; index: number }) => {
            const currentIndex = currentIndexRef.current;
            const direction = directionRef.current;
            const isActive = index === currentIndex;
            const distanceFromActive = index - currentIndex;
            const isAhead =
                direction === "down"
                    ? distanceFromActive > 0
                    : distanceFromActive < 0;

            const isNeighbor = Math.abs(distanceFromActive) <= 1;
            const shouldPreloadAhead =
                isAhead && Math.abs(distanceFromActive) <= PRELOAD_AHEAD;
            const isBehind =
                direction === "down"
                    ? distanceFromActive < 0
                    : distanceFromActive > 0;
            const shouldPreloadBehind =
                isBehind && Math.abs(distanceFromActive) <= PRELOAD_BEHIND;

            const shouldPreload =
                isActive ||
                isNeighbor ||
                shouldPreloadAhead ||
                shouldPreloadBehind;

            // Placeholder for items outside the preload window (reference pattern)
            if (USE_PLACEHOLDER_OUTSIDE_PRELOAD && !shouldPreload && !isActive) {
                return (
                    <View
                        style={[
                            styles.placeholder,
                            { width: screenWidth, height: itemHeight },
                        ]}
                    />
                );
            }

            // Read live vm values via ref — avoids stale closure while still
            // letting the memo comparator in ShotItem decide whether to re-render.
            const { isLiked, likeCount } = vmRef.current.getLikeState(item);

            return (
                <ShotItem
                    item={item}
                    isActive={isActive}
                    shouldPreload={shouldPreload}
                    isFocused={isFocused}
                    itemHeight={itemHeight}
                    isPaused={vmRef.current.isPaused}
                    isLiked={isLiked}
                    likeCount={likeCount}
                    onLikePress={() => vmRef.current.handleLikePress(item)}
                    onCommentPress={() => vmRef.current.handleCommentPress(item)}
                    onSeekingChange={handleSeekingChange}
                    colors={vmRef.current.colors}
                    insets={insets}
                    isCommentsOpen={vmRef.current.isCommentsOpen}
                />
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [renderTrigger, itemHeight, isFocused, insets, handleSeekingChange],
    );

    const keyExtractor = useCallback((item: VideoItem) => item.id, []);

    // ─── FlatList performance helpers ────────────────────────────────────
    const getItemLayout = useCallback(
        (data: any, index: number) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
        }),
        [itemHeight],
    );

    const handleVideoChangeRef = useRef(handleVideoChange);
    handleVideoChangeRef.current = handleVideoChange;

    const viewabilityConfigCallbackPairsRef = useRef<any>(null);
    if (!viewabilityConfigCallbackPairsRef.current) {
        viewabilityConfigCallbackPairsRef.current = [
            {
                viewabilityConfig,
                onViewableItemsChanged: (info: any) => {
                    handleVideoChangeRef.current(info);
                },
            },
        ];
    }
    const viewabilityConfigCallbackPairs = viewabilityConfigCallbackPairsRef.current;

    const getItemType = useCallback(() => "video", []);

    const drawDistance = useMemo(
        () => itemHeight * DRAW_DISTANCE_MULTIPLIER,
        [itemHeight],
    );

    // ─── Bump renderTrigger when isPaused, isCommentsOpen, or isFocused changes ───
    const prevIsPaused = useRef(vm.isPaused);
    const prevIsCommentsOpen = useRef(vm.isCommentsOpen);
    const prevIsFocused = useRef(isFocused);
    if (
        prevIsPaused.current !== vm.isPaused ||
        prevIsCommentsOpen.current !== vm.isCommentsOpen ||
        prevIsFocused.current !== isFocused
    ) {
        prevIsPaused.current = vm.isPaused;
        prevIsCommentsOpen.current = vm.isCommentsOpen;
        prevIsFocused.current = isFocused;
        setRenderTrigger(t => t + 1);
    }

    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Spinner size="lg" color="white" style={{ flex: 1 }} />
            </View>
        );
    }

    if (vm.videos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.5)" />
                <FlexText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12 }}>
                    {vm.isError ? t('shots.empty.error') : t('shots.empty.noVideos')}
                </FlexText>
                <TouchableOpacity
                    onPress={() => vm.refetch()}
                    style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
                >
                    <FlexText style={{ color: 'white', fontSize: 14 }}>{t('shots.actions.retry')}</FlexText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]} onLayout={handleContainerLayout}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {listReady ? (
                <FlatList
                    ref={listRef as any}
                    data={vm.videos}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    extraData={renderTrigger}
                    scrollEnabled={!vm.isCommentsOpen && !seeking}
                    pagingEnabled={true}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    snapToAlignment="start"
                    decelerationRate={DECELERATION_RATE}
                    scrollEventThrottle={SCROLL_EVENT_THROTTLE}
                    disableIntervalMomentum={true}
                    viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
                    onEndReached={() => vm.loadMore()}
                    onEndReachedThreshold={0.8}
                    bounces={false}
                    overScrollMode="never"
                    style={[styles.list, { width: screenWidth }]}
                    contentContainerStyle={styles.listContent}
                    getItemLayout={getItemLayout}
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    windowSize={5}
                    removeClippedSubviews={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={vm.isRefetching}
                            onRefresh={vm.refetch}
                            tintColor={vm.colors.text}
                            colors={[vm.colors.text]}
                            progressBackgroundColor={vm.colors.card}
                            progressViewOffset={insets.top + 30}
                        />
                    }
                />
            ) : null}

            {/* Comments sheet — ReanimatedTrueSheet so animatedPosition drives video height */}
            <CommentsSheet
                ref={vm.commentsSheetRef}
                postId={vm.activeCommentPostId}
                onDismiss={vm.handleCommentsDismiss}
                useReanimated
                detents={[0.6]}
            />
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 0,
        flexGrow: 1,
    },
    placeholder: {
        backgroundColor: "black",
    },
});
