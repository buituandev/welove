import { create } from 'zustand';

export interface GalleryImage {
    uri: string;
    caption?: string;
    profileName?: string;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
    blurhash?: string | null;
}

interface GalleryState {
    isVisible: boolean;
    images: GalleryImage[];
    imagesUrl: string[];
    initialIndex: number;
    openGallery: (images: GalleryImage[], index?: number) => void;
    closeGallery: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
    isVisible: false,
    images: [],
    imagesUrl: [],
    initialIndex: 0,
    openGallery: (images: GalleryImage[], index: number = 0) => set({
        isVisible: true,
        images,
        imagesUrl: images.map(image => image.uri),
        initialIndex: index,
    }),
    closeGallery: () => set({
        isVisible: false,
    }),
}));
