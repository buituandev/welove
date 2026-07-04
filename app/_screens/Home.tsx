import AddCircle from "@/assets/images/svg/add-circle.svg";
import Magnifier from "@/assets/images/svg/ai-search.svg";
import Collection from "@/assets/images/svg/collection.svg";
import HomeCarousel from "@/components/HomeCarousel";
import OptionModal from "@/components/HomeOptionModal";
import SettingsIcon from "@/icons/settings";
import { useHomeViewModel } from "@/viewmodels/HomeViewModel";
import { Image as ExpoImage } from "expo-image";
import { useObserve } from "expo-observe";
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { CommentsSheet } from "../../components/post/CommentsSheet";
import { LikersSheet } from "../../components/post/LikersSheet";
import { PostOptionsSheet } from "../../components/post/PostOptionsSheet";
import { TranslationLanguageSheet } from "../../components/post/TranslationLanguageSheet";
import HomeTabs from "./home/HomeTabs";

const HomeScreen = () => {
  const vm = useHomeViewModel();
  const { markInteractive } = useObserve();

  React.useEffect(() => {
    markInteractive();
  }, [markInteractive]);
  const {
    common,
    carouselEnabled,
    carouselVisibility,
    modalVisible,
    setModalVisible,
    totalHeaderHeight,
    insets,
    headerBgOpacity,
    headerPillVisibility,
    pillBgColor,
    pillBgOpacity,
    navigateToSearch,
    iconColor,
    navigateToCreate,
    navigateToBookmarks,
    openSettingsPage,
    optionsSheetRef,
    selectedPost,
    myProfile,
    handlePostDeleted,
    likersSheetRef,
    selectedLikePostId,
    handleLikersSheetDismiss,
    commentsSheetRef,
    selectedCommentPostId,
    handleCommentSheetDismiss,
  } = vm;

  return (
    <>
      <View style={[common.screen, { position: "relative" }]}>
        {carouselEnabled && (
          <HomeCarousel animatedVisibility={carouselVisibility} />
        )}
        <OptionModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
        />
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: totalHeaderHeight + insets.top,
            zIndex: -10,
            opacity: headerBgOpacity,
          }}
        />
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            zIndex: 100,
            opacity: headerPillVisibility,
            transform: [
              {
                translateY: headerPillVisibility.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={[
              common.row,
              {
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              },
            ]}
          >
            <Animated.View
              style={[
                common.row,
                {
                  gap: 10,
                  padding: 8,
                  borderRadius: 100,
                  overflow: "hidden",
                  transform: [
                    {
                      scale: headerPillVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Animated background */}
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFill,
                  backgroundColor: pillBgColor,
                  opacity: pillBgOpacity,
                }}
              />
              <ExpoImage
                contentFit="cover"
                source={require("../../assets/images/logo_head.png")}
                style={{ width: 30, height: 30 }}
              />
            </Animated.View>

            <Animated.View
              style={[
                common.row,
                {
                  gap: 10,
                  padding: 8,
                  borderRadius: 100,
                  overflow: "hidden",
                  transform: [
                    {
                      scale: headerPillVisibility.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Animated background */}
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFill,
                  backgroundColor: pillBgColor,
                  opacity: pillBgOpacity,
                }}
              />
              <TouchableOpacity onPress={navigateToSearch}>
                <Magnifier width={24} height={24} color={iconColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToCreate}>
                <AddCircle width={26} height={26} color={iconColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToBookmarks}>
                <Collection width={24} height={24} color={iconColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openSettingsPage}>
                <SettingsIcon size={24} color={iconColor} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Material Top Tabs */}
        <HomeTabs vm={vm} />
      </View>
      <GalleryModal />
      <PostOptionsSheet
        ref={optionsSheetRef}
        post={selectedPost}
        currentProfileId={myProfile?.id || null}
        onDeleted={handlePostDeleted}
      />
      <LikersSheet ref={likersSheetRef} postId={selectedLikePostId} onDismiss={handleLikersSheetDismiss} />
      <CommentsSheet
        ref={commentsSheetRef}
        postId={selectedCommentPostId}
        onDismiss={handleCommentSheetDismiss}
      />
      <TranslationLanguageSheet />
    </>
  );
};

export default HomeScreen;
