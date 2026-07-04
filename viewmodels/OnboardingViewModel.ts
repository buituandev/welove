import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { createProfile, setLocalHasProfile } from '../services/onboarding';
import { toUTCDate } from '../utils/date';

export type OnboardingSubmittingState = 'creating' | 'uploading' | 'saving' | null;

export interface OnboardingForm {
    name: string;
    birthday: Date | null;
    bio: string;
    avatarUri: string | null;
}

export interface OnboardingViewModel {
    form: OnboardingForm;
    isSubmitting: boolean;
    submittingState: OnboardingSubmittingState;
    error: string | null;
    maxBirthday: Date;
    setField: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => void;
    pickAvatar: () => Promise<void>;
    handleSubmit: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAtLeast18(date: Date): boolean {
    const threshold = new Date(
        date.getUTCFullYear() + 18,
        date.getUTCMonth(),
        date.getUTCDate()
    );
    return new Date() >= threshold;
}

function toIsoDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOnboardingViewModel = (): OnboardingViewModel => {
    const router = useRouter();

    // Latest selectable birthday — must be 18 years ago or earlier.
    const maxBirthday = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return toUTCDate(d);
    })();

    const [form, setForm] = useState<OnboardingForm>({
        name: '',
        birthday: null,
        bio: '',
        avatarUri: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittingState, setSubmittingState] = useState<OnboardingSubmittingState>(null);
    const [error, setError] = useState<string | null>(null);

    const setField = <K extends keyof OnboardingForm>(
        key: K,
        value: OnboardingForm[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setError('Permission to access photos is required.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setField('avatarUri', result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        setError(null);

        const name = form.name.trim();
        if (!name) {
            setError('Please enter your name.');
            return;
        }

        if (!form.birthday) {
            setError('Please select your date of birth.');
            return;
        }

        if (!isAtLeast18(form.birthday)) {
            setError('You must be at least 18 years old.');
            return;
        }

        setIsSubmitting(true);
        setSubmittingState('creating');
        try {
            const profile = await createProfile({
                name,
                birthday: toIsoDate(form.birthday),
                bio: form.bio.trim() || null,
            });

            if (form.avatarUri) {
                try {
                    setSubmittingState('uploading');
                    const filename = form.avatarUri.split('/').pop() || 'avatar.jpg';
                    const fileAsset = {
                        uri: form.avatarUri,
                        name: filename,
                        type: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
                    };

                    const { smartUpload } = await import('../services/mediaUpload');
                    const uploadRes = await smartUpload(profile.id, fileAsset);

                    if (uploadRes?.data?.url) {
                        setSubmittingState('saving');
                        const { updateProfile } = await import('../services/userprofile');
                        await updateProfile(profile.id, {
                            avatar_url: uploadRes.data.url
                        });
                    }
                } catch (uploadErr) {
                    console.error('Failed to upload/save onboarding avatar:', uploadErr);
                    // Best-effort — avatar failure must not block onboarding flow completion
                }
            }

            // Mark onboarding as completed in MMKV so subsequent sessions know the profile is ready.
            setLocalHasProfile(true);

            router.replace('/');
        } catch (err: any) {
            setError(err?.message ?? 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
            setSubmittingState(null);
        }
    };

    return { form, isSubmitting, submittingState, error, maxBirthday, setField, pickAvatar, handleSubmit };
};
