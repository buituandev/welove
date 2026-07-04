import { useCarouselColorStore } from "@/stores/carouselColor";
import { useSettingsStore } from "@/stores/settings";
import type { LikersSheetHandle } from "@/types/sheetHandles";
import { Post } from "@/types/post";
import type { PostOptionsSheetHandle } from "@/components/post/PostOptionsSheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useProfile } from "../services/userprofile";
import { createCommonStyles } from "../styles/common";

const HEADER_HEIGHT = 75;
const TABS_HEIGHT = 50;
const SCROLL_THRESHOLD = 10;

export const useHomeViewModel = () => {
  const router = useRouter();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<View | null>(null);

  // ─── Current User Profile ──────────────────────────────────────
  const { data: myProfile } = useProfile("me", true);

  // ─── Post Options Sheet ────────────────────────────────────────
  const optionsSheetRef = useRef<PostOptionsSheetHandle>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ─── Likers Sheet ───────────────────────────────────────────────
  const likersSheetRef = useRef<LikersSheetHandle>(null);
  const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(
    null,
  );

  // ─── Comments Sheet ─────────────────────────────────────────────
  const commentsSheetRef = useRef<TrueSheet>(null);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<
    string | null
  >(null);
  /**
   * pendingCommentOpen — set to true when the user taps the comment button.
   * A useEffect watches this flag and calls present() only after React has
   * committed the new selectedCommentPostId to the tree, avoiding the
   * "TrueSheetView with tag X not found" race on low-end devices.
   */
  const pendingCommentOpen = useRef(false);

  // ─── Carousel Color Store ──────────────────────────────────────
  const { overlayColor, isUsingCarouselColor } = useCarouselColorStore();

  // ─── Carousel Settings ─────────────────────────────────────────
  const { showCarousel: carouselEnabled } = useSettingsStore();
  const isCarouselVisible = useRef(true);
  const [carouselVisibility] = useState(() => new Animated.Value(1));
  const [modalVisible, setModalVisible] = useState(false);

  // ─── Carousel Color Tracking ───────────────────────────────────
  const [useCarouselColor, setUseCarouselColor] = useState(false);

  useEffect(() => {
    const listenerId = carouselVisibility.addListener(({ value }) => {
      const shouldShow = value > 0.5;
      setUseCarouselColor(
        shouldShow && carouselEnabled && isUsingCarouselColor,
      );
    });

    return () => {
      carouselVisibility.removeListener(listenerId);
    };
  }, [carouselVisibility, carouselEnabled, isUsingCarouselColor]);

  useEffect(() => {
    if (isCarouselVisible.current && carouselEnabled && isUsingCarouselColor) {
      setUseCarouselColor(true);
    }
  }, [isUsingCarouselColor, carouselEnabled]);

  // ─── Icon Color ────────────────────────────────────────────────
  const iconColor = useMemo(() => {
    if (useCarouselColor) {
      return overlayColor === "#000000" ? "#000000" : "#FFFFFF";
    }
    return colors.onSurface;
  }, [useCarouselColor, overlayColor, colors.onSurface]);

  // ─── Scroll Animation ──────────────────────────────────────────
  const [scrollY] = useState(() => new Animated.Value(0));
  const [tabVisibility] = useState(() => new Animated.Value(1));
  const lastScrollY = useRef(0);
  const isTabVisible = useRef(true);

  const tabOpacity = tabVisibility;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerPillVisibility = tabVisibility;

  const pillBgOpacity = carouselVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const pillBgColor = useMemo(() => colors.surfaceContainerLow + "E6", [colors.surfaceContainerLow]);

  // ─── Layout Constants ──────────────────────────────────────────
  const totalHeaderHeight = HEADER_HEIGHT + TABS_HEIGHT;

  // ─── Handlers ──────────────────────────────────────────────────
  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const openSettingsPage = useCallback(() => {
    router.navigate("/settings");
  }, [router]);

  const onScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        if (diff > 0 && isTabVisible.current && currentScrollY > 50) {
          isTabVisible.current = false;
          Animated.spring(tabVisibility, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else if (diff < 0 && !isTabVisible.current) {
          isTabVisible.current = true;
          Animated.spring(tabVisibility, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      }

      const shouldShowCarousel = currentScrollY <= 10;
      if (shouldShowCarousel !== isCarouselVisible.current) {
        isCarouselVisible.current = shouldShowCarousel;
        Animated.timing(carouselVisibility, {
          toValue: shouldShowCarousel ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        setUseCarouselColor(
          shouldShowCarousel && carouselEnabled && isUsingCarouselColor,
        );
      }
    },
    [carouselEnabled, isUsingCarouselColor, tabVisibility, carouselVisibility],
  );

  const handlePostOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);

  const handlePostDeleted = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleLikeCountPress = useCallback((post: Post) => {
    setSelectedLikePostId(post.id);
    likersSheetRef.current?.present();
  }, []);

  // Fire present() after React commits the new selectedCommentPostId.
  // On low-end devices, calling present() synchronously with setState causes
  // the native TrueSheetView to be destroyed mid-animation when the component
  // re-renders with the new postId, resulting in "TrueSheetView with tag X not found".
  useEffect(() => {
    if (pendingCommentOpen.current && selectedCommentPostId) {
      pendingCommentOpen.current = false;
      commentsSheetRef.current?.present();
    }
  }, [selectedCommentPostId]);

  const handleCommentPress = useCallback((post: Post) => {
    pendingCommentOpen.current = true;
    setSelectedCommentPostId(post.id);
    // NOTE: present() is NOT called here — the useEffect above fires it
    // after React has committed the new postId, preventing the native
    // TrueSheetView tag mismatch crash on low-end devices.
  }, []);

  const handleCommentSheetDismiss = useCallback(() => {
    setSelectedCommentPostId(null);
  }, []);

  const handleLikersSheetDismiss = useCallback(() => {
    setSelectedLikePostId(null);
  }, []);

  const handleTabStateChange = useCallback(() => {
    if (!isTabVisible.current) {
      isTabVisible.current = true;
      Animated.spring(tabVisibility, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
    lastScrollY.current = 0;
  }, [tabVisibility]);

  const navigateToSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  const navigateToBookmarks = useCallback(() => {
    router.push("/bookmarks");
  }, [router]);

  const navigateToCreate = useCallback(() => {
    router.push("/create");
  }, [router]);

  // ─── Return ViewModel ──────────────────────────────────────────
  return {
    // Theme & Layout
    colors,
    typography,
    theme,
    common,
    insets,
    headerHeight: HEADER_HEIGHT,
    tabsHeight: TABS_HEIGHT,
    totalHeaderHeight,
    blurTargetRef,

    // Profile
    myProfile,

    // Post Options
    optionsSheetRef,
    selectedPost,

    // Likers Sheet
    likersSheetRef,
    selectedLikePostId,

    // Comments Sheet
    commentsSheetRef,
    selectedCommentPostId,

    // Carousel
    carouselEnabled,
    carouselVisibility,

    // Modal
    modalVisible,
    setModalVisible,

    // Colors
    iconColor,

    // Animations
    headerBgOpacity,
    headerPillVisibility,
    tabOpacity,
    pillBgOpacity,
    pillBgColor,

    // Handlers
    openModal,
    openSettingsPage,
    onScroll,
    handlePostOptionsPress,
    handlePostDeleted,
    handleLikeCountPress,
    handleCommentPress,
    handleCommentSheetDismiss,
    handleLikersSheetDismiss,
    handleTabStateChange,
    navigateToSearch,
    navigateToBookmarks,
    navigateToCreate,
  };
};
