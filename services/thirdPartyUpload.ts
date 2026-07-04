import { File as FSFile, UploadType } from 'expo-file-system';
import { useSettingsStore } from '@/stores/settings';
import { FileAsset } from './mediaUpload';

export interface ThirdPartyUploadResult {
    url: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
}

export const uploadToThirdParty = async (
    file: FileAsset,
    onProgress?: (data: { bytesSent: number; totalBytes: number }) => void
): Promise<ThirdPartyUploadResult> => {
    const { imgbbApiKey, x02ApiKey } = useSettingsStore.getState();

    const isVideo = file.type?.startsWith('video/') ||
                    file.uri.toLowerCase().includes('.mp4') ||
                    file.uri.toLowerCase().includes('.mov') ||
                    file.uri.toLowerCase().includes('.webm');

    if (isVideo) {
        // Videos go to x02.me
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
            throw new Error(`x02.me upload failed with status ${result.status}: ${result.body}`);
        }

        const resData = JSON.parse(result.body);
        if (!resData.success) {
            throw new Error(resData.error || 'x02.me upload failed');
        }

        return {
            url: resData.data.url,
            thumbnailUrl: null,
            width: file.width || null,
            height: file.height || null,
        };
    } else {
        // Images go to ImgBB
        if (!imgbbApiKey) {
            throw new Error('ImgBB API Key is required for image uploads. Please enter it in Settings.');
        }

        const fsFile = new FSFile(file.uri);
        const result = await fsFile.upload('https://api.imgbb.com/1/upload', {
            httpMethod: 'POST',
            uploadType: UploadType.MULTIPART,
            fieldName: 'image',
            mimeType: file.type || 'image/jpeg',
            parameters: {
                key: imgbbApiKey,
            },
            onProgress,
        });

        if (result.status < 200 || result.status >= 300) {
            throw new Error(`ImgBB upload failed with status ${result.status}: ${result.body}`);
        }

        const resData = JSON.parse(result.body);
        if (!resData.success) {
            throw new Error(resData.error?.message || 'ImgBB upload failed');
        }

        return {
            url: resData.data.url,
            thumbnailUrl: resData.data.thumb?.url || null,
            width: resData.data.width ? Number(resData.data.width) : file.width || null,
            height: resData.data.height ? Number(resData.data.height) : file.height || null,
        };
    }
};
