import { calculateAge, calculateDaysLeft } from '@/utils/timeandage';
import { SquircleView } from "expo-squircle-view";
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';


interface BirthdayCardProps {
    birthday: string;
}

const BirthdayCard: React.FC<BirthdayCardProps> = ({ birthday }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();

    const animationState = useSharedValue(0);

    const daysLeft = calculateDaysLeft(birthday);
    const age = calculateAge(birthday);
    const isBirthdayToday = daysLeft === 0;

    useEffect(() => {
        const interval = setInterval(() => {
            animationState.value = withSpring(animationState.value === 0 ? 1 : 0, {
                damping: 15,
                stiffness: 150,
                mass: 1,
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const daysTextStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animationState.value, [0, 1], [1, 0], Extrapolation.CLAMP),
            transform: [
                {
                    translateY: interpolate(animationState.value, [0, 1], [0, -20], Extrapolation.CLAMP),
                },
                {
                    scale: interpolate(animationState.value, [0, 1], [1, 0.9], Extrapolation.CLAMP),
                }
            ],
            zIndex: animationState.value === 0 ? 1 : 0,
        };
    });

    const ageTextStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animationState.value, [0, 1], [0, 1], Extrapolation.CLAMP),
            transform: [
                {
                    translateY: interpolate(animationState.value, [0, 1], [20, 0], Extrapolation.CLAMP),
                },
                {
                    scale: interpolate(animationState.value, [0, 1], [0.9, 1], Extrapolation.CLAMP),
                }
            ],
            zIndex: animationState.value === 1 ? 1 : 0,
        };
    });

    return (
        <SquircleView borderRadius={200} cornerSmoothing={60} style={styles.cardContainer}>
            <ExpoImage
                source={require('@/assets/images/birthday.jpg')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />
            {/* Dark overlay */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

            <View style={styles.textContainer}>
                {/* Both texts are rendered, but we manipulate their opacity/position */}
                <Animated.View style={[styles.absoluteText, daysTextStyle]}>
                    <Animated.Text
                        style={[common.label, { color: 'white', textAlign: 'center' }]}
                        numberOfLines={2}
                    >
                        {isBirthdayToday ? t('profile.birthday.today') : t('profile.birthday.daysLeft', { count: daysLeft })}
                    </Animated.Text>
                </Animated.View>

                <Animated.View style={[styles.absoluteText, ageTextStyle]}>
                    <Animated.Text
                        style={[common.label, { color: 'white', textAlign: 'center' }]}
                        numberOfLines={2}
                    >
                        {t('profile.birthday.yearsOld', { count: age })}
                    </Animated.Text>
                </Animated.View>
            </View>
        </SquircleView>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        height: 70,
        width: 170,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        position: 'relative',
        marginRight: 8
    },
    textContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    absoluteText: {
        position: 'absolute', // Critical: This stacks them on top of each other
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default BirthdayCard;