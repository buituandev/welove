import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { SearchHistoryPills } from "@/components/search/SearchHistoryPills";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { SearchType, useTypedSearchInfinite, useSearchSuggestions } from "@/hooks/useMovies";
import {
  addSearchQueryToHistory,
  getSearchQueryHistory,
  removeSearchQueryFromHistory,
} from "@/stores/searchQueryHistory";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const SEARCH_BAR_HEIGHT = 58;

const getImageUrl = (path: string | null | undefined, size: number = 342) => {
  if (!path) return `https://via.placeholder.com/${size}x513?text=No+Image`;
  return `https://image.tmdb.org/t/p/w${size}${path}`;
};

const CATEGORIES = [
  { name: "Popular", mode: "popular", title: "Popular Movies" },
  { name: "Now Playing", mode: "now_playing", title: "Now Playing" },
  { name: "Upcoming", mode: "upcoming", title: "Upcoming" },
  { name: "Top Rated", mode: "top_rated", title: "Top Rated" },
];

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchMoviesScreen = () => {
  const router = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const inputRef = useRef<TextInput>(null);
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>(() =>
    getSearchQueryHistory("movies"),
  );

  const debouncedSearchText = useDebounce(searchText, 300);

  const showSuggestions =
    isFocused &&
    searchText.trim().length > 2 &&
    searchText.trim() !== (submittedQuery || "");

  const { data: suggestions } = useSearchSuggestions(
    showSuggestions ? debouncedSearchText : "",
    searchType,
  );

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    isError,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useTypedSearchInfinite(submittedQuery ?? "", searchType);

  const items = useMemo<any[]>(
    () => data?.pages.flatMap((p: any) => p.results) ?? [],
    [data],
  );

  // Keep the absolute search bar above the keyboard.
  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const submitSearch = useCallback(() => {
    const q = searchText.trim();

    if (!q) {
      setSubmittedQuery(null);
      return;
    }

    // Same query pressed again → just refetch all pages from page 1.
    if (submittedQuery === q) {
      refetch();
      return;
    }

    // New query — changing the key resets the infinite query automatically.
    setSubmittedQuery(q);
  }, [refetch, searchText, submittedQuery]);

  /** Called when the keyboard's search button is pressed. Saves + searches. */
  const handleSubmitEditing = useCallback(() => {
    const q = searchText.trim();
    if (q) {
      addSearchQueryToHistory("movies", q);
      setRecentQueries(getSearchQueryHistory("movies"));
    }
    submitSearch();
  }, [searchText, submitSearch]);

  /** Called when the input loses focus. Saves whatever is typed (if non-empty). */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const q = searchText.trim();
    if (q) {
      addSearchQueryToHistory("movies", q);
      setRecentQueries(getSearchQueryHistory("movies"));
    }
  }, [searchText]);

  const handleSuggestionPress = useCallback((suggestion: any) => {
    const itemMediaType = searchType === 'all' ? suggestion.media_type : searchType;
    const isMovie = itemMediaType === 'movie';
    const isPerson = itemMediaType === 'person';

    if (isMovie) {
      router.push({ pathname: "/movie_detail", params: { id: suggestion.id } });
    } else if (isPerson) {
      router.push({ pathname: "/person_detail", params: { id: suggestion.id } });
    } else {
      router.push({ pathname: "/tv_detail", params: { id: suggestion.id } });
    }
  }, [searchType, router]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSubmittedQuery(null);
    inputRef.current?.clear();
  }, []);

  const handleCategoryPress = useCallback(
    (category: any) => {
      router.push({
        pathname: "/movie_list",
        params: { mode: category.mode, title: category.title },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const itemMediaType = (searchType === 'all' ? item.media_type : searchType) || 'movie';
      const isMovie = itemMediaType === 'movie';
      const isPerson = itemMediaType === 'person';
      const isTV = itemMediaType === 'tv';

      const title = isMovie ? item.title : item.name;
      const dateRaw = isMovie ? item.release_date : (isTV ? item.first_air_date : undefined);
      const thumbnailPath = isPerson ? item.profile_path : item.poster_path;

      const handlePress = () => {
        if (isMovie) {
          router.push({ pathname: "/movie_detail", params: { id: item.id } });
        } else if (isPerson) {
          router.push({ pathname: "/person_detail", params: { id: item.id } });
        } else {
          router.push({ pathname: "/tv_detail", params: { id: item.id } });
        }
      };

      return (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.row,
            {
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <ExpoImage
            source={{ uri: getImageUrl(thumbnailPath) }}
            style={
              isPerson
                ? { width: 90, height: 90, borderRadius: 45 }
                : { width: 70, height: 105, borderRadius: 8 }
            }
            contentFit="cover"
            placeholder={{ blurhash: resolveBlurhash(item.blurhash, thumbnailPath || getImageUrl(thumbnailPath)) }}
          />
          <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
            <FlexText numberOfLines={2} style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </FlexText>
            <FlexText
              numberOfLines={1}
              style={[styles.description, { color: colors.onSurfaceVariant }]}
            >
              {isPerson ? item.known_for_department : `${itemMediaType === 'movie' ? 'Movie' : 'TV Show'}${dateRaw ? ` • ${new Date(dateRaw).getFullYear()}` : ''}`}
            </FlexText>
            {!isPerson && <IMDbBadge score={item.vote_average} textColor={colors.onSurface} />}
          </View>
        </Pressable>
      );
    },
    [colors, router, styles, searchType],
  );

  const ListHeaderComponent = useCallback(() => {
    if (submittedQuery) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <FlexText style={[common.heading, { fontSize: 18, marginBottom: 8 }]}>
          Explore
        </FlexText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.name}
              onPress={() => handleCategoryPress(c)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryPill}>
                <FlexText
                  numberOfLines={1}
                  style={{ color: colors.onSurface, fontWeight: "600" }}
                >
                  {c.name}
                </FlexText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [common.heading, colors.onSurface, handleCategoryPress, submittedQuery, styles.categoryPill]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading && submittedQuery) {
      const isPerson = searchType === 'person';
      return (
        <SkeletonGroup isLoading={true} variant="shimmer">
          <View style={{ padding: 16, gap: 12 }}>
            {[1, 2, 3, 4, 5].map((key) => (
              <View key={key} style={[styles.row, { padding: 0, marginBottom: 12 }]}>
                <SkeletonGroup.Item
                  style={[
                    styles.thumbnail,
                    !isPerson && { width: 70, height: 105, borderRadius: 8 }
                  ]}
                />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonGroup.Item style={{ height: 16, width: '80%', borderRadius: 4 }} />
                  <SkeletonGroup.Item style={{ height: 12, width: '60%', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
        </SkeletonGroup>
      );
    }

    if (!isLoading && submittedQuery && items.length === 0) {
      return (
        <View style={{ padding: 16, alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="search-outline" size={48} color={colors.onSurfaceVariant} />
          <FlexText style={{ color: colors.onSurface, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
            No results found
          </FlexText>
          <FlexText style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: "center" }}>
            We couldn&apos;t find anything matching &quot;{submittedQuery}&quot;. Try adjusting your search query.
          </FlexText>
        </View>
      );
    }

    return null;
  }, [isLoading, submittedQuery, searchType, styles, items.length, colors]);

  const ListFooterComponent = useCallback(() => {
    if (!submittedQuery || !hasNextPage) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <TouchableOpacity
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={[
            styles.loadMoreButton,
            { backgroundColor: colors.surfaceContainerHigh, opacity: isFetchingNextPage ? 0.7 : 1 },
          ]}
        >
          {isFetchingNextPage ? (
            <Spinner size="md" />
          ) : (
            <FlexText style={{ color: colors.onSurface, fontWeight: "700" }}>
              Load more
            </FlexText>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [colors, fetchNextPage, hasNextPage, isFetchingNextPage, submittedQuery, styles.loadMoreButton]);

  const contentBottomPadding = insets.bottom + SEARCH_BAR_HEIGHT + 24 + keyboardHeight;

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Floating back button */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
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

      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 66 }}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>
          Search
        </FlexText>
        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
          {submittedQuery
            ? `Results for "${submittedQuery}"`
            : "Type a name then press Enter to search."}
        </FlexText>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 16, marginBottom: 8, gap: 16 }}>
        {(['all', 'movie', 'tv', 'person'] as const).map(type => (
          <TouchableOpacity key={type} onPress={() => setSearchType(type)} style={{ paddingBottom: 8, borderBottomWidth: searchType === type ? 2 : 0, borderBottomColor: colors.primary }}>
            <FlexText style={{ color: searchType === type ? colors.onSurface : colors.onSurfaceVariant, fontWeight: searchType === type ? "700" : "500" }}>
              {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : type === 'tv' ? 'TV Shows' : 'People'}
            </FlexText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: contentBottomPadding,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.onSurface}
            colors={[colors.onSurface]}
            progressBackgroundColor={colors.surfaceContainerHigh}
            progressViewOffset={insets.top}
          />
        }
      />

      {/* Floating search bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            bottom: insets.bottom + 16 + keyboardHeight,
          },
        ]}
      >
        {isFocused && searchText.trim().length <= 2 && recentQueries.length > 0 && (
          <SearchHistoryPills
            queries={recentQueries}
            colors={colors}
            onSelect={(q) => {
              setSearchText(q);
              setSubmittedQuery(q);
              addSearchQueryToHistory("movies", q);
              setRecentQueries(getSearchQueryHistory("movies"));
            }}
            onRemove={(q) => {
              removeSearchQueryFromHistory("movies", q);
              setRecentQueries(getSearchQueryHistory("movies"));
            }}
          />
        )}

        {showSuggestions && suggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
            {suggestions.map((item: any) => {
              const itemMediaType = searchType === 'all' ? item.media_type : searchType;
              const isMovie = itemMediaType === 'movie';
              const isPerson = itemMediaType === 'person';
              const isTV = itemMediaType === 'tv';
              const title = isMovie ? item.title : item.name;
              const dateRaw = isMovie ? item.release_date : (isTV ? item.first_air_date : undefined);
              const thumbnailPath = isPerson ? item.profile_path : item.poster_path;
              const year = dateRaw ? new Date(dateRaw).getFullYear() : "";

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSuggestionPress(item)}
                  style={styles.suggestionItem}
                  activeOpacity={0.7}
                >
                  <ExpoImage
                    source={{ uri: getImageUrl(thumbnailPath, 92) }}
                    style={styles.suggestionThumbnail}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <FlexText numberOfLines={1} style={{ color: colors.onSurface, fontWeight: "600", fontSize: 14 }}>
                      {title}
                    </FlexText>
                    <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                      {isPerson ? item.known_for_department : `${itemMediaType === 'movie' ? 'Movie' : 'TV Show'}${year ? ` • ${year}` : ''}`}
                    </FlexText>
                  </View>
                  <Ionicons name="arrow-up-sharp" size={16} color={colors.onSurfaceVariant} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHighest }]}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={
              searchType === 'all'
                ? "Search movies, TV shows, people..."
                : searchType === 'movie'
                ? "Search movies..."
                : searchType === 'tv'
                ? "Search TV shows..."
                : "Search people..."
            }
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSubmitEditing}
            onFocus={() => {
              setIsFocused(true);
              setRecentQueries(getSearchQueryHistory("movies"));
            }}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <View
                style={[
                  styles.clearButtonInner,
                  { backgroundColor: colors.onTertiaryContainer + "20" },
                ]}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.onTertiaryContainer}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {isError && submittedQuery && (
          <View style={{ marginTop: 8 }}>
            <FlexText style={{ color: colors.error, fontWeight: "700" }}>
              Failed to load results.
            </FlexText>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 12,
      gap: 12,
    },
    suggestionsContainer: {
      borderRadius: 16,
      padding: 8,
      marginBottom: 8,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      borderRadius: 12,
      gap: 12,
    },
    suggestionThumbnail: {
      width: 36,
      height: 36,
      borderRadius: 4,
      backgroundColor: colors.outlineVariant,
    },
    thumbnail: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.outlineVariant,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
    },
    description: {
      fontSize: 13,
      fontWeight: "400",
    },
    searchBarContainer: {
      position: "absolute",
      left: 8,
      right: 8,
      borderRadius: 16,
      padding: 10,
      zIndex: 1000,
    },
    searchBar: {
      borderRadius: 999,
      height: SEARCH_BAR_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      paddingVertical: 0,
      paddingHorizontal: 6,
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
    categoryPill: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.surfaceContainerHigh,
    },
    loadMoreButton: {
      borderRadius: 99999,
      paddingVertical: 14,
      paddingHorizontal: 16,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default SearchMoviesScreen;
