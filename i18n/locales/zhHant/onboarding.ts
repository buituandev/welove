const onboarding = {
    title: '建立個人資料',
    subtitle: '簡單介紹一下自己，即可開始使用。',
    avatar: {
        placeholder: '照片',
        edit: '編輯',
    },
    name: {
        label: '姓名 *',
        placeholder: '你的姓名',
    },
    birthday: {
        label: '出生日期 *',
        placeholder: '選擇出生日期',
        requirement: '你必須年滿 18 歲。',
    },
    bio: {
        label: '簡介（選填）',
        placeholder: '介紹一下自己…',
        counterSuffix: '/160',
    },
    submit: '繼續',
} as const;

export default onboarding;
