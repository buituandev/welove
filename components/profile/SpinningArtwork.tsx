import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import EarphoneIcon from "@/assets/images/svg/earphone.svg";
import { Image } from 'expo-image';

interface SpinningArtworkProps {
  isMusicPlaying: boolean;
  hasMusic: boolean;
  coverUrl?: string;
  onPress: () => void;
  colors: any;
}

export const SpinningArtwork: React.FC<SpinningArtworkProps> = ({
  isMusicPlaying,
  hasMusic,
  coverUrl,
  onPress,
  colors,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isMusicPlaying) {
      // Animate +360 from current angle. Because a 360 jump looks
      // identical when withRepeat loops, there is no jarring snap.
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 4000, easing: Easing.linear }),
        -1, // Infinite repeat
        false // Do not reverse
      );
    } else {
      // Freezing the value before cancelling strictly enforces valid state
      // preventing any NaN disappearing UI bug.
      rotation.value = rotation.value;
      cancelAnimation(rotation);
    }
  }, [isMusicPlaying, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value || 0}deg` }],
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={hasMusic ? 0.7 : 1}
      style={[
        styles.artworkContainer,
        { width: 32, height: 32 },
      ]}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        {!hasMusic ? (
          <View style={[styles.placeholderIcon, { backgroundColor: colors.card }]}>
            <EarphoneIcon width={18} height={18} color={colors.text} />
          </View>
        ) : (
          <Image
            source={{ uri: coverUrl || '' }}
            style={styles.artworkImage}
            contentFit="cover"
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  artworkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  placeholderIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
});
