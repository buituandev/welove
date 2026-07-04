import { useEffect, useRef } from "react";
import {
    PlayerQueue,
    TrackPlayer,
    useOnPlaybackProgressChange,
    useOnPlaybackStateChange,
} from "react-native-nitro-player";
import { useAudioStore } from "../stores/audio";

/**
 * GlobalAudioPlayer - A component that manages audio playback globally.
 * This component should be mounted at the root level (e.g., in _layout.tsx)
 * to avoid issues with RecyclerListView's view recycling.
 *
 * It listens to the audio store and bridges to react-native-nitro-player.
 * All audio sources across the app (posts, profile header, music sheet)
 * go through this single player.
 *
 * Architecture:
 *  - A single persistent playlist (GLOBAL_PLAYLIST_ID) holds at most one track.
 *  - When a new URL is requested the track is replaced and playSong() is called.
 *  - nitro-player hooks push progress / state changes back into the Zustand store.
 */

const GLOBAL_PLAYLIST_NAME = "__global__";
const GLOBAL_TRACK_ID = "__global_track__";

/** Lazily create (or re-use) the global single-track playlist. */
let globalPlaylistId: string | null = null;
let playerConfigured = false;

async function ensureConfigured(): Promise<void> {
    if (playerConfigured) return;
    await TrackPlayer.configure({
        androidAutoEnabled: false,
        carPlayEnabled: false,
        showInNotification: true,
    });
    playerConfigured = true;
}

async function ensurePlaylist(): Promise<string> {
    if (globalPlaylistId) return globalPlaylistId;

    const existing = PlayerQueue.getAllPlaylists();
    const found = existing.find((p) => p.name === GLOBAL_PLAYLIST_NAME);
    if (found) {
        globalPlaylistId = found.id;
        return globalPlaylistId;
    }

    globalPlaylistId = await PlayerQueue.createPlaylist(GLOBAL_PLAYLIST_NAME);
    return globalPlaylistId;
}

export const GlobalAudioPlayer = () => {
    const { currentAudioUrl, currentlyPlayingId, metadata, stopPlayback, setPlaybackStatus } =
        useAudioStore();

    // Track the URL we last loaded so we don't re-trigger on unrelated re-renders
    const prevUrlRef = useRef<string | null>(null);
    // Track whether we've successfully started playing (guards the stopped-state handler)
    const hasStartedPlayingRef = useRef(false);

    // ── Configure player once on mount ───────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            await ensureConfigured();
            await ensurePlaylist();
        };
        void init().catch((err) =>
            console.error("[GlobalAudioPlayer] configure failed:", err)
        );
    }, []);

    // ── Sync store → player ──────────────────────────────────────────────────
    useEffect(() => {
        if (currentAudioUrl && currentlyPlayingId && currentAudioUrl !== prevUrlRef.current) {
            prevUrlRef.current = currentAudioUrl;
            hasStartedPlayingRef.current = false; // reset until playSong resolves

            void (async () => {
                try {
                    const playlistId = globalPlaylistId || await ensurePlaylist();
                    const trackId = currentlyPlayingId;
                    const trackObj = {
                        id: trackId,
                        title: metadata?.title ?? "Unknown",
                        artist: metadata?.artist ?? "",
                        album: "",
                        duration: 0,
                        url: currentAudioUrl,
                        artwork: metadata?.coverUrl ?? null,
                    };

                    const playlist = PlayerQueue.getPlaylist(playlistId);
                    const existingTrack = playlist?.tracks.find((t) => t.id === trackId);

                    if (!existingTrack) {
                        await PlayerQueue.addTrackToPlaylist(playlistId, trackObj);
                        await PlayerQueue.loadPlaylist(playlistId);
                    } else if (existingTrack.url !== currentAudioUrl) {
                        await TrackPlayer.updateTracks([trackObj]);
                    }

                    await TrackPlayer.playSong(trackId, playlistId);
                    await TrackPlayer.play();
                    hasStartedPlayingRef.current = true;
                } catch (err) {
                    console.error("[GlobalAudioPlayer] Failed to start playback:", err);
                }
            })();
        } else if (!currentAudioUrl && prevUrlRef.current) {
            prevUrlRef.current = null;
            hasStartedPlayingRef.current = false;
            void TrackPlayer.pause();
        }
    }, [currentAudioUrl, currentlyPlayingId, metadata]);

    // ── Push progress → store ────────────────────────────────────────────────
    const { position, totalDuration } = useOnPlaybackProgressChange();

    useEffect(() => {
        if (totalDuration > 0) {
            setPlaybackStatus(position, totalDuration);
        }
    }, [position, totalDuration, setPlaybackStatus]);

    // ── Detect natural end of track → reset store ────────────────────────────
    const { state: playbackState } = useOnPlaybackStateChange();

    useEffect(() => {
        // Only react to stopped state AFTER we've confirmed playback actually started.
        // This avoids the race where the player briefly reports 'stopped' during loading.
        if (playbackState === "stopped" && currentlyPlayingId && hasStartedPlayingRef.current) {
            hasStartedPlayingRef.current = false;
            stopPlayback();
            prevUrlRef.current = null;
        }
    }, [playbackState, currentlyPlayingId, stopPlayback]);

    // This component doesn't render anything
    return null;
};
