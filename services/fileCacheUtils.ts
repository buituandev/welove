import { Directory, File } from 'expo-file-system';

export const ensureDirectory = (directory: Directory) => {
    directory.create({ idempotent: true, intermediates: true });
};

export const filenameFromUrl = (url: string, fallback: string) => {
    return url.split('/').pop()?.split('?')[0] || fallback;
};

export const getOrDownloadFile = async (
    remoteUrl: string,
    directory: Directory,
    fallbackName: string,
) => {
    ensureDirectory(directory);
    const file = new File(directory, filenameFromUrl(remoteUrl, fallbackName));

    if (!file.exists) {
        await File.downloadFileAsync(remoteUrl, file);
    }

    return file;
};

export const readJsonFileOrNull = async <T>(file: File): Promise<T | null> => {
    if (!file.exists) return null;
    const raw = await file.text();
    return JSON.parse(raw) as T;
};

export const writeJsonFile = (file: File, value: unknown) => {
    file.write(JSON.stringify(value));
};

export const deleteFileIfExists = (uri: string) => {
    const file = new File(uri);
    if (file.exists) {
        file.delete();
    }
};

export const resetDirectory = (directory: Directory) => {
    if (directory.exists) {
        directory.delete();
    }
    ensureDirectory(directory);
};
