/**
 * VideoPlayerContext
 *
 * Maintains a single VideoPlayer instance for the whole app lifetime.
 * Screens that navigate into video_detail just call replaceAsync() instead of
 * creating a brand-new player, which avoids the resource spike that happens
 * when every screen mount instantiates its own player.
 */
import { createVideoPlayer, VideoPlayer } from "expo-video";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface VideoPlayerContextValue {
  player: VideoPlayer;
  activeOwnerIdRef: React.RefObject<string | null>;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

export const VideoPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  // createVideoPlayer: lifecycle managed manually — we release on unmount (app close).
  const [player] = useState(() => createVideoPlayer(null));
  const activeOwnerIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Release only when the provider (app root) unmounts.
      player.release();
    };
  }, [player]);

  return (
    <VideoPlayerContext.Provider value={{ player, activeOwnerIdRef }}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useGlobalVideoPlayer = (): VideoPlayer => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error("useGlobalVideoPlayer must be inside VideoPlayerProvider");
  return ctx.player;
};

export const useGlobalVideoPlayerOwner = (): React.RefObject<string | null> => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error("useGlobalVideoPlayerOwner must be inside VideoPlayerProvider");
  return ctx.activeOwnerIdRef;
};
