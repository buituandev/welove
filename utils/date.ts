export const parseServerDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function formatToServerDate(dateStr: string): string;
export function formatToServerDate(dateStr: string | null | undefined): string | null;
export function formatToServerDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export const formatUTCDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

export const toUTCDate = (date: Date): Date => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
