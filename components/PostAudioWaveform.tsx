import Ionicons from "@react-native-vector-icons/ionicons/static";
import { SquircleView } from 'expo-squircle-view';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAudioStore } from '../stores/audio';
import { FlexText } from './FlexText';

interface PostAudioWaveformProps {
    postId: string;
    audioUrl: string;
    colors: {
        card: string;
        text: string;
        muted: string;
        divider: string;
        secondary?: string;
    };
    label?: string;
}

const TRACK_ID_PREFIX = 'post-audio-';

function formatDuration(secs: number): string {
    if (!secs || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PostAudioWaveform = React.memo(({
    postId,
    audioUrl,
    colors,
    label,
}: PostAudioWaveformProps) => {
    const trackId = `${TRACK_ID_PREFIX}${postId}`;

    const currentlyPlayingId = useAudioStore(s => s.currentlyPlayingId);
    const currentTime = useAudioStore(s => s.currentTime);
    const duration = useAudioStore(s => s.duration);
    const playTrack = useAudioStore(s => s.playTrack);
    const stopPlayback = useAudioStore(s => s.stopPlayback);

    const isPlaying = currentlyPlayingId === trackId;

    // Only show live progress when THIS track is the one playing
    const liveCurrentTime = isPlaying ? currentTime : 0;
    const liveDuration = isPlaying ? duration : 0;
    const progress = liveDuration > 0 ? Math.min(100, (liveCurrentTime / liveDuration) * 100) : 0;

    const handleToggle = useCallback(() => {
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(trackId, audioUrl, { title: label ?? 'Audio', artist: '' });
        }
    }, [isPlaying, trackId, audioUrl, label, playTrack, stopPlayback]);

    const waveBackgroundColor = colors.divider;
    const waveProgressColor = colors.secondary ?? '#4285F4';

    return (
        <SquircleView cornerSmoothing={100} preserveSmoothing style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Play / Pause Button */}
            <TouchableOpacity
                onPress={handleToggle}
                activeOpacity={0.7}
                style={[styles.playBtn, { backgroundColor: waveProgressColor }]}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color="#fff"
                    style={isPlaying ? undefined : { marginLeft: 2 }}
                />
            </TouchableOpacity>

            {/* Waveform + Time */}
            <View style={styles.waveWrapper}>
                <View style={[styles.iosFallbackTrack, { backgroundColor: waveBackgroundColor }]}>
                    <View
                        style={[
                            styles.iosFallbackFill,
                            { width: `${progress}%` as any, backgroundColor: waveProgressColor },
                        ]}
                    />
                </View>

                {/* Duration label */}
                <FlexText style={[styles.timeLabel, { color: colors.muted }]}>
                    {isPlaying && liveDuration > 0
                        ? `${formatDuration(liveCurrentTime)} / ${formatDuration(liveDuration)}`
                        : formatDuration(liveDuration > 0 ? liveDuration : 0)}
                </FlexText>
            </View>
        </SquircleView>
    );
});

PostAudioWaveform.displayName = 'PostAudioWaveform';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 16,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 12,
        // subtle elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    playBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    waveWrapper: {
        flex: 1,
        gap: 4,
    },
    wave: {
        width: '100%',
        height: 48,
    },
    iosFallbackTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
        marginVertical: 22,
    },
    iosFallbackFill: {
        height: '100%',
        borderRadius: 2,
    },
    timeLabel: {
        fontSize: 11,
        fontVariant: ['tabular-nums'],
    },
});
