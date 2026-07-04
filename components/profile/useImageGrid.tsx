import Ionicons from "@react-native-vector-icons/ionicons/static";

import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { buildFallbackUrls, choosenMediaPath } from "@/utils/imageurl";
import { Image } from "expo-image";
import { MediaViewer, type MediaViewerItem } from "expo-media-viewer";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
    ImageStyle,
    ListRenderItem,
    ListRenderItemInfo,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { Media } from "../../types/media";
import {
    GridItemType,
    UseImageGridViewModelOptions,
    useImageGridViewModel
} from "../../viewmodels/ImageGridViewModel";
import { ShimmerEffect } from "../shimmer/Shimmer";
import QuickPreviewModal from "./QuickPreviewModal";

const MediaViewerContext = createContext<((index: number, options?: any) => React.ReactNode) | null>(null);

// ─── Video Grid Item (View) ────────────────────────────────────────────────────
interface VideoGridItemProps {
    mediaItem: Media;
    videoStyle: ViewStyle;
    marginRight: number;
    placeholderImageVideo: string;
    isFirst: boolean;
    isTopRight: boolean;
    flatIndex: number;
}

const VideoGridItem: React.FC<VideoGridItemProps> = React.memo(({
    mediaItem,
    videoStyle,
    marginRight,
    placeholderImageVideo,
    isFirst,
    isTopRight,
    flatIndex,
}) => {
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImageVideo), [mediaItem, placeholderImageVideo]);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(mediaItem.blurhash, mediaItem.id),
        [mediaItem.blurhash, mediaItem.id],
    );

    const mediaViewerItem: MediaViewerItem = useMemo(() => {
        const sourceUrl = choosenMediaPath(mediaItem) || fallbackUrls[0];
        const thumbnailUrl = mediaItem.thumbnail_url || fallbackUrls[0];
        return {
            id: mediaItem.id,
            type: 'video',
            source: sourceUrl,
            chrome: {
                title: "",
                description: mediaItem.caption
            },
            thumbnail: {
                source: thumbnailUrl,
                ...(placeholderBlurhash ? { blurhash: placeholderBlurhash } : {}),
            },
        };
    }, [mediaItem, fallbackUrls, placeholderBlurhash]);

    const renderMediaItemContext = useContext(MediaViewerContext);

    if (renderMediaItemContext) {
        return (
            <View
                key={mediaItem.id}
                style={[
                    videoStyle,
                    { marginRight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                    isFirst && { borderTopLeftRadius: 16 },
                    isTopRight && { borderTopRightRadius: 16 }
                ]}
            >
                <View style={StyleSheet.absoluteFill}>
                    {renderMediaItemContext(flatIndex, {
                        frame: {
                            width: "100%" as any,
                            height: "100%" as any,
                            borderRadius: 0
                        },
                    })}
                </View>
            </View>
        );
    }

    return (
        <MediaViewer
            items={[mediaViewerItem]}
            config={{
                theme: "dark",
                thumbnail: { fit: "cover", videoMode: "static" },
            }}
            renderLayout={({ renderItem: renderMediaItem }) => (
                <View
                    key={mediaItem.id}
                    style={[
                        videoStyle,
                        { marginRight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                        isFirst && { borderTopLeftRadius: 16 },
                        isTopRight && { borderTopRightRadius: 16 }
                    ]}
                >
                    <View style={StyleSheet.absoluteFill}>
                        {renderMediaItem(0, {
                            frame: { width: "100%" as any, height: "100%" as any, borderRadius: 0 },
                        })}
                    </View>
                    <View style={[
                        styles.overlay,
                        {
                            borderTopLeftRadius: isFirst ? 16 : 0,
                            borderTopRightRadius: isTopRight ? 16 : 0
                        }
                    ]} pointerEvents="none">
                        <Ionicons name="play" size={24} color="white" />
                    </View>
                </View>
            )}
        />
    );
});

VideoGridItem.displayName = 'VideoGridItem';

