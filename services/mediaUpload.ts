/**
 * Client API service for profile owners to upload and manage media
 * Uses the /client endpoints which verify profile ownership
 *
 * Supports both direct upload and pre-signed URL upload for large files
 */

import { Media, MediaType } from '@/types/media';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File as FSFile, UploadType } from 'expo-file-system';
import { client } from './client';
import { useSettingsStore } from '@/stores/settings';

// ============================================================================
// Types
// ============================================================================

export interface UploadMediaOptions {
    caption?: string;
    post_id?: string;
    type?: MediaType;
}

export interface UploadMediaResponse {
    data: Media;
}

export interface DeleteMediaResponse {
    success: boolean;
    fileDeleted: boolean;
}

export interface PresignedUploadInfo {
    uploadUrl: string;
    objectName: string;
    bucket: string;
    mediaType: MediaType;
    readUrl: string | null;
}

export interface FileAsset {
    uri: string;
    name?: string;
    type?: string;
    fileSize?: number;
    width?: number;
    height?: number;
}

interface TinyVaultUploadResponse {
    token: string;
    download_url: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine media type from file
 */
function getMediaType(file: FileAsset): MediaType {
    const type = file.type || '';
    if (type.startsWith('video/')) return 'video';

    const source = `${file.name || ''} ${file.uri || ''}`.toLowerCase();
    if (source.includes('.mp4') || source.includes('.mov') || source.includes('.webm') || source.includes('.m4v')) {
        return 'video';
    }

    return 'photo';
}

/**
 * Get file extension from URI or type
 */
function getFileExtension(file: FileAsset): string {
    if (file.name) {
        const parts = file.name.split('.');
        if (parts.length > 1) return parts[parts.length - 1];
    }

    const type = file.type || '';
    if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
    if (type.includes('png')) return 'png';
    if (type.includes('gif')) return 'gif';
    if (type.includes('webp')) return 'webp';
    if (type.includes('mp4')) return 'mp4';
    if (type.includes('mov') || type.includes('quicktime')) return 'mov';
    if (type.includes('webm')) return 'webm';

    return 'jpg';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Upload a media file directly using FormData
 * Best for smaller files (< 5MB)
 */
export const uploadMedia = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {}
): Promise<UploadMediaResponse> => {
    const type = options.type || getMediaType(file);
    if (type === 'video') {
        return uploadVideoViaX02(profileId, file, options);
    }

    const formData = new FormData();

    formData.append('file', {
        uri: file.uri,
        name: file.name || `upload.${getFileExtension(file)}`,
        type: file.type || 'image/jpeg',
    } as any);

    if (options.caption) formData.append('caption', options.caption);
    if (options.post_id) formData.append('post_id', options.post_id);
    if (options.type) formData.append('type', options.type);
    if (file.width) formData.append('width', String(file.width));
    if (file.height) formData.append('height', String(file.height));

    const response = await client.post<UploadMediaResponse>(
        `api/profiles/${profileId}/media/client`,
        formData,
    );

    return response.data;
};

const VIDEO_UPLOAD_MAX_RETRIES = 5;
const VIDEO_UPLOAD_RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadVideoToX02 = async (
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<string> => {
    const { x02ApiKey } = useSettingsStore.getState();
    const fsFile = new FSFile(file.uri);
    const headers: Record<string, string> = {
        'x-response-format': 'json',
    };
    if (x02ApiKey) {
        headers['x-api-key'] = x02ApiKey;
    }

    const result = await fsFile.upload('https://up.x02.me/api/upload?format=json', {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName: 'file',
        mimeType: file.type || 'video/mp4',
        headers,
        onProgress,
    });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`x02.me video upload failed with status ${result.status}: ${result.body}`);
    }

    const resData = JSON.parse(result.body);
    if (!resData.success) {
        throw new Error(resData.error || 'x02.me video upload failed');
    }

    return resData.data.url;
};

const uploadVideoViaX02 = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= VIDEO_UPLOAD_MAX_RETRIES; attempt += 1) {
        try {
            const videoUrl = await uploadVideoToX02(file, onProgress);
            return createMediaRecord(profileId, videoUrl, 'video', {
                caption: options.caption,
                post_id: options.post_id,
            });
        } catch (error) {
            lastError = error;
            if (attempt < VIDEO_UPLOAD_MAX_RETRIES) {
                await sleep(VIDEO_UPLOAD_RETRY_DELAY_MS);
            }
        }
    }

    throw new Error(
        `Video upload failed after ${VIDEO_UPLOAD_MAX_RETRIES} retries. Post creation has been postponed. ${lastError instanceof Error ? lastError.message : ''}`.trim()
    );
};

/**
 * Get a pre-signed URL for uploading large files directly to storage
 * Best for larger files (> 5MB) to avoid server memory issues
 */
export const getUploadUrl = async (
    profileId: string,
    filename: string,
    type: MediaType = 'photo'
): Promise<PresignedUploadInfo> => {
    const response = await client.get<PresignedUploadInfo>(
        `/api/profiles/${profileId}/media/client`,
        { params: { filename, type } }
    );
    return response.data;
};

