const wallpaperOverlay = {
    prompt: 'Do you want to set this picture as your wallpaper?',
    applying: 'Applying...',
    setBoth: 'Set Both',
    homeScreen: 'Home Screen',
    lockScreen: 'Lock Screen',
    cancel: 'Nope, later maybe',
    alert: {
        errorTitle: 'Error',
        successTitle: 'Success',
        noUrl: 'No wallpaper URL provided',
        setSuccess: 'Wallpaper updated successfully!',
        setFailed: 'Failed to set wallpaper. Please try again.',
    },
} as const;

export default wallpaperOverlay;