// ─── Image Grid Item (View) ────────────────────────────────────────────────────
interface ImageGridItemProps {
    mediaItem: Media;
    flatIndex: number;
    imageStyle: ImageStyle;
    placeholderImage: string;
    onImagePress?: (visible: boolean, index: number) => void;
    onLongPress: () => void;
    onPressOut: () => void;
    isFirst: boolean;
    isTopRight: boolean;
}

const ImageGridItem: React.FC<ImageGridItemProps> = React.memo(({
    mediaItem,
    flatIndex,
    imageStyle,
    placeholderImage,
    onImagePress,
    onLongPress,
    onPressOut,
    isFirst,
    isTopRight,
}) => {
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImage), [mediaItem, placeholderImage]);
    const [urlIndex, setUrlIndex] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(mediaItem.blurhash, mediaItem.id),
        [mediaItem.blurhash, mediaItem.id],
    );

    const handleImageError = useCallback(() => {
        setUrlIndex(prev => (prev < fallbackUrls.length - 1 ? prev + 1 : prev));
    }, [fallbackUrls.length]);

    return (
        <Pressable
            key={mediaItem.id}
            onPress={() => onImagePress?.(true, flatIndex)}
            onLongPress={onLongPress}
            onPressOut={onPressOut}
            delayLongPress={300}
        >
            <Image
                source={{ uri: fallbackUrls[urlIndex] }}
                onError={handleImageError}
                style={[
                    imageStyle,
                    {
                        borderTopLeftRadius: isFirst ? 16 : 0,
                        borderTopRightRadius: isTopRight ? 16 : 0
                    }
                ]}
                contentFit="cover"
                transition={150}
                placeholder={{ blurhash: placeholderBlurhash }}
            />
        </Pressable>
    );
});

ImageGridItem.displayName = 'ImageGridItem';

