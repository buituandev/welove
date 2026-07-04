import { Dimensions } from "react-native";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── LegendList Performance Constants (from react-native-video-feed reference) ──
export const FALLBACK_ITEM_HEIGHT = Math.ceil(SCREEN_HEIGHT);
export const ITEM_OVERLAP = 4;
export const PRELOAD_AHEAD = 1;
export const PRELOAD_BEHIND = 0;
export const DRAW_DISTANCE_MULTIPLIER = 2;
export const SCROLL_EVENT_THROTTLE = 16;
export const USE_PLACEHOLDER_OUTSIDE_PRELOAD = true;
export const DECELERATION_RATE = 0.98;

export type Direction = "up" | "down";
