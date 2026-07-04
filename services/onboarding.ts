import { storage } from './storage';
import { client } from './client';
import { supabase } from './login';

export const PROFILE_KEY = 'onboarding_has_profile';
/** Alias for the default storage — kept for backward compatibility with callers using `onboardingMmkv`. */
export const onboardingMmkv = storage;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingProfile {
    id: string;
    user_id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    birthday: string;
    created_at: string;
}

export interface CreateProfileData {
    name: string;
    birthday: string;
    avatar_url?: string | null;
    bio?: string | null;
}

// ─── MMKV helpers ─────────────────────────────────────────────────────────────

/** Returns undefined when key has never been written (i.e. needs server check). */
export function getLocalHasProfile(): boolean | undefined {
    if (!onboardingMmkv.contains(PROFILE_KEY)) return undefined;
    return onboardingMmkv.getBoolean(PROFILE_KEY);
}

export function setLocalHasProfile(value: boolean): void {
    onboardingMmkv.set(PROFILE_KEY, value);
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/onboarding/profile
 * Saves the result to MMKV so subsequent cold starts don't need a network trip.
 */
export async function checkProfileFromServer(): Promise<boolean> {
    const response = await client.get<{ hasProfile: boolean; profile: OnboardingProfile | null }>(
        '/api/onboarding/profile'
    );
    const { hasProfile } = response.data;
    setLocalHasProfile(hasProfile);
    return hasProfile;
}

/**
 * POST /api/onboarding/profile
 * Creates the profile on the server.
 */
export async function createProfile(data: CreateProfileData): Promise<OnboardingProfile> {
    const response = await client.post<{ data: OnboardingProfile }>(
        '/api/onboarding/profile',
        data
    );
    return response.data.data;
}

/**
 * POST /api/upload/avatar
 * Uses raw fetch because it sends multipart/form-data.
 * Call after createProfile so you have a valid profileId.
 */
export async function uploadAvatar(
    profileId: string,
    uri: string
): Promise<{ url: string; path: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const filename = uri.split('/').pop() ?? 'avatar.jpg';
    const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as any);
    formData.append('profileId', profileId);

    const res = await fetch(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/api/upload/avatar`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: formData,
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `Upload failed with status ${res.status}`);
    }

    return res.json();
}
