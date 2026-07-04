const onboarding = {
    title: 'Tạo hồ sơ của bạn',
    subtitle: 'Hãy chia sẻ một chút về bản thân để bắt đầu.',
    avatar: {
        placeholder: 'Ảnh',
        edit: 'Sửa',
    },
    name: {
        label: 'Họ và tên *',
        placeholder: 'Tên của bạn',
    },
    birthday: {
        label: 'Ngày sinh *',
        placeholder: 'Chọn ngày sinh',
        requirement: 'Bạn phải từ 18 tuổi trở lên.',
    },
    bio: {
        label: 'Giới thiệu (không bắt buộc)',
        placeholder: 'Hãy nói đôi điều về bản thân…',
        counterSuffix: '/160',
    },
    submit: 'Tiếp tục',
} as const;

export default onboarding;

