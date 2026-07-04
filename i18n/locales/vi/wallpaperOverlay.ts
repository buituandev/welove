const wallpaperOverlay = {
    prompt: 'Bạn có muốn đặt ảnh này làm hình nền không?',
    applying: 'Đang áp dụng...',
    setBoth: 'Đặt cả hai',
    homeScreen: 'Màn hình chính',
    lockScreen: 'Màn hình khóa',
    cancel: 'Để sau nhé',
    alert: {
        errorTitle: 'Lỗi',
        successTitle: 'Thành công',
        noUrl: 'Không có URL hình nền',
        setSuccess: 'Đã cập nhật hình nền!',
        setFailed: 'Không thể đặt hình nền. Vui lòng thử lại.',
    },
} as const;

export default wallpaperOverlay;
