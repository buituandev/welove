import FastForward from "@/assets/images/svg/forward.svg";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { FlexText } from "../FlexText";

interface SpeedIndicatorProps {
  playbackRate: number;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  playbackRate,
}) => {
  const { t } = useTranslation();

  if (playbackRate <= 1) return null;

  // Format: 2 → "2×", 2.5 → "2.5×"
  const label = Number.isInteger(playbackRate)
    ? `${playbackRate}×`
    : `${playbackRate.toFixed(2).replace(/\.?0+$/, "")}×`;

  // If speed differs from a round number the user is drag-scrubbing
  const isScrubbing = !Number.isInteger(playbackRate);

  return (
    <View style={styles.speedIndicator}>
      <View style={styles.speedBadge}>
        <FastForward width={20} height={20} color="white" />
        <FlexText style={styles.speedText}>{label}</FlexText>
        {isScrubbing && (
          <Text style={styles.scrubHint}>‹ {t('shots.drag')} ›</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  speedIndicator: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  speedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  scrubHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});
