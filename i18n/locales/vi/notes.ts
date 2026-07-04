const notes = {
    common: {
        linkPreviewHint: 'Nhấn để mở trong trình duyệt của bạn',
    },
    editor: {
        titleNew: 'Ghi chú mới',
        titleEdit: 'Chỉnh sửa ghi chú',
        save: 'Lưu',
        noteTitlePlaceholder: 'Tiêu đề ghi chú',
        contentPlaceholder: 'Viết ghi chú của bạn tại đây... Bạn cũng có thể thêm hình ảnh hoặc GIF từ thanh công cụ bên dưới.',
        imageUrlPlaceholder: 'Nhập URL hình ảnh...',
        linkUrlPlaceholder: 'Nhập URL liên kết...',
        imageUrlAction: 'URL ảnh',
        linkAction: 'Liên kết',
        gifAction: 'GIF',
        invalidUrlTitle: 'URL không hợp lệ',
        invalidUrlMessage: 'Vui lòng nhập URL hợp lệ (ví dụ: example.com).',
        invalidUrlMalformedMessage: 'Vui lòng nhập URL đúng định dạng.',
    },
    detail: {
        fallbackTitle: 'Chi tiết ghi chú',
        notFound: 'Không tìm thấy ghi chú',
        goBack: 'Quay lại',
    },
    list: {
        title: 'Ghi chú của tôi',
        subtitle: 'Các ghi chú và ý tưởng cá nhân của bạn',
        emptyTitle: 'Chưa có ghi chú nào',
        emptyDescription: 'Nhấn nút + để tạo ghi chú đầu tiên của bạn.',
        openNoteToVisitLink: 'Mở ghi chú để truy cập liên kết',
        editAction: 'Sửa',
        deleteAction: 'Xóa',
        deleteDialogTitle: 'Xóa ghi chú',
        deleteDialogMessage: 'Bạn có chắc muốn xóa ghi chú này không?',
        cancelAction: 'Hủy',
    },
} as const;

export default notes;
