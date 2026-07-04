import { ThemeColors } from "../../context/ThemeContext";
import { DeezerTrack } from "../../services/deezer";
import { Link } from "../../types/post";

// ============================================================================
// Color Constants
// ============================================================================

export const COLORS = {
    primary: "#3B82F6",
    error: "#EF4444",
    success: "#10B981",
};

// ============================================================================
// Types
// ============================================================================

export interface SelectedMedia {
    uri: string;
    name?: string;
    type?: string;
    fileSize?: number;
    isVideo: boolean;
    width?: number;
    height?: number;
}

export interface CreateFormState {
    content: string;
    location: string;
    selectedMedia: SelectedMedia[];
    uploadProgress: Record<number, number>;
    links: Link[];
    isGhost: boolean;
    isAdult: boolean;
    musicSearchQuery: string;
    selectedTrack: DeezerTrack | null;
    showMusicSearch: boolean;
    showLinkInput: boolean;
    showLocationInput: boolean;
    isSubmitting: boolean;
}

export interface CreateFormActions {
    setContent: (content: string) => void;
    setLocation: (location: string) => void;
    setShowLocationInput: (show: boolean) => void;
    setIsGhost: (isGhost: boolean) => void;
    setIsAdult: (isAdult: boolean) => void;
    setMusicSearchQuery: (query: string) => void;
    setSelectedTrack: (track: DeezerTrack | null) => void;
    setShowMusicSearch: (show: boolean) => void;
    setShowLinkInput: (show: boolean) => void;
    pickMedia: () => Promise<void>;
    removeMedia: (index: number) => void;
    addLink: () => void;
    updateLink: (index: number, field: keyof Link, value: string) => void;
    removeLink: (index: number) => void;
    handleSubmit: () => Promise<void>;
}

export interface ColorsProps {
    colors: ThemeColors;
}
