const notes = {
    common: {
        linkPreviewHint: 'Click to open on your browser',
    },
    editor: {
        titleNew: 'New Note',
        titleEdit: 'Edit Note',
        save: 'Save',
        noteTitlePlaceholder: 'Note Title',
        contentPlaceholder: 'Write your note here... You can also add images or GIFs from the toolbar below.',
        imageUrlPlaceholder: 'Enter image URL...',
        linkUrlPlaceholder: 'Enter link URL...',
        imageUrlAction: 'Image URL',
        linkAction: 'Link',
        gifAction: 'GIF',
        invalidUrlTitle: 'Invalid URL',
        invalidUrlMessage: 'Please enter a valid URL (e.g., example.com).',
        invalidUrlMalformedMessage: 'Please enter a valid, well-formed URL.',
    },
    detail: {
        fallbackTitle: 'Note Detail',
        notFound: 'Note not found',
        goBack: 'Go Back',
    },
    list: {
        title: 'My Notes',
        subtitle: 'Your personal notes and ideas',
        emptyTitle: 'No Notes Yet',
        emptyDescription: 'Tap the + button to create your first note.',
        openNoteToVisitLink: 'Open note to visit link',
        editAction: 'Edit',
        deleteAction: 'Delete',
        deleteDialogTitle: 'Delete Note',
        deleteDialogMessage: 'Are you sure you want to delete this note?',
        cancelAction: 'Cancel',
    },
} as const;

export default notes;
