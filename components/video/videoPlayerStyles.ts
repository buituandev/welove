import { StyleSheet } from "react-native";

export const videoPlayerStyles = StyleSheet.create({
    videoControlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    },
    portraitVideoContainer: {
        justifyContent: 'center',
    },
    videoControlsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    smallButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    largeButton: {
        width: 64,
        height: 64,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    extraLargeButton: {
        width: 85,
        height: 85,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    speedIndicator: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    speedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    speedText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});

export const formatDuration = (durationInSeconds: number) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    const formattedHours = hours > 0 ? `${hours}:` : '';
    const formattedMinutes = `${minutes < 10 && hours > 0 ? '0' : ''}${minutes}:`;
    const formattedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`;

    return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
};