// ─── useImageGrid (View Hook) ──────────────────────────────────────────────────
// Thin View layer — consumes ViewModel and provides render functions
export const useImageGrid = (options: UseImageGridViewModelOptions = {}) => {
    const vm = useImageGridViewModel(options);

    // Render items
    const renderItem: ListRenderItem<GridItemType> = useCallback(({ item, index }) => {
        const isFirst = index === 0;
        const isTopRight = index === vm.numColumns - 1 || (index === vm.gridData.length - 1 && index < vm.numColumns);

        if (item.type === 'shimmer') {
            const isVideoGrid = vm.onVideoPress !== undefined;
            const style = isVideoGrid ? vm.videoStyle : vm.imageStyle;

            return (
                <View style={[
                    style,
                    { backgroundColor: vm.colors.card },
                    isFirst && { borderTopLeftRadius: 16 },
                    isTopRight && { borderTopRightRadius: 16 }
                ]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                borderTopLeftRadius: isFirst ? 16 : 0,
                                borderTopRightRadius: isTopRight ? 16 : 0
                            }
                        ]}
                    />
                </View>
            );
        }

        const mediaItem = item.item;
        const isVideo = mediaItem.type.toLowerCase().includes('video');
        const mediaPath = choosenMediaPath(mediaItem);

        if (isVideo) {
            return (
                <VideoGridItem
                    key={mediaItem.id}
                    mediaItem={mediaItem}
                    videoStyle={vm.videoStyle}
                    marginRight={0}
                    placeholderImageVideo={vm.placeholderImageVideo}
                    isFirst={isFirst}
                    isTopRight={isTopRight}
                    flatIndex={item.flatIndex}
                />
            );
        }

        return (
            <ImageGridItem
                key={mediaItem.id}
                mediaItem={mediaItem}
                flatIndex={item.flatIndex}
                imageStyle={vm.imageStyle}
                placeholderImage={vm.placeholderImage}
                onImagePress={vm.onImagePress}
                onLongPress={() => vm.handleLongPress(mediaPath, mediaItem.blurhash)}
                onPressOut={vm.handlePressOut}
                isFirst={isFirst}
                isTopRight={isTopRight}
            />
        );
    }, [vm.imageStyle, vm.videoStyle, vm.onVideoPress, vm.onImagePress, vm.handleLongPress, vm.handlePressOut, vm.colors.card, vm.placeholderImage, vm.placeholderImageVideo]);

    /** Rows for FlashList with numColumns=1 (avoids remounting list header when columns change). */
    const chunkedGridData = useMemo(() => {
        const cols = vm.numColumns;
        const flat = vm.gridData;
        if (flat.length === 0) return [];
        const rows: GridItemType[][] = [];
        for (let i = 0; i < flat.length; i += cols) {
            rows.push(flat.slice(i, i + cols));
        }
        return rows;
    }, [vm.gridData, vm.numColumns]);

    const renderChunkedRow = useCallback(
        ({ item: row, index: rowIndex }: ListRenderItemInfo<GridItemType[]>) => (
            <View style={{ flexDirection: "row", width: "100%" }}>
                {row.map((subItem, subIndex) => (
                    <View key={subIndex} style={{ flex: 1 }}>
                        {renderItem({
                            item: subItem,
                            index: rowIndex * vm.numColumns + subIndex,
                            separators: {} as any,
                        } as ListRenderItemInfo<GridItemType>)}
                    </View>
                ))}
                {Array.from({ length: vm.numColumns - row.length }).map((_, i) => (
                    <View key={`spacer-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
        ),
        [renderItem, vm.numColumns],
    );

    const chunkedKeyExtractor = useCallback(
        (row: GridItemType[], index: number) => {
            const first = row[0];
            return vm.keyExtractor(first, index * vm.numColumns);
        },
        [vm.keyExtractor, vm.numColumns],
    );

    const mediaViewerItems: MediaViewerItem[] = useMemo(() => {
        return vm.gridData
            .filter((item): item is Extract<GridItemType, { type: 'media' }> => item.type === 'media')
            .map(item => {
                const mediaItem = item.item;
                const isVideo = mediaItem?.type?.toLowerCase().includes('video');
                const fallbackUrls = buildFallbackUrls(mediaItem, isVideo ? vm.placeholderImageVideo : vm.placeholderImage);
                const sourceUrl = choosenMediaPath(mediaItem) || fallbackUrls[0];
                const thumbnailUrl = mediaItem.thumbnail_url || fallbackUrls[0];
                const placeholderBlurhash = resolveBlurhash(mediaItem.blurhash, mediaItem.id);

                if (isVideo) {
                    return {
                        type: 'video',
                        source: sourceUrl,
                        thumbnail: {
                            source: thumbnailUrl,
                            ...(placeholderBlurhash ? { blurhash: placeholderBlurhash } : {}),
                        },
                    } as MediaViewerItem;
                } else {
                    return {
                        type: 'image',
                        source: sourceUrl,
                        ...(placeholderBlurhash ? { blurhash: placeholderBlurhash } : {}),
                    } as MediaViewerItem;
                }
            });
    }, [vm.gridData, vm.placeholderImageVideo, vm.placeholderImage]);

    return {
        mediaViewerItems,
        gridData: vm.gridData,
        chunkedGridData,
        renderChunkedRow,
        chunkedKeyExtractor,
        sortedUrls: vm.sortedUrls,
        numColumns: vm.numColumns,
        estimatedItemSize: vm.estimatedItemSize,
        renderItem,
        keyExtractor: vm.keyExtractor,
        contentContainerStyle: styles.listContent,
        flatListProps: vm.flatListProps,
        renderQuickPreview: () => (
            <QuickPreviewModal
                visible={vm.isPreviewVisible}
                imageUrl={vm.previewUrl}
                blurhash={vm.previewBlurhash}
                onClose={vm.closePreview}
            />
        )
    };
};

export const MediaViewerWrapper = React.memo(({ items, children }: { items: MediaViewerItem[], children: React.ReactNode }) => {
    if (!items || items.length === 0) {
        return <>{children}</>;
    }
    return (
        <MediaViewer
            items={items}
            config={{ theme: "dark", thumbnail: { fit: "cover", videoMode: "static" } }}
            renderLayout={({ renderItem: renderMediaItem }) => (
                <MediaViewerContext.Provider value={renderMediaItem}>
                    {children}
                </MediaViewerContext.Provider>
            )}
        />
    );
});

MediaViewerWrapper.displayName = 'MediaViewerWrapper';

const styles = StyleSheet.create({
    listContent: {
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default useImageGrid;
