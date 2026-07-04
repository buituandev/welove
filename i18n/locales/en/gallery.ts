const gallery = {
    title: 'My Gallery',
    mediaCount_one: '{{count}} item',
    mediaCount_other: '{{count}} items',
    subtitle: 'Your photos and videos',
    emptyTitle: 'No media yet',
    emptyBody: 'Photos and videos you upload will appear here.',
    picker: {
        title: 'Browse gallery',
        subtitle: 'Select a profile to view their media',
        mineLabel: 'My gallery',
        searchPlaceholder: 'Search profiles',
        noResults: 'No profiles found',
    },
} as const;

export default gallery;
