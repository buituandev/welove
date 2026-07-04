import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import WallpaperOverlay from '@/components/WallpaperOverlay';
import { getOrDownloadFile } from '@/services/fileCacheUtils';
import type { GalleryImage as GalleryImageMeta } from '@/stores/gallery';
import { useGalleryStore } from '@/stores/gallery';
import { Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';
import { useToast } from "heroui-native/toast";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Gallery, stackTransition, type GalleryRefType } from 'react-native-zoom-toolkit';
import { Image as ExpoImage } from 'expo-image';
import GalleryImage from './GalleryImage';
import { resolveBlurhash } from './fallbackBlurhash';

interface GalleryModalContentProps {
    imagesUrl: string[];
    galleryImages: GalleryImageMeta[];
    initialIndex: number;
    onClose: () => void;
    showDownload?: boolean;
}

// Inner component that uses the Gallery from react-native-zoom-toolkit
const GalleryModalContent: React.FC<GalleryModalContentProps> = ({
    imagesUrl,
    galleryImages,
    initialIndex,
    onClose,
    showDownload = false,
}) => {
    const ref = useRef<GalleryRefType>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [debouncedIndex, setDebouncedIndex] = useState(initialIndex);
    const [isWallpaperVisible, setIsWallpaperVisible] = useState(false);
    const destination = new Directory(Paths.cache, 'images');
    const { toast } = useToast();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedIndex(currentIndex);
        }, 150);
        return () => clearTimeout(handler);
    }, [currentIndex]);

    const currentImage = galleryImages[currentIndex];

    const handlePoster = () => {
        if (currentImage?.uri) {
            setIsWallpaperVisible(true);
        }
    };

    const renderItem = useCallback(
        (item: string, index: number) => (
            <GalleryImage
                uri={item}
                index={index}
                blurhash={galleryImages[index]?.blurhash}
            />
        ),
        [galleryImages],
    );

    const keyExtractor = useCallback((item: string, index: number) => {
        return `${item}-${index}`;
    }, []);

    const onIndexChange = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const onTap = useCallback(() => {
        // Single tap can toggle overlay visibility if needed
    }, []);

    const saveRemoteImage = async (remoteUrl: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                toast.show({ label: "Permission Denied!", description: "We need access to your photos to save images.", variant: "danger" });
                return;
            }

            const localFile = await getOrDownloadFile(remoteUrl, destination, 'image.jpg');
            const asset = await MediaLibrary.createAssetAsync(localFile.uri);

            await MediaLibrary.createAlbumAsync('MyApp Downloads', asset, false);

            toast.show({ label: "Success", description: "Image saved to gallery!", variant: "success" });
        } catch (error) {
            console.error(error);
            toast.show({ label: "Error", description: "Failed to save image.", variant: "danger" });
        }
    };

    const onShare = async (imageUrl: string) => {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            toast.show({ label: "Unavailable", description: "Sharing is not available on this platform", variant: "warning" });
            return;
        }

        try {
            const localFile = await getOrDownloadFile(imageUrl, destination, 'image.jpg');
            await Sharing.shareAsync(localFile.uri);
        } catch (error) {
            console.error('Error sharing image:', error);
            toast.show({ label: "Error", description: "An error occurred while sharing the image", variant: "danger" });
        }
    };

    const bgImage = galleryImages[debouncedIndex];
    const bgImageUri = imagesUrl[debouncedIndex];
    const bgBlurhash = resolveBlurhash(bgImage?.blurhash, bgImage?.uri);

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar hidden />
            {bgImageUri && (
                <View style={StyleSheet.absoluteFill}>
                    <ExpoImage
                        source={{ blurhash: bgBlurhash }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />
                </View>
            )}
            <Gallery
                ref={ref}
                data={imagesUrl}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                initialIndex={initialIndex}
                onIndexChange={onIndexChange}
                onTap={onTap}
                maxScale={3}
                customTransition={stackTransition}
                zoomEnabled={true}
                onVerticalPull={() => {
                    'worklet';
                    scheduleOnRN(onClose);
                }}
            />
            <GalleryOverlay
                currentIndex={currentIndex}
                totalCount={imagesUrl.length}
                onClose={onClose}
                profileName={currentImage?.profileName}
                caption={currentImage?.caption}
                showBottomBar={true}
                showDownload={showDownload}
                onDownload={() => {
                    if (currentImage?.uri) {
                        saveRemoteImage(currentImage.uri);
                    }
                }}
                onShare={() => {
                    if (currentImage?.uri) {
                        onShare(currentImage.uri);
                    }
                }}
                onPoster={handlePoster}
                isVerified={currentImage?.isVerified}
            />
            <WallpaperOverlay
                isVisible={isWallpaperVisible}
                url={currentImage?.uri ?? ''}
                onClose={() => setIsWallpaperVisible(false)}
            />
        </GestureHandlerRootView>
    );
};

// Main Gallery Modal component that wraps the content in a Modal
export const GalleryModal: React.FC = () => {
    const { isVisible, images, imagesUrl, initialIndex, closeGallery } = useGalleryStore();

    return (
        <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeGallery}>
            {isVisible && (
                <GalleryModalContent
                    imagesUrl={imagesUrl}
                    galleryImages={images}
                    initialIndex={initialIndex}
                    onClose={closeGallery}
                    showDownload={true}
                />
            )}
        </Modal>
    );
};

export default GalleryModal;
