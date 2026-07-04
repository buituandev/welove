import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slider as AndroidSlider, Host as AndroidHost } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { PillSliderProps } from './PillSliderProps';

const PillSlider: React.FC<PillSliderProps> = ({
    value,
    minimumValue,
    maximumValue,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
}) => {
    const isDraggingRef = useRef(false);
    const lastValueRef = useRef(value);

    // Keep track of the last value so callbacks have the latest value
    useEffect(() => {
        if (!isDraggingRef.current) {
            lastValueRef.current = value;
        }
    }, [value]);

    const safeMin = minimumValue;
    const safeMax = Math.max(minimumValue + 0.001, maximumValue);
    const clampedValue = Math.max(safeMin, Math.min(safeMax, value));

    const handleValueChange = (newValue: number) => {
        lastValueRef.current = newValue;
        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            onSlidingStart?.();
        }
        onValueChange?.(newValue);
    };

    const handleValueChangeFinished = () => {
        isDraggingRef.current = false;
        onSlidingComplete?.(lastValueRef.current);
    };

    return (
        <View style={{ width: '100%', justifyContent: 'center', minHeight: 30, marginVertical: 5 }}>
            <AndroidHost matchContents={{ vertical: true }} style={{ width: '100%' }}>
                <AndroidSlider
                    modifiers={[fillMaxWidth()]}
                    value={clampedValue}
                    min={safeMin}
                    max={safeMax}
                    onValueChange={handleValueChange}
                    onValueChangeFinished={handleValueChangeFinished}
                />
            </AndroidHost>
        </View>
    );
};

export default PillSlider;
