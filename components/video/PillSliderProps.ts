export interface PillSliderProps {
    value: number;
    minimumValue: number;
    maximumValue: number;
    onValueChange?: (value: number) => void;
    onSlidingStart?: () => void;
    onSlidingComplete?: (value: number) => void;
    trackHeight?: number;
    trackColor?: string;
    progressColor?: string;
    thumbSize?: number;
}
