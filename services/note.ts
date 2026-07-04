import { 
    NoteResponse, 
    NotesResponse, 
    CreateNoteInput, 
    UpdateNoteInput, 
    DeleteNoteResponse 
} from '@/types/note';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';
import { noteKeys } from './queryKeys';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new note
 */
export const createNote = async (data: CreateNoteInput): Promise<NoteResponse> => {
    const response = await client.post<NoteResponse>('/api/notes', data);
    return response.data;
};

/**
 * Fetch notes with pagination
 */
export const getNotes = async (limit: number = 20, cursor?: string): Promise<NotesResponse> => {
    const params: Record<string, any> = { limit };
    if (cursor) {
        params.cursor = cursor;
    }
    const response = await client.get<NotesResponse>('/api/notes', { params });
    return response.data;
};

/**
 * Get a specific note by ID
 */
export const getNote = async (id: number): Promise<NoteResponse> => {
    const response = await client.get<NoteResponse>(`/api/notes/${id}`);
    return response.data;
};

/**
 * Update a specific note
 */
export const updateNote = async (id: number, data: UpdateNoteInput): Promise<NoteResponse> => {
    const response = await client.put<NoteResponse>(`/api/notes/${id}`, data);
    return response.data;
};

/**
 * Delete a specific note
 */
export const deleteNote = async (id: number): Promise<DeleteNoteResponse> => {
    const response = await client.delete<DeleteNoteResponse>(`/api/notes/${id}`);
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch paginated notes
 */
export const useNotes = (limit: number = 20) => {
    return useInfiniteQuery({
        // limit is included in the key so different limits get separate caches
        queryKey: noteKeys.list(limit),
        queryFn: ({ pageParam }) => getNotes(limit, pageParam),
        getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 60 * 1000, // 1 min
    });
};

/**
 * Hook to fetch a single note by ID
 */
export const useNote = (id: number) => {
    return useQuery({
        queryKey: noteKeys.detail(id),
        queryFn: () => getNote(id),
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to create a note
 */
export const useCreateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateNoteInput) => createNote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: noteKeys.all });
        },
    });
};

/**
 * Hook to update a note
 */
export const useUpdateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateNoteInput }) => updateNote(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel in-flight queries for this note
            await queryClient.cancelQueries({ queryKey: noteKeys.detail(id) });
            const previousDetail = queryClient.getQueryData(noteKeys.detail(id));

            // Optimistically apply the change to the detail cache
            queryClient.setQueryData(noteKeys.detail(id), (old: any) =>
                old ? { ...old, data: { ...old.data, ...data } } : old
            );

            return { previousDetail, id };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(noteKeys.detail(context.id), context.previousDetail);
            }
        },
        onSettled: (_data, _err, variables) => {
            queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: noteKeys.all });
        },
    });
};

/**
 * Hook to delete a note
 */
export const useDeleteNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteNote(id),
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: noteKeys.all });
            const previous = queryClient.getQueryData(noteKeys.all);
            // Optimistically remove the note from all pages
            queryClient.setQueryData(noteKeys.all, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((n: any) => n.id !== id),
                    })),
                };
            });
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) queryClient.setQueryData(noteKeys.all, context.previous);
        },
        onSettled: (_, _err, id) => {
            queryClient.invalidateQueries({ queryKey: noteKeys.all });
            queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
        },
    });
};
