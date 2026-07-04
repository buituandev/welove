export interface ProfileAddress {
    id: string;
    profile_id: string;
    label: string;
    street: string;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}