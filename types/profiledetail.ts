export interface ProfileDetail {
    id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    bio: string | null;
    avatar_url: string;
    cover_url: string;
    created_at: string;
    updated_at: string;
    birthday: string | null;
    college: string | null;
    highschool: string | null;
    website: string | null;
    pronouns: string;
    gender: string;
    hometown: string | null;
    is_admin: boolean;
    is_verified: boolean;
    license_plate: string | null;
    loved_ones: { name: string; label: string; }[] | null;
    married_date: string | null;
    hobby: string | null;
    talent: string | null;
    username: string | null;
    metadata: string | null;
    is_confidential: boolean;
}



