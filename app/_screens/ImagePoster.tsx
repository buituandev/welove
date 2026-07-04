import { BlurMask } from "@/components/blur mask/BlurMask";
import { Title } from "@/components/blur mask/Title";
import { useStatusBar } from "@/context/StatusBarContext";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Canvas, ImageShader, LinearGradient, useAnimatedImageValue, useImage, vec } from "@shopify/react-native-skia";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useState } from "react";
import { Dimensions, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Helper to check if URL is a GIF
const isGifUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.endsWith('.gif') || lowercaseUrl.includes('.gif?');
};

// Component for static images
const StaticPosterImage = memo(({ imageUrl, width, height, name, description }: {
    imageUrl: string;
    width: number;
    height: number;
    name: string;
    description: string;
}) => {
    const image = useImage(imageUrl);

    if (!image) return null;

    return (
        <Canvas style={styles.canvas}>
            <BlurMask
                mask={
                    <LinearGradient
                        start={vec(0, height * 0.5)}
                        end={vec(0, height)}
                        colors={["transparent", "black"]}
                    />
                }
            >
                <ImageShader
                    image={image}
                    x={0}
                    width={width}
                    height={height}
                    fit="cover"
                    tx="clamp"
                    ty="clamp"
                />
            </BlurMask>
            <Title name={name} description={description} />
        </Canvas>
    );
});

// Component for animated GIFs
const AnimatedPosterImage = memo(({ imageUrl, width, height, name, description }: {
    imageUrl: string;
    width: number;
    height: number;
    name: string;
    description: string;
}) => {
    const isPaused = useSharedValue(false);
    const animatedImage = useAnimatedImageValue(imageUrl, isPaused);

    if (!animatedImage) return null;

    return (
        <Canvas style={styles.canvas}>
            <BlurMask
                mask={
                    <LinearGradient
                        start={vec(0, height * 0.5)}
                        end={vec(0, height)}
                        colors={["transparent", "black"]}
                    />
                }
            >
                <ImageShader
                    image={animatedImage}
                    x={0}
                    width={width}
                    height={height}
                    fit="cover"
                    tx="clamp"
                    ty="clamp"
                />
            </BlurMask>
            <Title name={name} description={description} />
        </Canvas>
    );
});

const ImagePoster = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const inset = useSafeAreaInsets();

    // Get params from navigation
    const imageUrl = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
    const name = Array.isArray(params.name) ? params.name[0] : params.name || '';
    const description = Array.isArray(params.description) ? params.description[0] : params.description || '';
    const musicUrl = Array.isArray(params.musicUrl) ? params.musicUrl[0] : params.musicUrl;
    const musicTitle = Array.isArray(params.musicTitle) ? params.musicTitle[0] : params.musicTitle;

    const { height, width } = Dimensions.get("window");
    const { setShowStatusBarFade } = useStatusBar();

    // Music player
    const [isPlaying, setIsPlaying] = useState(false);
    const player = useAudioPlayer(musicUrl ? { uri: musicUrl } : null);
    const status = useAudioPlayerStatus(player);

    // Update isPlaying when playback status changes
    useEffect(() => {
        if (status.playing !== isPlaying) {
            setIsPlaying(status.playing);
        }
    }, [status.playing]);

    useEffect(() => {
        setShowStatusBarFade(false);
        return () => {
            setShowStatusBarFade(true);
        };
    }, []);

    const toggleMusic = () => {
        if (!player) return;

        const isAtEnd = player.duration > 0 && (player.duration - player.currentTime < 0.2);

        if (isAtEnd) {
            player.seekTo(0);
            player.play();
            return;
        }

        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const handleClose = () => {
        if (player?.playing) {
            player.pause();
        }
        router.back();
    };
    return (
        <View style={styles.container}>
            <StatusBar hidden />
            {imageUrl && (
                isGifUrl(imageUrl) ? (
                    <AnimatedPosterImage
                        imageUrl={imageUrl}
                        width={width}
                        height={height}
                        name={name}
                        description={description}
                    />
                ) : (
                    <StaticPosterImage
                        imageUrl={imageUrl}
                        width={width}
                        height={height}
                        name={name}
                        description={description}
                    />
                )
            )}

            {/* Close Button */}
            {/* <TouchableOpacity
                onPress={handleClose}
                style={[styles.closeButton, { top: inset.top + 16 }]}
            >
                <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity> */}

            {/* Music Button - Only show if music is available */}
            {musicUrl && musicUrl.length > 0 && (
                <TouchableOpacity
                    onPress={toggleMusic}
                    style={[styles.musicButton, { bottom: inset.bottom + 24 }]}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    canvas: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    musicButton: {
        position: 'absolute',
        right: 24,
        width: 45,
        height: 45,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ImagePoster;
