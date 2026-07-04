const notes = {
    common: {
        linkPreviewHint: '点击以在浏览器中打开',
    },
    editor: {
        titleNew: '新建笔记',
        titleEdit: '编辑笔记',
        save: '保存',
        noteTitlePlaceholder: '笔记标题',
        contentPlaceholder: '在这里写下你的笔记... 你也可以从下方工具栏添加图片或 GIF。',
        imageUrlPlaceholder: '输入图片 URL...',
        linkUrlPlaceholder: '输入链接 URL...',
        imageUrlAction: '图片 URL',
        linkAction: '链接',
        gifAction: 'GIF',
        invalidUrlTitle: '无效 URL',
        invalidUrlMessage: '请输入有效的 URL（例如：example.com）。',
        invalidUrlMalformedMessage: '请输入格式正确的 URL。',
    },
    detail: {
        fallbackTitle: '笔记详情',
        notFound: '未找到笔记',
        goBack: '返回',
    },
    list: {
        title: '我的笔记',
        subtitle: '你的个人笔记和想法',
        emptyTitle: '还没有笔记',
        emptyDescription: '点击 + 按钮创建你的第一条笔记。',
        openNoteToVisitLink: '打开笔记以访问链接',
        editAction: '编辑',
        deleteAction: '删除',
        deleteDialogTitle: '删除笔记',
        deleteDialogMessage: '确定要删除这条笔记吗？',
        cancelAction: '取消',
    },
} as const;

export default notes;
