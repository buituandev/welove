const create = {
    action: {
        post: '发布',
    },
    header: {
        title: '发布动态',
        subtitle: '与您的粉丝分享内容',
    },
    form: {
        contentPlaceholder: '想说点什么？',
        ghost: '匿名',
        sensitive: '敏感内容',
        linkLabelPlaceholder: '标签 (例: 网站)',
        linkUrlPlaceholder: 'URL (例: https://...)',
        links: '链接',
        locationPlaceholder: '添加位置...',
        media: '媒体',
        addMusic: '添加音乐',
        searchMusicPlaceholder: '搜索歌曲...',
    },
    validation: {
        contentTooLong: '内容过长（最多 2000 字）',
        locationTooLong: '位置过长（最多 200 字）',
        linkLabelRequired: '填写链接时须填写标签',
        urlRequired: '填写标签时须填写链接',
        urlInvalid: '请输入有效的网址',
        contentOrMediaRequired: '请添加文字或媒体后再发布',
    },
    dialog: {
        screenTitle: '发布动态',
        errorTitle: '错误',
        successTitle: '成功',
        permissionTitle: '需要权限',
        profileNotLoaded: '个人资料未加载，请重试。',
        postCreated: '动态已发布！',
        createFailed: '发布失败，请重试。',
        mediaPermissionRequired: '请授予相册权限以选择图片。',
        mediaPickerFailed: '无法打开选择器，请重试。',
        ok: '确定',
    },
    toast: {
        updating: '正在更新动态...',
        creating: '正在创建动态...',
        uploadingMedia: '正在上传媒体并发布...',
        publishing: '正在发布...',
        success: '动态发布成功！',
        updateSuccess: '动态更新成功！',
    },
} as const;

export default create;
