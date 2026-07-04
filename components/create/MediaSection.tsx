import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";
import { SelectedMedia } from "./types";

// ============================================================================
// MediaThumbnail Component
// ============================================================================

interface MediaThumbnailProps {
    media: SelectedMedia;
    onRemove: () => void;
    colors: ThemeColors;
    uploadProgress?: number;
}

const MediaThumbnail = memo(({
    media,
    onRemove,
    colors,
    uploadProgress,
}: MediaThumbnailProps) => (
    <View style={createStyles.mediaThumbnailContainer}>
        <Image source={{ uri: media.uri }} style={createStyles.mediaThumbnail} />
        {media.isVideo && (
            <View style={createStyles.videoIndicator}>
                <Ionicons name="play" size={16} color="#fff" />
            </View>
        )}
        {uploadProgress !== undefined && uploadProgress < 100 && (
            <View style={[createStyles.uploadOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <FlexText style={createStyles.uploadProgressText}>{uploadProgress}%</FlexText>
            </View>
        )}
        <TouchableOpacity
            style={[createStyles.removeButton, { backgroundColor: colors.error }]}
            onPress={onRemove}
        >
            <Ionicons name="close" size={12} color={colors.onError} />
        </TouchableOpacity>
    </View>
));

MediaThumbnail.displayName = "MediaThumbnail";

// ============================================================================
// MediaSection Component
// ============================================================================

interface MediaSectionProps {
    selectedMedia: SelectedMedia[];
    uploadProgress?: Record<number, number>;
    colors: ThemeColors;
    common: any;
    onRemoveMedia: (index: number) => void;
}

export const MediaSection = memo(({
    selectedMedia,
    uploadProgress = {},
    colors,
    common,
    onRemoveMedia,
}: MediaSectionProps) => {
    const { t } = useTranslation();

    if (selectedMedia.length === 0) return null;

    return (
        <View style={createStyles.mediaSection}>
            <FlexText style={[common.label, { color: colors.onSurface, marginBottom: 12 }]}>
                {t('create.form.media')} ({selectedMedia.length}/10)
            </FlexText>
            <FlatList
                data={selectedMedia}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <MediaThumbnail
                        media={item}
                        onRemove={() => onRemoveMedia(index)}
                        colors={colors}
                        uploadProgress={uploadProgress[index]}
                    />
                )}
                contentContainerStyle={createStyles.mediaList}
            />
        </View>
    );
});

MediaSection.displayName = "MediaSection";
