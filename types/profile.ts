export interface LovedOne {
    name: string;
    label: string;
}

export interface Profile {
    id: string;
    user_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    avatar_url: string | undefined;
    cover_url: string | null;
    created_at: string;
    updated_at: string;
    birthday: string | null;
    college: string | null;
    highschool: string | null;
    website: string | null;
    pronouns: string | null;
    gender: string | null;
    hometown: string | null;
    is_admin: boolean;
    is_verified: boolean;
    license_plate: string | null;
    loved_ones: LovedOne[] | null;
    married_date: string | null;
    hobby: string | null;
    talent: string | null;
    username: string | null;
    metadata: string | null;
    is_confidential: boolean;
}