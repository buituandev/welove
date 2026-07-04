import Magnifier from "@/assets/images/svg/search.svg";
import { MovieDBView } from "@/components/tracker/MovieDBView";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const MovieScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();
  const [headerScrollX] = useState(() => new Animated.Value(0));
  const [scrollY] = useState(() => new Animated.Value(0));

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[common.screen, { backgroundColor: "#000000" }]}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <MovieDBView headerScrollX={headerScrollX} scrollY={scrollY} />
      </BlurTargetView>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Animated.View
          style={{
            ...StyleSheet.absoluteFill,
            opacity: headerBgOpacity,
            overflow: "hidden",
          }}
        >
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={["black", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <BlurView
              blurTarget={blurTargetRef}
              intensity={80}
              tint="systemThickMaterialDark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={StyleSheet.absoluteFill}
            />
          </MaskedView>
        </Animated.View>
        <View
          style={{
            paddingTop: inset.top + 6,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ExpoImage source={require("../../assets/images/logo_head.png")} style={{ width: 50, height: 50 }} contentFit="contain" />
            <Text style={[styles.textStyle, { color: "white", fontSize: 42, fontWeight: "700" }]}>tv</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <TouchableOpacity
              onPress={() => router.push("/search_movies")}
              style={{
                borderRadius: 999,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Magnifier width={28} height={28} color={"white"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MovieScreen;

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 14,
  },
});
