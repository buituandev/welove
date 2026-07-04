export interface Note {
    id: number;
    user_id: string;
    content: string;
    created_at: string;
}

export interface NotePagination {
    total: number;
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
}

export interface NotesResponse {
    data: Note[];
    pagination: NotePagination;
}

export interface NoteResponse {
    data: Note;
}

export interface CreateNoteInput {
    content: string;
}

export interface UpdateNoteInput {
    content: string;
}

export interface DeleteNoteResponse {
    success: boolean;
}
