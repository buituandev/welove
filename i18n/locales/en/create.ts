const create = {
    action: {
        post: 'Post',
    },
    header: {
        title: 'Create Post',
        subtitle: 'Share something with your followers',
    },
    form: {
        contentPlaceholder: "What's on your mind?",
        ghost: 'Ghost',
        sensitive: 'Sensitive',
        linkLabelPlaceholder: 'Label (e.g. Website)',
        linkUrlPlaceholder: 'URL (e.g. https://...)',
        links: 'Links',
        locationPlaceholder: 'Add location...',
        media: 'Media',
        addMusic: 'Add Music',
        searchMusicPlaceholder: 'Search for songs...',
    },
    validation: {
        contentTooLong: 'Content is too long (max 2000 characters)',
        locationTooLong: 'Location is too long (max 200 characters)',
        linkLabelRequired: 'Link label is required when URL is provided',
        urlRequired: 'URL is required when label is provided',
        urlInvalid: 'Please enter a valid URL',
        contentOrMediaRequired: 'Please add some content or media to your post',
    },
    dialog: {
        screenTitle: 'Create Post',
        errorTitle: 'Error',
        successTitle: 'Success',
        permissionTitle: 'Permission Required',
        profileNotLoaded: 'Profile not loaded. Please try again.',
        postCreated: 'Your post has been created!',
        createFailed: 'Failed to create post. Please try again.',
        mediaPermissionRequired: 'Please grant media library access to pick images.',
        mediaPickerFailed: 'Failed to open media picker. Please try again.',
        ok: 'OK',
    },
    toast: {
        updating: 'Updating post...',
        creating: 'Creating post...',
        uploadingMedia: 'Uploading media and publishing...',
        publishing: 'Publishing...',
        success: 'Post created successfully!',
        updateSuccess: 'Post updated successfully!',
    },
} as const;

export default create;
