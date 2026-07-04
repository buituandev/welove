import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";

export interface TabPillProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

const TabPill: React.FC<TabPillProps> = memo(({ name, isActive, onPress }) => {
  const { colors } = useThemeContext();
  const style = styles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animate the active background opacity so the indicator cross-fades
  // instead of snapping on/off — keeps the JS bridge work minimal (native driver)
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const textOpacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(activeAnim, {
        toValue: isActive ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacityAnim, {
        toValue: isActive ? 1 : 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 7,
    }).start();
  };

  return (
    <Animated.View style={[style.pillWrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Animated background layer — only the opacity is driven, no layout changes */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          style.activeBg,
          { opacity: activeAnim },
        ]}
        pointerEvents="none"
      />
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style.tabPill}
        activeOpacity={1}
      >
        <Animated.Text
          style={[
            style.tabText,
            isActive && style.tabTextActive,
            { opacity: textOpacityAnim },
          ]}
        >
          {name}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

TabPill.displayName = "TabPill";

const styles = (colors: any) =>
  StyleSheet.create({
    pillWrapper: {
      borderRadius: 999,
      overflow: 'hidden',
    },
    tabPill: {
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    activeBg: {
      backgroundColor: colors.card,
      borderRadius: 999,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.text,
    },
    tabTextActive: {
      fontWeight: "600",
    },
  });

export default TabPill;

