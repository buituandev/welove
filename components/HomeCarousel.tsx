import { useThemeContext } from "@/context/ThemeContext";
import { useHomeCarouselViewModel } from "@/viewmodels/HomeCarouselViewModel";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useMemo } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { easeGradient } from "react-native-easing-gradient";

interface CarouselImageProps {
    imageUrl: string | undefined;
    onImageLoaded?: () => void;
}

const CarouselImage = memo(({ imageUrl, onImageLoaded }: CarouselImageProps) => {
    if (!imageUrl) return null;

    return (
        <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onLoad={onImageLoaded}
            transition={200}
        />
    );
});
CarouselImage.displayName = "CarouselImage";

const ColorGradientOverlay = memo(({ carouselHeight }: { carouselHeight: number }) => {
    const { colors } = useThemeContext();
    const overlayHeight = carouselHeight * 0.8;

    const { colors: fadeColors, locations: fadeLocations } = easeGradient({
        colorStops: {
            0: {
                color: colors.surface + "00",
                easing: Easing.linear,
            },
            1: {
                color: colors.surface,
            },
        },
        easing: Easing.ease,
        extraColorStopsPerTransition: 16,
    });

    return (
        <LinearGradient
            colors={fadeColors as [string, string, ...string[]]}
            locations={fadeLocations as [number, number, ...number[]]}
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: overlayHeight,
            }}
            pointerEvents="none"
        />
    );
});
ColorGradientOverlay.displayName = "ColorGradientOverlay";

interface HomeCarouselProps {
    animatedVisibility?: Animated.Value;
}

const HomeCarousel = memo(({ animatedVisibility }: HomeCarouselProps) => {
    const {
        currentImageUrl,
        analyzeImageLuminance,
        SCREEN_WIDTH,
        CAROUSEL_HEIGHT,
    } = useHomeCarouselViewModel(animatedVisibility);

    // Only fire text-color analysis once the image is actually loaded,
    // so overlayColor never jumps ahead of the visible image.
    const handleImageLoaded = useCallback(() => {
        if (currentImageUrl) analyzeImageLuminance(currentImageUrl);
    }, [currentImageUrl, analyzeImageLuminance]);

    const animatedStyle = useMemo(() => {
        if (!animatedVisibility) return {};
        return {
            opacity: animatedVisibility,
        };
    }, [animatedVisibility]);

    return (
        <Animated.View style={[{
            width: SCREEN_WIDTH,
            height: CAROUSEL_HEIGHT,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
        }, animatedStyle]}>
            <CarouselImage
                imageUrl={currentImageUrl}
                onImageLoaded={handleImageLoaded}
            />
            <ColorGradientOverlay carouselHeight={CAROUSEL_HEIGHT} />
        </Animated.View>
    );
});
HomeCarousel.displayName = "HomeCarousel";

export default HomeCarousel;