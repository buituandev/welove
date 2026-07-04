export interface Workplace {
    id: string;
    profile_id: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}