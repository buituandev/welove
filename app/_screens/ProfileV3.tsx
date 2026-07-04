import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import { Tabs } from "heroui-native/tabs";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { Snackbar } from 'react-native-paper';
import Reanimated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostItem } from '../../components/PostItem';
import ProfileHeaderV3, { COVER_HEIGHT } from '../../components/profile/ProfileHeaderV3';
import { AddressSheet } from "../../components/profile/sheets/AddressSheet";
import { MusicSheet } from "../../components/profile/sheets/MusicSheet";
import { SocialSheet } from "../../components/profile/sheets/SocialSheet";
import { WorkplaceSheet } from "../../components/profile/sheets/WorkplaceSheet";
import { MediaViewerWrapper, useImageGrid } from '../../components/profile/useImageGrid';
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Post } from '../../types/post';
import { useProfileViewModel } from "../../viewmodels/ProfileViewModel";

import { FlexText } from "@/components/FlexText";
import { List } from "@/components/list";
import { PagerWithHeader, type PagerWithHeaderChildParams } from "@/components/pager/PagerWithHeader";
import { PostOptionsSheet, TranslationLanguageSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { LikersSheet } from "@/components/post/LikersSheet";
import { BriefInfoSheet } from "@/components/profile/sheets/BriefInfoSheet";
import { RelationshipSheet } from "@/components/profile/sheets/RelationshipSheet";
import { BlurTargetView, BlurView } from "expo-blur";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { ProfileGalleryModal } from "../../components/gallery/ProfileGalleryModal";
import { SpinningArtwork } from "../../components/profile/SpinningArtwork";

// ─── Static skeleton shown during navigation transition ────────────────────────
const ProfileSkeletonInner = ({ insets }: { insets: any }) => {
  const { colors } = useThemeContext();
  return (
    <View style={{ paddingHorizontal: 12, flex: 1 }}>
      <SkeletonGroup isLoading variant="shimmer" isSkeletonOnly>
        {/* Top Space */}
        <View style={{ height: insets.top + 12 }} />

        {/* Cover */}
        <SkeletonGroup.Item className="rounded-2xl" style={{ width: '100%', height: COVER_HEIGHT, marginBottom: 32 }} />

        {/* Avatar & Actions Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          {/* Avatar */}
          <SkeletonGroup.Item className="rounded-full" style={{ width: 64, height: 64 }} />
          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonGroup.Item className="rounded-xl" style={{ width: 44, height: 44 }} />
            <SkeletonGroup.Item className="rounded-full" style={{ width: 120, height: 44 }} />
          </View>
        </View>

        {/* Name, Username, Bio */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 150, height: 24 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 100, height: 16 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: '80%', height: 16 }} />
        </View>

        {/* Cards Scroll */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, overflow: 'hidden' }}>
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
        </View>

        {/* Counts */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, alignSelf: 'center', backgroundColor: colors.card, padding: 4, borderRadius: 16 }}>
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
        </View>

        {/* Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonGroup.Item key={i} className="rounded-lg" style={{ width: '31%', aspectRatio: 1 }} />
          ))}
        </View>
      </SkeletonGroup>
    </View>
  );
};

const ProfileSkeleton: React.FC = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  return (
    <View style={common.screen}>
      <ProfileSkeletonInner insets={insets} />
    </View>
  );
};

// ─── ProfileContent — PagerWithHeader-based architecture ───────────────────────
const ProfileContent = () => {
  const {
    colors,
    theme,
    common,
    inset,
    router,
    isMe,
    isOwner,
    listRef,
    musicSheetRef,
    socialSheetRef,
    addressSheetRef,
    workplaceSheetRef,
    familySheetRef,
    briefSheetRef,
    optionsSheetRef,
    likersSheetRef,
    commentsSheetRef,
    blurTargetRef,
    profile,
    isProfileLoading,
    isProfileRefetching,
    isProfilePlaceholder,
    myProfile,
    selectedTab,
    activeTab,
    music,
    socialLinks,
    addresses,
    workplaces,
    photos,
    videos,
    feedPosts,
    hasMusic,
    currentTrack,
    imageCount,
    videoCount,
    postCount,
    isPhotosLoading,
    isVideosLoading,
    isFeedLoading,
    isFetchingNextPhotos,
    isFetchingNextVideos,
    galleryVisible,
    galleryIndex,
    snackbarVisible,
    selectedPost,
    selectedLikePostId,
    selectedCommentPostId,
    scrollY,
    showScrollTop,
    showHeaderAvatar,
    scrollTopButtonOpacity,
    onScroll,
    onScrollYChange,
    stableTabChange,
    handleVideoPress,
    handleImagePress,
    handleMusicPress,
    onRefresh,
    handleEndReached,
    handleMusicEndReached,
    handleSocialEndReached,
    handleAddressesEndReached,
    handleWorkplacesEndReached,
    handlePostDeleted,
    handlePostOptionsPress,
    handleLikeCountPress,
    handleCommentPress,
    handleCommentSheetDismiss,
    handleLikersSheetDismiss,
    scrollToTop,
    dismissSnackbar,
    closeGallery,
    isMusicPlaying,
    safePresent,
  } = useProfileViewModel();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();

  // ─── Header avatar spring animation (native thread via Reanimated) ───
  const headerAvatarProgress = useSharedValue(0);

  useEffect(() => {
    headerAvatarProgress.value = withSpring(showHeaderAvatar ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [showHeaderAvatar, headerAvatarProgress]);

  const headerAvatarContainerStyle = useAnimatedStyle(() => {
    const progress = headerAvatarProgress.value;
    return {
      opacity: progress,
      transform: [
        { scale: interpolate(progress, [0, 1], [0.6, 1], 'clamp') },
        { translateY: interpolate(progress, [0, 1], [10, 0], 'clamp') },
      ],
    };
  });

  const musicPillContainerStyle = useAnimatedStyle(() => {
    const progress = headerAvatarProgress.value;
    const translateX = interpolate(progress, [0, 1], [-48, 0], 'clamp');
    return {
      transform: [{ translateX }],
    };
  });

  // Grid Hooks (chunked rows for List with numColumns=1)
  const {
    chunkedGridData: imageChunkedRows,
    renderChunkedRow: renderImageChunkedRow,
    chunkedKeyExtractor: imageChunkedKeyExtractor,
    estimatedItemSize: imageEstimatedItemSize,
    renderQuickPreview: renderImageQuickPreview,
  } = useImageGrid({
    photos: photos,
    onImagePress: handleImagePress,
    loading: isPhotosLoading,
    fetchingMore: isFetchingNextPhotos
  });

  const {
    chunkedGridData: videoChunkedRows,
    renderChunkedRow: renderVideoChunkedRow,
    chunkedKeyExtractor: videoChunkedKeyExtractor,
    estimatedItemSize: videoEstimatedItemSize,
    renderQuickPreview: renderVideoQuickPreview,
    mediaViewerItems: videoMediaViewerItems,
  } = useImageGrid({
    photos: videos,
    onVideoPress: handleVideoPress,
    loading: isVideosLoading,
    fetchingMore: isFetchingNextVideos
  });

  // ─── Tab items for PagerWithHeader ────────────────────────────────
  const tabItems = useMemo(() => [
    t("profile.tabs.feed"),
    t("profile.tabs.images"),
    t("profile.tabs.videos"),
  ], [t]);

  const tabKeys = useMemo(() => ["Feed", "Images", "Videos"], []);

  // ─── Page selection tracking ──────────────────────────────────────
  const onPageSelected = useCallback((index: number) => {
    const tabKey = tabKeys[index] as "Feed" | "Images" | "Videos";
    stableTabChange(tabKey);
  }, [tabKeys, stableTabChange]);

  // ─── Header renderer for PagerWithHeader ──────────────────────────
  const renderHeader = useCallback(({ setMinimumHeight }: { setMinimumHeight: (h: number) => void }) => {
    // Tell PagerWithHeader: when collapsed, keep this much header visible
    // so the tab bar sticks below the floating back button + music pill.
    // Floating overlay: top = inset.top + 8, height = 40, gap = 8 → total = inset.top + 56
    setMinimumHeight(inset.top + 56);

    return (
      <ProfileHeaderV3
        scrollY={scrollY}
        activeTab={selectedTab as any}
        onTabChange={stableTabChange}
        profile={profile}
        isMe={isMe}
        isOwner={isOwner}
        musicSheetRef={musicSheetRef}
        socialSheetRef={socialSheetRef}
        addressSheetRef={addressSheetRef}
        workplaceSheetRef={workplaceSheetRef}
        workplaces={workplaces}
        music={music}
        socialLinks={socialLinks}
        addresses={addresses}
        imageCount={imageCount}
        videoCount={videoCount}
        postCount={postCount}
        familySheetRef={familySheetRef}
        briefSheetRef={briefSheetRef}
        onPresentSheet={safePresent}
      />
    );
  }, [scrollY, selectedTab, stableTabChange, profile, isMe, isOwner, musicSheetRef, socialSheetRef, addressSheetRef, workplaceSheetRef, workplaces, music, socialLinks, addresses, imageCount, videoCount, postCount, familySheetRef, briefSheetRef, safePresent, inset.top]);

  // ─── Tab bar renderer for PagerWithHeader ──────────────────────────
  const renderTabBar = useCallback(({ items, currentPage, onSelect }: {
    items: string[]
    currentPage: number
    onSelect?: (index: number) => void
  }) => {
    const activeTabVal = tabKeys[currentPage];
    return (
      <View style={{ paddingHorizontal: 12 }}>
        <Tabs
          value={activeTabVal}
          onValueChange={(val: any) => {
            const idx = tabKeys.indexOf(val);
            if (idx !== -1) onSelect?.(idx);
          }}
          style={{ paddingHorizontal: 0, marginBottom: 0 }}
        >
          <Tabs.List>
            <Tabs.ScrollView scrollAlign="center">
              <Tabs.Indicator />
              {tabKeys.map((key, i) => (
                <Tabs.Trigger key={key} value={key}>
                  <Tabs.Label>{items[i]}</Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.ScrollView>
          </Tabs.List>
        </Tabs>
      </View>
    );
  }, [tabKeys]);

  // ─── Empty component factory ──────────────────────────────────────
  const makeEmptyComponent = useCallback((tabKey: string) => {
    const isLoading =
      (tabKey === "Images" && isPhotosLoading) ||
      (tabKey === "Videos" && isVideosLoading) ||
      (tabKey === "Feed" && isFeedLoading);

    if (isLoading) {
      return (
        <View style={{ paddingVertical: 80, justifyContent: 'center', alignItems: 'center' }}>
          <Spinner size="lg" color={colors.secondary} />
        </View>
      );
    }

    let title = "";
    let message = "";
    switch (tabKey) {
      case "Images":
        title = t("profile.empty.images.title");
        message = t("profile.empty.images.message");
        break;
      case "Videos":
        title = t("profile.empty.videos.title");
        message = t("profile.empty.videos.message");
        break;
      case "Feed":
        title = t("profile.empty.feed.title");
        message = t("profile.empty.feed.message");
        break;
    }
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <FlexText style={common.subheading}>{title}</FlexText>
        <FlexText style={[common.body, styles.emptyMessage]}>{message}</FlexText>
      </View>
    );
  }, [common, t, isPhotosLoading, isVideosLoading, isFeedLoading, colors.secondary]);

  // ─── Feed tab renderer ────────────────────────────────────────────
  const renderFeedTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <List
        ref={scrollElRef as React.RefObject<FlatList>}
        data={feedPosts}
        renderItem={({ item }: { item: Post }) => (
          <PostItem
            post={item}
            key={item.id}
            onOptionsPress={handlePostOptionsPress}
            onLikeCountPress={handleLikeCountPress}
            onCommentPress={handleCommentPress}
          />
        )}
        keyExtractor={(item: Post) => item.id || String(Math.random())}
        headerOffset={headerHeight}
        progressBackgroundColor={colors.card}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={isProfileRefetching}
        onRefresh={onRefresh}
        refreshTintColor={colors.text}
        progressViewOffset={headerHeight}
        onEndReached={() => {
          if (activeTab === "Feed") handleEndReached();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={makeEmptyComponent("Feed")}
        contentContainerStyle={{ minHeight: windowHeight + headerHeight, paddingBottom: isMe ? 100 + inset.bottom : inset.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        onScrollY={onScrollYChange}
        ListHeaderComponent={<View style={{ height: 12 }} />}
      />
    );
  }, [colors.card, feedPosts, handlePostOptionsPress, handleLikeCountPress, handleCommentPress, isProfileRefetching, onRefresh, colors.text, inset, isMe, handleEndReached, activeTab, makeEmptyComponent, onScrollYChange, windowHeight]);

  // ─── Images tab renderer ──────────────────────────────────────────
  const renderImagesTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <List
        ref={scrollElRef as React.RefObject<FlatList>}
        data={imageChunkedRows}
        renderItem={({ item, index }: any) => renderImageChunkedRow({ item, index, separators: {} as any })}
        keyExtractor={(item: any, index: number) => imageChunkedKeyExtractor(item, index)}
        headerOffset={headerHeight}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={5}
        progressBackgroundColor={colors.card}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={isProfileRefetching}
        onRefresh={onRefresh}
        refreshTintColor={colors.text}
        progressViewOffset={headerHeight}
        onEndReached={() => {
          if (activeTab === "Images") handleEndReached();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={makeEmptyComponent("Images")}
        contentContainerStyle={{ minHeight: windowHeight + headerHeight, paddingBottom: isMe ? 100 + inset.bottom : inset.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        onScrollY={onScrollYChange}
        ListHeaderComponent={<View style={{ height: 12 }} />}
      />
    );
  }, [colors.card, imageChunkedRows, renderImageChunkedRow, imageChunkedKeyExtractor, isProfileRefetching, onRefresh, colors.text, inset, isMe, handleEndReached, activeTab, makeEmptyComponent, onScrollYChange, windowHeight]);

  // ─── Videos tab renderer ──────────────────────────────────────────
  const renderVideosTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <MediaViewerWrapper items={videoMediaViewerItems}>
        <List
          ref={scrollElRef as React.RefObject<FlatList>}
          data={videoChunkedRows}
          renderItem={({ item, index }: any) => renderVideoChunkedRow({ item, index, separators: {} as any })}
          keyExtractor={(item: any, index: number) => videoChunkedKeyExtractor(item, index)}
          headerOffset={headerHeight}
          initialNumToRender={6}
          windowSize={5}
          maxToRenderPerBatch={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshing={isProfileRefetching}
          onRefresh={onRefresh}
          refreshTintColor={colors.text}
          progressBackgroundColor={colors.card}
          progressViewOffset={headerHeight}
          onEndReached={() => {
            if (activeTab === "Videos") handleEndReached();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={makeEmptyComponent("Videos")}
          contentContainerStyle={{ minHeight: windowHeight + headerHeight, paddingBottom: isMe ? 100 + inset.bottom : inset.bottom + 10 }}
          showsVerticalScrollIndicator={false}
          onScrollY={onScrollYChange}
          ListHeaderComponent={<View style={{ height: 12 }} />}
        />
      </MediaViewerWrapper>
    );
  }, [videoChunkedRows, renderVideoChunkedRow, videoChunkedKeyExtractor, isProfileRefetching, onRefresh, colors.text, inset, isMe, handleEndReached, activeTab, makeEmptyComponent, onScrollYChange, videoMediaViewerItems, windowHeight]);

  // Loading / Error state
  if (!profile) {
    return (
      <View style={common.screen}>
        <ScrollView
          style={common.screen}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isProfileRefetching}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.text]}
              style={{ zIndex: 10 }}
              progressViewOffset={inset.top + 56}
            />
          }
        >
          <ProfileSkeletonInner insets={inset} />
        </ScrollView>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={dismissSnackbar}
          action={{
            label: t("profile.actions.retry"),
            onPress: onRefresh,
          }}>
          {t("profile.errors.failedToLoadProfile")}
        </Snackbar>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={common.screen}>
        <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
          {renderImageQuickPreview()}
          {renderVideoQuickPreview()}
          <ProfileGalleryModal
            visible={galleryVisible}
            photos={photos}
            music={music}
            initialIndex={galleryIndex}
            onClose={closeGallery}
            profileName={profile?.name}
            isVerified={profile?.is_verified}
          />
          <GalleryModal />

          {/* ─── PagerWithHeader: the collapsible header + tab architecture ─── */}
          <PagerWithHeader
            items={tabItems}
            isHeaderReady={!!profile}
            renderHeader={renderHeader}
            renderTabBar={renderTabBar}
            initialPage={tabKeys.indexOf(selectedTab as string)}
            onPageSelected={onPageSelected}
            allowHeaderOverScroll>
            {renderFeedTab}
            {renderImagesTab}
            {renderVideosTab}
          </PagerWithHeader>
        </BlurTargetView>

        {/* Floating back button + avatar + music pill overlay */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: inset.top + 8, left: 16, zIndex: 1, right: 16 }}>
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center' }}>

            {/* Back Button */}
            <BlurView
              tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
              intensity={80}
              blurTarget={blurTargetRef}
              blurMethod="dimezisBlurViewSdk31Plus"
              style={{
                borderRadius: 999,
                overflow: 'hidden',
                marginRight: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  borderRadius: 999,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name='chevron-back' size={24} color={colors.text} />
              </TouchableOpacity>
            </BlurView>

            {/* Header Avatar — springs in when scrolled past profile avatar */}
            <Reanimated.View
              style={[
                {
                  width: 40,
                  height: 40,
                  marginRight: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                headerAvatarContainerStyle,
              ]}
            >
              <TouchableOpacity activeOpacity={0.8} onPress={scrollToTop}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={
                      profile?.avatar_url
                        ? { uri: profile.avatar_url }
                        : profile?.gender === 'male'
                          ? require('../../assets/images/AV17.png')
                          : require('../../assets/images/AV86.png')
                    }
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
              </TouchableOpacity>
            </Reanimated.View>

            {/* Music Pill Wrapper with Translation */}
            <Reanimated.View style={musicPillContainerStyle}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => safePresent(musicSheetRef)}
                style={{ height: 40, width: 150 }}
              >
                <BlurView tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"} intensity={80} blurTarget={blurTargetRef} blurMethod="dimezisBlurView" style={styles.blurWrapper}>
                  <View
                    style={[StyleSheet.absoluteFill, {}]}
                  />

                  <View style={styles.blurContent}>
                    <SpinningArtwork
                      isMusicPlaying={isMusicPlaying}
                      hasMusic={hasMusic}
                      coverUrl={currentTrack?.cover_url}
                      onPress={handleMusicPress}
                      colors={colors}
                    />

                    <View style={styles.textContainer}>
                      <FlexText
                        style={[styles.titleText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {hasMusic ? currentTrack?.title : t("profile.music.addMusic")}
                      </FlexText>
                      <FlexText
                        style={[styles.artistText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {hasMusic ? currentTrack?.artist : t("profile.music.selectTrack")}
                      </FlexText>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </Reanimated.View>

          </View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={dismissSnackbar}
          action={{
            label: t("profile.actions.retry"),
            onPress: onRefresh,
          }}>
          {t("profile.errors.failedToLoadProfile")}
        </Snackbar>


        <MusicSheet
          ref={musicSheetRef}
          data={music}
          profileId={profile?.id}
          onEndReached={handleMusicEndReached}
          isOwner={isOwner}
        />
        <SocialSheet
          ref={socialSheetRef}
          data={socialLinks}
          profileId={profile?.id}
          isOwner={isOwner}
          onEndReached={handleSocialEndReached}
        />
        <AddressSheet
          ref={addressSheetRef}
          data={addresses}
          profileId={profile?.id}
          isOwner={isOwner}
          onEndReached={handleAddressesEndReached}
        />
        <WorkplaceSheet
          ref={workplaceSheetRef}
          data={workplaces}
          profileId={profile?.id}
          isOwner={isOwner}
          onEndReached={handleWorkplacesEndReached}
        />
        <RelationshipSheet
          ref={familySheetRef}
          data={profile?.loved_ones || []}
        />
        <BriefInfoSheet
          ref={briefSheetRef}
          profile={profile}
          workplaces={workplaces}
          homeInfo={profile?.hometown || null}
        />
        <PostOptionsSheet
          ref={optionsSheetRef}
          post={selectedPost}
          currentProfileId={myProfile?.id || null}
          onDeleted={handlePostDeleted}
        />
        <LikersSheet
          ref={likersSheetRef}
          postId={selectedLikePostId}
          onDismiss={handleLikersSheetDismiss}
        />
        <CommentsSheet
          ref={commentsSheetRef}
          postId={selectedCommentPostId}
          onDismiss={handleCommentSheetDismiss}
        />
        <TranslationLanguageSheet />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyMessage: {
    marginTop: 8,
  },
  touchableContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  artworkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  artworkPlaying: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  placeholderIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  artistText: {
    fontSize: 11,
    opacity: 0.7,
    lineHeight: 14,
  },
  blurWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    height: 40,
    maxWidth: 200,
    justifyContent: 'center',
  },
  blurContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
    height: '100%',
    gap: 8,
  },
});

// ─── ProfileScreen shell ──────────────────────────────────────────────────────
const ProfileScreen = () => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const handle = requestIdleCallback(() => {
      setIsReady(true);
    });
    return () => cancelIdleCallback(handle);
  }, []);

  if (!isReady) {
    return <ProfileSkeleton />;
  }

  return <ProfileContent />;
};

export default ProfileScreen;
