/**
 * AssemblyText - Google-style text assembly animation.
 *
 * Architecture: Full Skia Layout (Single Canvas)
 * - ONE <Canvas> for all text — single GPU surface, maximum performance.
 * - Manual x,y layout via font.measureText() / font.getGlyphWidths().
 * - Each word is a Skia <Group> with animated transform + BlurMask.
 * - All animations driven by Reanimated shared values on the UI thread.
 *
 * Physics:
 * - Easing: cubic-bezier(0.16, 1, 0.3, 1) — out-expo deceleration.
 * - Duration: 1400ms per unit.
 * - Stagger: 50ms between each unit.
 * - Scale: 1.4 → 1  (assembly zoom-out)
 * - TranslateX: -30 → 0  (slide in from left)
 * - Opacity: 0 → 1
 * - Blur: 12 → 0  (Skia BlurMask)
 */
import {
    BlurMask,
    Canvas,
    Group,
    Skia,
    Text as SkiaText,
    useFont,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import {
    Easing,
    interpolate,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

interface AssemblyTextProps {
    /** The string to animate. */
    text: string;
    /** Initial delay (ms) before the first unit starts. */
    delayOffset?: number;
    /** Font size in px. */
    fontSize?: number;
    /** Text color (CSS color string). */
    color?: string;
    /** Font weight — maps to bold vs regular font file. */
    fontWeight?: "bold" | "normal";
    /** Change this value to replay the animation (e.g. on screen focus). */
    trigger?: number;
}

// ── Physics constants ────────────────────────────────────────────────
const DURATION = 1400;
const STAGGER = 50;
const EASING = Easing.bezier(0.16, 1, 0.3, 1);

// CJK detection for character-level splitting.
const CJK_REGEX = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;

function splitIntoUnits(text: string): string[] {
    if (!text) return [];
    if (CJK_REGEX.test(text)) {
        const units: string[] = [];
        let buffer = "";
        for (const char of text) {
            if (CJK_REGEX.test(char)) {
                if (buffer.trim()) { units.push(buffer.trim()); buffer = ""; }
                units.push(char);
            } else if (char === " ") {
                if (buffer.trim()) { units.push(buffer.trim()); buffer = ""; }
            } else {
                buffer += char;
            }
        }
        if (buffer.trim()) units.push(buffer.trim());
        return units;
    }
    return text.split(/\s+/).filter(Boolean);
}

// ── Animated unit (word or character) ────────────────────────────────
// Renders a single <Group> with animated transforms inside the shared Canvas.
const AnimatedUnit = ({
    text,
    x,
    y,
    index,
    delayOffset,
    font,
    skiaColor,
    trigger,
}: {
    text: string;
    x: number;
    y: number;
    index: number;
    delayOffset: number;
    font: ReturnType<typeof useFont>;
    skiaColor: Float32Array;
    trigger: number;
}) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        const unitDelay = delayOffset + index * STAGGER;
        progress.value = withDelay(
            unitDelay,
            withTiming(1, { duration: DURATION, easing: EASING })
        );
    }, [delayOffset, index, progress, trigger]);

    // Skia transform matrix driven by shared value.
    const transform = useDerivedValue(() => {
        const scale = interpolate(progress.value, [0, 1], [1.4, 1]);
        const tx = interpolate(progress.value, [0, 1], [-30, 0]);
        return [{ translateX: x + tx }, { translateY: y }, { scale }];
    });

    const opacity = useDerivedValue(() => {
        return interpolate(progress.value, [0, 1], [0, 1]);
    });

    const blur = useDerivedValue(() => {
        return interpolate(progress.value, [0, 1], [12, 0]);
    });

    if (!font) return null;

    return (
        <Group transform={transform} opacity={opacity}>
            <SkiaText
                x={0}
                y={0}
                text={text}
                font={font}
                color={skiaColor}
            >
                <BlurMask blur={blur} style="normal" />
            </SkiaText>
        </Group>
    );
};

// ── Main component ───────────────────────────────────────────────────
const AssemblyText: React.FC<AssemblyTextProps> = ({
    text,
    delayOffset = 0,
    fontSize = 46,
    color = "#FFFFFF",
    fontWeight = "bold",
    trigger = 0,
}) => {
    const font = useFont(
        fontWeight === "bold"
            ? require("../assets/fonts/NotoSansSC-Bold.ttf")
            : require("../assets/fonts/NotoSansSC-Regular.ttf"),
        fontSize
    );

    const skiaColor = useMemo(() => Skia.Color(color), [color]);
    const units = useMemo(() => splitIntoUnits(text), [text]);
    const isCJK = useMemo(() => CJK_REGEX.test(text), [text]);

    // ── Compute layout: x,y position for each unit ──────────────────
    // Padding prevents clipping when scale is 1.4 (40% overshoot).
    const PADDING = fontSize * 0.5;

    const layout = useMemo(() => {
        if (!font || units.length === 0) return { positions: [], contentWidth: 0, contentHeight: 0 };

        // Explicit space gap between words (font space width is often too narrow).
        const gap = isCJK ? 0 : fontSize * 0.3;
        const positions: { x: number; y: number; text: string }[] = [];
        let cursorX = 0;

        for (let i = 0; i < units.length; i++) {
            const metrics = font.measureText(units[i]);
            // Offset by PADDING so content starts inside the padded area.
            positions.push({ x: cursorX + PADDING, y: fontSize + PADDING, text: units[i] });
            cursorX += metrics.width;
            // Add space gap between words, but not after the last one.
            if (i < units.length - 1) {
                cursorX += gap;
            }
        }

        return {
            positions,
            contentWidth: cursorX,
            contentHeight: fontSize * 1.4,
        };
    }, [font, units, fontSize, isCJK, PADDING]);

    if (!font || !text || layout.positions.length === 0) return null;

    // Canvas = content + padding on all sides for scale overshoot.
    const canvasWidth = layout.contentWidth + PADDING * 2;
    const canvasHeight = layout.contentHeight + PADDING * 2;

    return (
        <Canvas
            style={{
                width: canvasWidth,
                height: canvasHeight,
                // Negative margin compensates the padding so surrounding layout is unaffected.
                marginHorizontal: -PADDING,
                marginVertical: -PADDING * 0.5,
            }}
        >
            {layout.positions.map((pos, index) => (
                <AnimatedUnit
                    key={`${index}-${pos.text}-${trigger}`}
                    text={pos.text}
                    x={pos.x}
                    y={pos.y}
                    index={index}
                    delayOffset={delayOffset}
                    font={font}
                    skiaColor={skiaColor}
                    trigger={trigger}
                />
            ))}
        </Canvas>
    );
};

export default AssemblyText;
