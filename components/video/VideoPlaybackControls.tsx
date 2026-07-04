import PauseIcon from "@/assets/images/svg/pauseyt.svg";
import PlayIcon from "@/assets/images/svg/playyt.svg";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { Spinner } from "heroui-native/spinner";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface VideoPlaybackControlsProps {
  isLandscape: boolean;
  isPaused: boolean;
  isLoading: boolean;
  videoPressed: boolean;
  commonRowStyle: ViewStyle;
  onMoveBackward: () => void;
  onTogglePlayPause: () => void;
  onMoveForward: () => void;
}

export const VideoPlaybackControls: React.FC<VideoPlaybackControlsProps> = ({
  isLandscape,
  isPaused,
  isLoading,
  videoPressed,
  commonRowStyle,
  onMoveBackward,
  onTogglePlayPause,
  onMoveForward,
}) => {
  return (
    <View
      pointerEvents={videoPressed ? "auto" : "none"}
      style={[
        commonRowStyle,
        {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: isLandscape ? 64 : 48,
        },
      ]}
    >
      <TouchableOpacity onPress={onMoveBackward} style={styles.largeButton}>
        <MaterialIcons name="replay-5" size={32} color={"white"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onTogglePlayPause}
        style={styles.extraLargeButton}
      >
        {isLoading && <Spinner size="lg" color="white" />}
        {!isLoading &&
          (isPaused ? (
            <PlayIcon width={60} height={60} color="white" />
          ) : (
            <PauseIcon width={60} height={60} color="white" />
          ))}
      </TouchableOpacity>
      <TouchableOpacity onPress={onMoveForward} style={styles.largeButton}>
        <MaterialIcons name="forward-5" size={32} color={"white"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  largeButton: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  extraLargeButton: {
    width: 85,
    height: 85,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
