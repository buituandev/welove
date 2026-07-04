const themeSettings = {
    title: 'Giao diện',
    subtitle: 'Chọn cách ứng dụng hiển thị',
    options: {
        light:    { label: 'Sáng',       description: 'Luôn dùng giao diện sáng' },
        dark:     { label: 'Tối',        description: 'Luôn dùng giao diện tối' },
        system:   { label: 'Hệ thống',  description: 'Theo cài đặt thiết bị' },
        adaptive: { label: 'Thích ứng', description: 'Đổi giao diện theo giờ mặt trời' },
        'material-you': { label: 'Material You', description: 'Màu sắc động theo hình nền (Chỉ Android)' },
    },
} as const;

export default themeSettings;
