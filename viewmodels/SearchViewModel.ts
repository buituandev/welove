import { queryClient } from "@/services/client";
import { ProfilesResponse, useAdminCheck, useInfiniteProfiles } from "@/services/userprofile";
import { useScrollStore } from "@/stores/scroll";
import { useSearchHistoryStore } from "@/stores/searchHistory";
import {
    addSearchQueryToHistory,
    getSearchQueryHistory,
    removeSearchQueryFromHistory,
} from "@/stores/searchQueryHistory";
import { Profile } from "@/types/profile";
import { useRouter } from "expo-router";
import { debounce, flatMap } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, TextInput } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bottom navigation layout constants
const SEARCH_BAR_HEIGHT = 56;

export const useSearchViewModel = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // ─── Search History (MMKV) ────────────────────────────────────
    const recordProfileClick = useSearchHistoryStore((s) => s.recordProfileClick);
    const updateProfilesBatch = useSearchHistoryStore((s) => s.updateProfilesBatch);

    // ─── Search State ──────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [recentQueries, setRecentQueries] = useState<string[]>(() =>
        getSearchQueryHistory("people"),
    );
    const inputRef = useRef<TextInput>(null);
    const listRef = useRef<any>(null);

    // ─── Auth / Admin Check ─────────────────────────────────────────
    useAdminCheck();
    const isAdmin = true; // adminData?.isAdmin ?? false;

    // ─── Data Fetching ─────────────────────────────────────────────
    // Admin: load all profiles on mount. Non-admin: only fetch when searching.
    const isQueryEnabled = isAdmin || debouncedSearchQuery.length > 0;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
        isLoading,
    } = useInfiniteProfiles(debouncedSearchQuery, isQueryEnabled);

    const profiles = useMemo(() => {
        return flatMap(data?.pages, (page: ProfilesResponse) => page.data);
    }, [data]);

    const totalResults = useMemo(() => {
        if (!data?.pages?.length) return 0;
        const firstPage = data.pages[0];
        if (debouncedSearchQuery && firstPage.pagination.totalMatches !== undefined) {
            return firstPage.pagination.totalMatches;
        }
        return firstPage.pagination.total;
    }, [data, debouncedSearchQuery]);

    // ─── Debounced Search ──────────────────────────────────────────
    const debouncedHandler = useMemo(
        () => debounce((text: string) => setDebouncedSearchQuery(text), 300),
        []
    );

    useEffect(() => {
        return () => {
            debouncedHandler.cancel();
        };
    }, [debouncedHandler]);

    const handleSearchChange = useCallback(
        (text: string) => {
            setSearchQuery(text);
            debouncedHandler(text);
        },
        [debouncedHandler]
    );

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setDebouncedSearchQuery("");
        inputRef.current?.blur();
        Keyboard.dismiss();
    }, []);

    // ─── Focus / Blur ─────────────────────────────────────────────
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setRecentQueries(getSearchQueryHistory("people"));
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        // Save the live query (not debounced) so we capture exactly what was typed.
        if (searchQuery.trim()) {
            addSearchQueryToHistory("people", searchQuery.trim());
            setRecentQueries(getSearchQueryHistory("people"));
        }
    }, [searchQuery]);

    // ─── Keyboard Blur on Hide ────────────────────────────────────
    useEffect(() => {
        const keyboardListener = Keyboard.addListener("keyboardDidHide", () => {
            inputRef.current?.blur();
        });
        return () => keyboardListener.remove();
    }, []);

    // ─── Keyboard Animation ───────────────────────────────────────
    // useReanimatedKeyboardAnimation runs entirely on the UI thread —
    // the bar tracks the keyboard frame-by-frame with no JS involvement.
    // height: SharedValue<number> — 0 (hidden) → -keyboardHeight (fully open)
    // progress: SharedValue<number> — 0 → 1
    const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();

    const baseSearchBarBottom = insets.bottom + 16;
    const contentBottomPadding = baseSearchBarBottom + SEARCH_BAR_HEIGHT + 16;

    // Derive translateY from the two shared values so the formula is correct
    // at both endpoints without knowing the keyboard height ahead of time:
    //   progress = 0, height = 0       → translateY = 0            (resting)
    //   progress = 1, height = -H      → translateY = -(H - insets.bottom + 8) (raised)
    const bottomInset = insets.bottom;
    const animatedSearchBarStyle = useAnimatedStyle(() => {
        "worklet";
        return {
            transform: [{
                translateY: keyboardHeight.value + keyboardProgress.value * (bottomInset - 8),
            }],
        };
    });

    // ─── Scroll to Top Trigger ────────────────────────────────────
    const trigger = useScrollStore((state) => state.triggers["search"]);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    // ─── Prefetching ──────────────────────────────────────────────
    useEffect(() => {
        if (profiles && profiles.length > 0) {
            const avatarsToPreload = profiles
                .slice(0, 20)
                .filter(
                    (p): p is Profile & { avatar_url: string } => !!p.avatar_url
                )
                .map((p) => p.avatar_url);

            if (avatarsToPreload.length > 0) {
                // If expo-image preload is available, you can use Image.prefetch(avatarsToPreload) here.
            }
        }
    }, [profiles]);

    // ─── Update Local Profile Cache ───────────────────────────────
    // When profiles are loaded/refreshed, silently update any cached
    // profiles so name/avatar stays current without resetting click counts.
    useEffect(() => {
        if (!isAdmin && profiles.length > 0) {
            updateProfilesBatch(
                profiles.map((p) => ({
                    id: p.id,
                    name: p.name,
                    avatar_url: p.avatar_url ?? null,
                    username: p.username,
                    is_verified: p.is_verified,
                    gender: p.gender,
                }))
            );
        }
    }, [profiles, isAdmin, updateProfilesBatch]);

    // ─── Profile Press (track + navigate) ────────────────────────
    const handleProfilePress = useCallback(
        (profile: Profile) => {
            recordProfileClick({
                id: profile.id,
                name: profile.name,
                avatar_url: profile.avatar_url ?? null,
                username: profile.username,
                is_verified: profile.is_verified,
                gender: profile.gender,
            });
            router.push({
                pathname: "/profile/[id]" as any,
                params: { id: profile.id, isMe: "false" },
            });
        },
        [recordProfileClick, router]
    );

    // ─── Refresh ──────────────────────────────────────────────────
    const handleRefresh = useCallback(async () => {
        if (!isQueryEnabled) return;
        queryClient.removeQueries({ queryKey: ["profiles"] });
        refetch();
    }, [refetch, isQueryEnabled]);

    // ─── Pagination ───────────────────────────────────────────────
    const handleEndReached = useCallback(() => {
        if (hasNextPage) fetchNextPage();
    }, [hasNextPage, fetchNextPage]);

    // ─── Recent query selection ────────────────────────────────────
    const selectRecentQuery = useCallback((q: string) => {
        setSearchQuery(q);
        setDebouncedSearchQuery(q);
        addSearchQueryToHistory("people", q);
        setRecentQueries(getSearchQueryHistory("people"));
    }, []);

    // ─── Recent query removal ─────────────────────────────────────
    const removeRecentQuery = useCallback((q: string) => {
        removeSearchQueryFromHistory("people", q);
        setRecentQueries(getSearchQueryHistory("people"));
    }, []);

    // ─── Return ViewModel ─────────────────────────────────────────
    return {
        // State
        searchQuery,
        debouncedSearchQuery,
        isFocused,
        isAdmin,
        profiles,
        totalResults,
        isLoading: isLoading && isQueryEnabled,
        isRefetching,
        isFetchingNextPage,

        // Refs
        inputRef,
        listRef,

        // Layout
        insets,
        baseSearchBarBottom,
        contentBottomPadding,

        // Animated
        animatedSearchBarStyle,

        // History
        recentQueries,
        selectRecentQuery,
        removeRecentQuery,

        // Handlers
        handleSearchChange,
        clearSearch,
        handleFocus,
        handleBlur,
        handleRefresh,
        handleEndReached,
        handleProfilePress,
    };
};
