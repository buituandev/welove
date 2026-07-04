import { useThemeContext } from '@/context/ThemeContext';
import VerifiedIcon from '@/icons/verified';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import ShareIcon from "@/assets/images/svg/share-1.svg";
import DownloadIcon from "@/assets/images/svg/download.svg";
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlexText } from '../FlexText';


export interface GalleryOverlayProps {
    /** Current image index (0-based) */
    currentIndex: number;
    /** Total number of images */
    totalCount: number;
    /** Callback when close button is pressed */
    onClose: () => void;
    /** Profile or author name to display at the bottom */
    profileName?: string;
    /** Caption for the current image */
    caption?: string;
    /** Whether to show the bottom bar with profile info */
    showBottomBar?: boolean;
    /** Whether to show the download button */
    showDownload?: boolean;
    /** Callback when share button is pressed */
    onShare?: () => void;
    /** Callback when download button is pressed */
    onDownload?: () => void;
    /** Callback when poster button is pressed */
    onPoster?: () => void;
    /** Whether the profile is verified */
    isVerified?: boolean;
}

export const GalleryOverlay: React.FC<GalleryOverlayProps> = ({
    currentIndex,
    totalCount,
    onClose,
    profileName,
    caption,
    showBottomBar = true,
    showDownload = true,
    onShare,
    onDownload,
    onPoster,
    isVerified,
}) => {
    const inset = useSafeAreaInsets();
    const { colors } = useThemeContext();

    return (
        <View style={styles.galleryOverlay} pointerEvents="box-none">
            {/* Top Bar */}
            <View style={[styles.galleryTopBar, { paddingTop: inset.top + 8 }]}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.galleryButton, styles.galleryButtonBg]}
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                {totalCount <= 8 ? (
                    <View style={styles.galleryDotsContainer}>
                        {Array.from({ length: totalCount }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.galleryDot,
                                    index === currentIndex ? styles.galleryDotActive : styles.galleryDotInactive,
                                ]}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.galleryPagination}>
                        <FlexText style={styles.galleryPaginationText}>
                            {currentIndex + 1} OF {totalCount}
                        </FlexText>
                    </View>
                )}

                {/* Empty view to balance the top bar layout and center the pagination */}
                <View style={{ width: 40 }} />
            </View>

            {/* Bottom Bar */}
            {(showBottomBar || onShare || onPoster || (showDownload && onDownload)) && (
                <View style={[styles.galleryBottomBar, { paddingBottom: inset.bottom + 16 }]}>
                    {/* Top Row: Name on the left, buttons on the right */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: (showBottomBar && caption) ? 12 : 0 }}>
                        {showBottomBar && profileName ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <FlexText style={styles.galleryProfileName}>{profileName}</FlexText>
                                {isVerified && <VerifiedIcon size={14} />}
                            </View>
                        ) : (
                            <View style={{ flex: 1 }} />
                        )}

                        <View style={styles.actionButtons}>
                            {onShare && (
                                <TouchableOpacity
                                    onPress={onShare}
                                    style={[styles.galleryButton, styles.galleryButtonBg]}
                                >
                                    <ShareIcon width={24} height={24} color="white" />
                                </TouchableOpacity>
                            )}
                            {onPoster && (
                                <TouchableOpacity
                                    onPress={onPoster}
                                    style={[styles.galleryButton, styles.galleryButtonBg]}
                                >
                                    <MaterialIcons name="wallpaper" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                            {showDownload && onDownload && (
                                <TouchableOpacity
                                    onPress={onDownload}
                                    style={[styles.galleryButton, styles.galleryButtonBg]}
                                >
                                    <DownloadIcon width={24} height={24} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Bottom Row: Caption spans full width under the name and buttons */}
                    {showBottomBar && caption && (
                        <FlexText style={styles.galleryImageCaption} numberOfLines={3}>
                            {caption}
                        </FlexText>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    galleryOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'space-between',
    },
    galleryTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    galleryButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryButtonBg: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    galleryPagination: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    galleryPaginationText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    galleryDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    galleryDot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    galleryDotActive: {
        width: 14,
        opacity: 1,
    },
    galleryDotInactive: {
        width: 6,
        opacity: 0.35,
    },
    galleryBottomBar: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    galleryProfileName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    galleryImageCaption: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
    },
});

export default GalleryOverlay;
