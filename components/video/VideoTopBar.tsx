import PIP from "@/assets/images/svg/pipdy.svg";
import SoundIcon from "@/assets/images/svg/soundlouddy.svg";
import SoundMuteIcon from "@/assets/images/svg/soundmutedy.svg";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface VideoTopBarProps {
  isLandscape: boolean;
  isMute: boolean;
  topBarTranslateY: Animated.Value;
  videoPressed: boolean;
  commonRowStyle: ViewStyle;
  onClose: () => void;
  onPipMode: () => void;
  onOpenExternal: () => void;
  onMuteToggle: () => void;
}

export const VideoTopBar: React.FC<VideoTopBarProps> = ({
  isLandscape,
  isMute,
  topBarTranslateY,
  videoPressed,
  commonRowStyle,
  onClose,
  onPipMode,
  onOpenExternal,
  onMuteToggle,
}) => {
  return (
    <Animated.View
      pointerEvents={videoPressed ? "box-none" : "none"}
      style={[
        commonRowStyle,
        {
          justifyContent: "space-between",
          paddingTop: isLandscape ? 30 : 16,
          paddingRight: isLandscape ? 32 : 0,
          transform: [{ translateY: topBarTranslateY }],
        },
      ]}
    >
      <View style={[commonRowStyle, { gap: 12 }]} pointerEvents="box-none">
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={onClose} style={styles.smallButton}>
          <Ionicons name="close" size={24} color={"white"} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onPipMode}>
          <PIP width={28} height={28} color={"white"} />
        </TouchableOpacity>
      </View>
      <View style={[commonRowStyle, { gap: 12 }]} pointerEvents="box-none">
        {/* <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onOpenExternal}>
          <MaterialIcons name="open-in-new" size={20} color={"white"} />
        </TouchableOpacity> */}
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.smallButton} onPress={onMuteToggle}>
          {isMute ? (
            <SoundMuteIcon width={28} height={28} color={"white"} />
          ) : (
            <SoundIcon width={28} height={28} color={"white"} />
          )}
        </TouchableOpacity>
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
