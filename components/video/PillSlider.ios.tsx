import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slider as IOSSlider, Host as IOSHost } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import { PillSliderProps } from './PillSliderProps';

const PillSlider: React.FC<PillSliderProps> = ({
    value,
    minimumValue,
    maximumValue,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
    progressColor = '#FFFFFF',
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

    const safeProgressColor = progressColor.startsWith('rgba') ? '#FFFFFFFF' : progressColor;

    const handleValueChange = (newValue: number) => {
        lastValueRef.current = newValue;
        onValueChange?.(newValue);
    };

    const handleEditingChanged = (isEditing: boolean) => {
        if (isEditing) {
            isDraggingRef.current = true;
            onSlidingStart?.();
        } else {
            isDraggingRef.current = false;
            onSlidingComplete?.(lastValueRef.current);
        }
    };

    return (
        <View style={{ width: '100%', justifyContent: 'center', minHeight: 30, marginVertical: 5 }}>
            <IOSHost matchContents={{ vertical: true }} style={{ width: '100%' }}>
                <IOSSlider
                    value={clampedValue}
                    min={safeMin}
                    max={safeMax}
                    onValueChange={handleValueChange}
                    onEditingChanged={handleEditingChanged}
                    modifiers={[tint(safeProgressColor)]}
                />
            </IOSHost>
        </View>
    );
};

export default PillSlider;
