import { FlexText } from "@/components/FlexText";
import { appleIntelli } from "@/components/glow/AppleIntelliConfig";
import { MostSearchedSection } from "@/components/search/MostSearchedSection";
import { renderEmptyState } from "@/components/search/SearchEmpty";
import { renderFooter } from "@/components/search/SearchFooter";
import { SearchHistoryPills } from "@/components/search/SearchHistoryPills";
import { SearchProfileItem } from "@/components/search/SearchProfileItem";
import { renderProfileSkeleton } from "@/components/search/SearchProfileSkeleton";
import { TrendingHashtagsSection } from "@/components/search/TrendingHashtagsSection";
import { Profile } from "@/types/profile";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AnimatedGlow from "react-native-animated-glow";
import Animated from "react-native-reanimated";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { useSearchViewModel } from "../../viewmodels/SearchViewModel";

const FlashList = FlashListOriginal as any;

const SearchContent = () => {
  const navigation = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { t } = useTranslation();

  // ─── ViewModel ─────────────────────────────────────────────────
  const {
    searchQuery,
    isFocused,
    isAdmin,
    profiles,
    totalResults,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    inputRef,
    listRef,
    insets,
    baseSearchBarBottom,
    contentBottomPadding,
    animatedSearchBarStyle,
    handleSearchChange,
    clearSearch,
    handleFocus,
    handleBlur,
    handleRefresh,
    handleEndReached,
    handleProfilePress,
    recentQueries,
    selectRecentQuery,
    removeRecentQuery,
  } = useSearchViewModel();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Profile>) => (
      <SearchProfileItem
        item={item}
        colors={colors}
        styles={styles}
        common={common}
        navigation={navigation}
        onPress={handleProfilePress}
        isFirst={index === 0}
        isLast={index === profiles.length - 1}
      />
    ),
    [colors, common, navigation, handleProfilePress, profiles.length],
  );

  const ListEmptyComponent = useCallback(
    () =>
      renderEmptyState({
        colors,
        styles,
        common,
        searchQuery,
        isAdmin,
        t,
      }),
    [colors, common, searchQuery, isAdmin, t],
  );

  const ListFooterComponent = useCallback(
    () =>
      renderFooter({
        isFetchingNextPage,
        colors,
        styles,
        renderProfileSkeleton,
      }),
    [isFetchingNextPage, colors],
  );

  const ListHeaderComponent = useCallback(
    () =>
      !searchQuery ? (
        <View style={{ paddingBottom: 8 }}>
          <MostSearchedSection />
          <TrendingHashtagsSection />
        </View>
      ) : null,
    [searchQuery],
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Floating back button — same pattern as Bookmarks/Settings */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            if (Platform.OS === "android") {
              setTimeout(() => {
                navigation.back();
              }, 50);
            } else {
              navigation.back();
            }
          }}
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={[styles.header, { marginTop: insets.top + 66 }]}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>{t('search.header.title')}</FlexText>
        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
          {searchQuery
            ? t('search.header.resultsCount', { count: totalResults })
            : isAdmin
              ? t('search.header.peopleCount', { count: totalResults })
              : t('search.header.exploreSubtitle')}
        </FlexText>
      </View>

      {/* Content */}
      {isLoading ? (
        <FlashList
          data={[1, 2, 3, 4, 5, 6, 7, 8]}
          renderItem={({ index }: any) => renderProfileSkeleton({
            colors,
            styles,
            isFirst: index === 0,
            isLast: index === 7,
          })}
          keyExtractor={(item: any) => item.toString()}
          contentContainerStyle={[
            styles.listContent,
            { gap: 3 },
            { paddingBottom: contentBottomPadding },
          ]}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          estimatedItemSize={80}
        />
      ) : (
        <FlatList
          ref={listRef as any}
          data={profiles}
          renderItem={renderItem}
          keyExtractor={(item: Profile) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { gap: 3 },
            { paddingBottom: contentBottomPadding },
            profiles.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // ItemSeparatorComponent={ITEM_SEPARATOR}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.onSurface}
              colors={[colors.onSurface]}
              progressBackgroundColor={colors.surfaceContainerHigh}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
        />
      )}

      {/* Floating Search Bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          { bottom: baseSearchBarBottom },
          animatedSearchBarStyle,
        ]}
      >
        {isFocused && recentQueries.length > 0 && (
          <SearchHistoryPills
            queries={recentQueries}
            colors={colors}
            onSelect={selectRecentQuery}
            onRemove={removeRecentQuery}
          />
        )}
        <AnimatedGlow
          preset={appleIntelli}
          activeState={isFocused ? "press" : "default"}
          style={{ borderRadius: 999 }}
        >
          <View style={[styles.searchBar]}>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: "white", marginLeft: 12 }]}
              placeholder={t('search.searchBar.placeholder')}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <View
                  style={[
                    styles.clearButtonInner,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={colors.text}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedGlow>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const SearchScreen = () => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const handle = requestIdleCallback(() => {
      setIsReady(true);
    });
    return () => cancelIdleCallback(handle);
  }, []);

  const { colors } = useThemeContext();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return <SearchContent />;
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileInfo: {
    flex: 1,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  searchBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 999,
    paddingHorizontal: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchScreen;
