import React from 'react';
import { View } from 'react-native';
import { PillSliderProps } from './PillSliderProps';

export type { PillSliderProps };

const PillSlider: React.FC<PillSliderProps> = ({
    value,
    minimumValue,
    maximumValue,
    trackColor = 'rgba(255, 255, 255, 0.3)',
    progressColor = '#FFFFFF',
}) => {
    const safeMax = Math.max(minimumValue + 0.001, maximumValue);
    const clampedValue = Math.max(minimumValue, Math.min(safeMax, value));

    return (
        <View style={{ width: '100%', height: 30, backgroundColor: trackColor, borderRadius: 15, justifyContent: 'center', marginVertical: 5 }}>
            <View style={{ width: `${(clampedValue / safeMax) * 100}%`, height: '100%', backgroundColor: progressColor, borderRadius: 15 }} />
        </View>
    );
};

export default PillSlider;
