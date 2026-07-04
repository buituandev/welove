import { ARC_HEIGHT, EDGE_PAD, THICKNESS } from "@/constants/tab-bar";
import type { ITabBarGeometry } from "@/interfaces/tab-bar-geometry.interface";
import { computeCurvedArc } from "@/lib/compute-curved-arc";
import { pointOnArc } from "@/lib/point-on-arc";
import { useSettingsStore } from "@/stores/settings";
import { useMemo } from "react";

function useTabBarGeometry(width: number, count: number): ITabBarGeometry {
  const { makeBottomBarCurve } = useSettingsStore();

  return useMemo(() => {
    const innerWidth = Math.max(width - THICKNESS, 1);
    const centerX = width / 2;
    const halfSpan = innerWidth / 2;
    const slotWidth = count > 0 ? (width - EDGE_PAD * 2) / count : 1;
    const tabCenters = Array.from(
      { length: count },
      (_, i) => EDGE_PAD + slotWidth * (i + 0.5),
    );
    const pillWidth = Math.min(slotWidth * 1.12, 84);
    const beadCount = Math.max(2, Math.round(innerWidth / 16));

    if (!makeBottomBarCurve) {
      const barHeight = THICKNESS;
      const centerY = THICKNESS / 2;
      const radius = 0;
      const arc = {
        center: { x: centerX, y: centerY },
        radius: 0,
        startAngle: 0,
        endAngle: 0,
      };
      const centerlineY = (x: number) => centerY;
      const beads = Array.from({ length: beadCount }, (_, i) => ({
        x: (innerWidth / (beadCount - 1)) * i,
        y: 0,
      }));

      return {
        arc,
        radius,
        centerX,
        centerY,
        halfSpan,
        innerWidth,
        barHeight,
        slotWidth,
        pillWidth,
        tabCenters,
        beads,
        centerlineY,
      };
    }

    const arc = computeCurvedArc(innerWidth, ARC_HEIGHT);
    const radius = arc.radius;
    const centerY = arc.center.y + THICKNESS / 2;
    const barHeight = ARC_HEIGHT + THICKNESS;

    const centerlineY = (x: number) => {
      const dx = Math.min(Math.max(x - centerX, -halfSpan), halfSpan);
      return centerY - Math.sqrt(Math.max(radius * radius - dx * dx, 0));
    };

    const beads = Array.from({ length: beadCount }, (_, i) =>
      pointOnArc(arc, i / (beadCount - 1)),
    );

    return {
      arc,
      radius,
      centerX,
      centerY,
      halfSpan,
      innerWidth,
      barHeight,
      slotWidth,
      pillWidth,
      tabCenters,
      beads,
      centerlineY,
    };
  }, [width, count, makeBottomBarCurve]);
}

export { useTabBarGeometry };
