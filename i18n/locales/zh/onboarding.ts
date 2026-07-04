const onboarding = {
    title: '创建个人资料',
    subtitle: '简单介绍一下自己，即可开始使用。',
    avatar: {
        placeholder: '照片',
        edit: '编辑',
    },
    name: {
        label: '姓名 *',
        placeholder: '你的姓名',
    },
    birthday: {
        label: '出生日期 *',
        placeholder: '选择出生日期',
        requirement: '你必须年满 18 岁。',
    },
    bio: {
        label: '简介（选填）',
        placeholder: '介绍一下自己…',
        counterSuffix: '/160',
    },
    submit: '继续',
} as const;

export default onboarding;
