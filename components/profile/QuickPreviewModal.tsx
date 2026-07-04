
import React from "react";
import { Modal, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { getCachedImageDimension } from "@/components/gallery/imageDimensionCache";

interface QuickPreviewModalProps {
    visible: boolean;
    imageUrl: string | null;
    blurhash: string | null | undefined;
    onClose: () => void;
}

const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
    visible,
    imageUrl,
    blurhash: _blurhash,
    onClose,
}) => {
    const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

    const cachedDimensions = imageUrl ? getCachedImageDimension(imageUrl) : null;
    const hasCachedDimensions = !!(cachedDimensions?.width && cachedDimensions?.height);
    const maxWidth = viewportWidth;
    const maxHeight = viewportHeight;
    const cachedScale = hasCachedDimensions
        ? Math.min(maxWidth / cachedDimensions.width, maxHeight / cachedDimensions.height)
        : 1;
    const resolvedWidth = hasCachedDimensions ? cachedDimensions.width * cachedScale : maxWidth;
    const resolvedHeight = hasCachedDimensions ? cachedDimensions.height * cachedScale : maxHeight;


    return (
        <Modal
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            backdropColor={"#000000e1"}
        >
            <View style={styles.container}>
                {!!imageUrl && (
                    <ExpoImage
                        source={{ uri: imageUrl }}
                        recyclingKey={imageUrl}
                        style={[
                            hasCachedDimensions
                                ? { width: resolvedWidth, height: resolvedHeight }
                                : styles.fallbackContain,
                        ]}
                        contentFit="contain"
                        placeholder={_blurhash ? { blurhash: _blurhash } : undefined}
                    />
                )}

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 1)",
    },
    contentWrapper: {
        alignItems: "center",
    },
    fallbackContain: {
        width: "100%",
        height: "100%",
    },
});

export default QuickPreviewModal;
