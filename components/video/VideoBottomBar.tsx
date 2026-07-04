import Rotate from "@/assets/images/svg/rotate.svg";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import React from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { FlexText } from "../FlexText";
import PillSlider from "./PillSlider";
import { formatDuration } from "./videoPlayerStyles";

interface VideoProgress {
  currentTime: number;
  seekableDuration: number;
}

interface VideoBottomBarProps {
  isLandscape: boolean;
  isLooping: boolean;
  isPaused: boolean;
  name: string;
  caption: string;
  progress: VideoProgress;
  seekPosition: number | null;
  bottomBarTranslateY: Animated.Value;
  videoPressed: boolean;
  commonRowStyle: ViewStyle;
  commonBodySmallStyle: any;
  commonLabelStyle: any;
  onLoopToggle: () => void;
  onRotate: () => void;
  onSeek: (value: number) => void;
  onSlidingStart: () => void;
  onSlidingComplete: (value: number) => void;
}

export const VideoBottomBar: React.FC<VideoBottomBarProps> = ({
  isLandscape,
  isLooping,
  isPaused,
  name,
  caption,
  progress,
  seekPosition,
  bottomBarTranslateY,
  videoPressed,
  commonRowStyle,
  commonBodySmallStyle,
  commonLabelStyle,
  onLoopToggle,
  onRotate,
  onSeek,
  onSlidingStart,
  onSlidingComplete,
}) => {
  return (
    <Animated.View
      pointerEvents={videoPressed ? "box-none" : "none"}
      style={{
        paddingBottom: isLandscape ? 30 : 16,
        paddingRight: isLandscape ? 32 : 0,
        transform: [{ translateY: bottomBarTranslateY }],
      }}
    >
      <View
        pointerEvents="box-none"
        style={[
          commonRowStyle,
          { justifyContent: "space-between", alignItems: "center" },
        ]}
      >
        <View style={{ flex: 1 }} pointerEvents="none">
          <FlexText style={[commonBodySmallStyle, { color: "white" }]}>{name}</FlexText>
          {caption && (
            <FlexText
              style={{
                marginBottom: 8,
                fontSize: isLandscape ? 16 : 28,
                fontWeight: "bold",
                color: "white",
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {caption}
            </FlexText>
          )}
        </View>
        <View style={[commonRowStyle, { gap: 8 }]} pointerEvents="box-none">
          <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onLoopToggle}>
            {isLooping ? (
              <MaterialIcons name="repeat-one" size={20} color={"white"} />
            ) : (
              <MaterialIcons name="repeat" size={20} color={"white"} />
            )}
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onRotate}>
            <Rotate width={20} height={20} color={"white"} />
          </TouchableOpacity>
        </View>
      </View>

      <PillSlider
        minimumValue={0}
        maximumValue={progress.seekableDuration}
        value={progress.currentTime}
        onValueChange={onSeek}
        onSlidingStart={onSlidingStart}
        onSlidingComplete={onSlidingComplete}
        trackHeight={8}
        trackColor="#4DFFFFFF"
        progressColor="#FFFFFF"
      />
      <View
        style={[
          commonRowStyle,
          { justifyContent: "space-between", marginTop: 8 },
        ]}
      >
        <FlexText style={[commonLabelStyle, { color: "white" }]}>
          {formatDuration(
            seekPosition !== null ? seekPosition : progress.currentTime,
          )}
        </FlexText>
        <FlexText style={[commonLabelStyle, { color: "white" }]}>
          {formatDuration(progress.seekableDuration)}
        </FlexText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
