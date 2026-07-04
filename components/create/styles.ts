import { StyleSheet } from "react-native";

export const createStyles = StyleSheet.create({
    // Media styles
    mediaSection: {
        marginBottom: 16,
    },
    mediaList: {
        gap: 10,
    },
    mediaThumbnailContainer: {
        position: "relative",
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: "hidden",
    },
    mediaThumbnail: {
        width: "100%",
        height: "100%",
    },
    videoIndicator: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        padding: 4,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadProgressText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    removeButton: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
    },

    // Music styles
    musicSection: {
        marginBottom: 16,
    },
    selectedMusic: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    selectedMusicCover: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    selectedMusicInfo: {
        flex: 1,
    },
    selectedMusicTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    selectedMusicArtist: {
        fontSize: 12,
        marginTop: 2,
    },
    removeSelectedMusic: {
        width: 40,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    musicSearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
    },
    musicSearchInput: {
        flex: 1,
        fontSize: 15,
    },
    musicLoading: {
        marginTop: 12,
    },
    musicResultsList: {
        marginTop: 12,
        gap: 8,
    },
    musicResultItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        gap: 12,
    },
    musicCover: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    musicInfo: {
        flex: 1,
    },
    musicTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    musicArtist: {
        fontSize: 12,
        marginTop: 2,
    },

    // Links styles
    linksSection: {
        marginBottom: 16,
    },
    linkItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    linkInputsContainer: {
        flex: 1,
        gap: 8,
    },
    linkInput: {
        fontSize: 14,
        padding: 10,
        borderRadius: 8,
    },
    removeLinkButton: {
        width: 40,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },

    // Profile Header styles
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    profileAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    profileName: {
        fontSize: 16,
        fontWeight: "600",
    },
    postOptionsRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    optionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    optionBadgeText: {
        fontSize: 12,
        fontWeight: "500",
    },

    // Content Input styles
    contentSection: {
        marginBottom: 16,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 120,
        textAlignVertical: "top",
        paddingVertical: 12,
    },
    characterCount: {
        fontSize: 12,
        textAlign: "right",
    },

    // Location Input styles
    locationSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 16,
    },
    locationInput: {
        flex: 1,
        fontSize: 15,
    },

    // Action Bar styles
    actionBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },

    // Header styles
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    submitButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },

    // Common styles
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
});
