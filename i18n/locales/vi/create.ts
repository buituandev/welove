const create = {
    action: {
        post: 'Đăng',
    },
    header: {
        title: 'Tạo bài viết',
        subtitle: 'Chia sẻ nội dung với những người theo dõi bạn',
    },
    form: {
        contentPlaceholder: 'Bạn đang nghĩ gì?',
        ghost: 'Ẩn danh',
        sensitive: 'Nhạy cảm',
        linkLabelPlaceholder: 'Nhãn (VD: Trang web)',
        linkUrlPlaceholder: 'URL (VD: https://...)',
        links: 'Liên kết',
        locationPlaceholder: 'Thêm vị trí...',
        media: 'Phương tiện',
        addMusic: 'Thêm nhạc',
        searchMusicPlaceholder: 'Tìm bài hát...',
    },
    validation: {
        contentTooLong: 'Nội dung quá dài (tối đa 2000 ký tự)',
        locationTooLong: 'Địa điểm quá dài (tối đa 200 ký tự)',
        linkLabelRequired: 'Cần nhập nhãn liên kết khi đã có URL',
        urlRequired: 'Cần nhập URL khi đã có nhãn liên kết',
        urlInvalid: 'Vui lòng nhập URL hợp lệ',
        contentOrMediaRequired: 'Hãy thêm nội dung hoặc media cho bài viết',
    },
    dialog: {
        screenTitle: 'Tạo bài viết',
        errorTitle: 'Lỗi',
        successTitle: 'Thành công',
        permissionTitle: 'Cần quyền truy cập',
        profileNotLoaded: 'Không tải được hồ sơ. Vui lòng thử lại.',
        postCreated: 'Bài viết của bạn đã được tạo!',
        createFailed: 'Tạo bài viết thất bại. Vui lòng thử lại.',
        mediaPermissionRequired: 'Vui lòng cấp quyền thư viện ảnh để chọn media.',
        mediaPickerFailed: 'Không thể mở trình chọn media. Vui lòng thử lại.',
        ok: 'OK',
    },
    toast: {
        updating: 'Đang cập nhật bài viết...',
        creating: 'Đang tạo bài viết...',
        uploadingMedia: 'Đang tải lên media và đăng...',
        publishing: 'Đang đăng...',
        success: 'Đăng bài viết thành công!',
        updateSuccess: 'Cập nhật bài viết thành công!',
    },
} as const;

export default create;