/**
 * Upload a file using a pre-signed URL (direct to Oracle storage)
 * Use this for large files to bypass server memory limits
 */
export const uploadWithPresignedUrl = async (
    uploadUrl: string,
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<void> => {
    const fsFile = new FSFile(file.uri);
    const result = await fsFile.upload(uploadUrl, {
        httpMethod: 'PUT',
        uploadType: UploadType.BINARY_CONTENT,
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
        },
        onProgress,
    });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed with status ${result.status}: ${result.body}`);
    }
};

/**
 * Create a media record after pre-signed upload
 * Call this after uploadWithPresignedUrl to register the media in the database
 */
export const createMediaRecord = async (
    profileId: string,
    url: string,
    type: MediaType,
    options: { caption?: string; post_id?: string; thumbnail_url?: string | null; width?: number | null; height?: number | null } = {}
): Promise<UploadMediaResponse> => {
    const response = await client.post<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client/create`,
        {
            url,
            type,
            caption: options.caption,
            post_id: options.post_id,
            thumbnail_url: options.thumbnail_url,
            width: options.width,
            height: options.height,
        }
    );
    return response.data;
};

/**
 * Upload a large file via pre-signed URL then create the media record
 */
export const uploadLargeMedia = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    const type = options.type || getMediaType(file);
    if (type === 'video') {
        return uploadVideoViaX02(profileId, file, options, onProgress);
    }

    const filename = file.name || `upload.${getFileExtension(file)}`;

    const uploadInfo = await getUploadUrl(profileId, filename, type);
    await uploadWithPresignedUrl(uploadInfo.uploadUrl, file, onProgress);

    if (!uploadInfo.readUrl) {
        throw new Error('Failed to get read URL for uploaded file');
    }

    return createMediaRecord(profileId, uploadInfo.readUrl, type, {
        caption: options.caption,
        post_id: options.post_id,
        width: file.width || null,
        height: file.height || null,
    });
};

const localUploadCache = new Map<string, Media>();

/**
 * Smart upload — automatically chooses the best upload method based on file size
 */
export const smartUpload = async (
    profileId: string,
    file: FileAsset,
    options: UploadMediaOptions = {},
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<UploadMediaResponse> => {
    // Check in-memory cache first to avoid duplicate uploads in the same session
    if (file.uri && localUploadCache.has(file.uri)) {
        console.log('[smartUpload] Reusing cached upload for:', file.uri);
        return { data: localUploadCache.get(file.uri)! };
    }

    const type = options.type || getMediaType(file);
    let response: UploadMediaResponse;

    // Always use direct-to-storage (pre-signed URL) upload for photos to bypass hosted server
    if (type === 'photo') {
        response = await uploadLargeMedia(profileId, file, options, onProgress);
    } else {
        const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
        const fileSize = file.fileSize || 0;

        if (fileSize > LARGE_FILE_THRESHOLD) {
            response = await uploadLargeMedia(profileId, file, options, onProgress);
        } else {
            response = await uploadMedia(profileId, file, options);
        }
    }

    // Cache successful uploads
    if (file.uri && response.data) {
        localUploadCache.set(file.uri, response.data);
    }

    return response;
};

/**
 * Delete a media item
 */
export const deleteMedia = async (
    profileId: string,
    mediaId: string,
    deleteFile: boolean = true
): Promise<DeleteMediaResponse> => {
    const response = await client.delete<DeleteMediaResponse>(
        `/api/profiles/${profileId}/media/client/${mediaId}`,
        { params: { deleteFile } }
    );
    return response.data;
};

/**
 * Update media metadata (caption, link to post)
 */
export const updateMedia = async (
    profileId: string,
    mediaId: string,
    data: { caption?: string; post_id?: string | null }
): Promise<UploadMediaResponse> => {
    const response = await client.put<UploadMediaResponse>(
        `/api/profiles/${profileId}/media/client/${mediaId}`,
        data
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for uploading a single media file
 */
export const useUploadMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, options }: { file: FileAsset; options?: UploadMediaOptions }) =>
            smartUpload(profileId, file, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for uploading multiple media files
 */
export const useUploadMultipleMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            options,
        }: {
            files: FileAsset[];
            options?: UploadMediaOptions;
        }) => {
            const uploadedMedia: Media[] = [];

            for (const file of files) {
                const result = await smartUpload(profileId, file, options);
                uploadedMedia.push(result.data);
            }

            return uploadedMedia;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for deleting media
 */
export const useDeleteMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaId, deleteFile = true }: { mediaId: string; deleteFile?: boolean }) =>
            deleteMedia(profileId, mediaId, deleteFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};

/**
 * Hook for updating media metadata
 */
export const useUpdateMedia = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            mediaId,
            data,
        }: {
            mediaId: string;
            data: { caption?: string; post_id?: string | null };
        }) => updateMedia(profileId, mediaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', profileId] });
        },
    });
};
