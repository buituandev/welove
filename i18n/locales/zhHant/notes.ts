const notes = {
    common: {
        linkPreviewHint: '點擊以在瀏覽器中開啟',
    },
    editor: {
        titleNew: '新增筆記',
        titleEdit: '編輯筆記',
        save: '儲存',
        noteTitlePlaceholder: '筆記標題',
        contentPlaceholder: '在這裡寫下你的筆記... 你也可以從下方工具列新增圖片或 GIF。',
        imageUrlPlaceholder: '輸入圖片 URL...',
        linkUrlPlaceholder: '輸入連結 URL...',
        imageUrlAction: '圖片 URL',
        linkAction: '連結',
        gifAction: 'GIF',
        invalidUrlTitle: '無效 URL',
        invalidUrlMessage: '請輸入有效的 URL（例如：example.com）。',
        invalidUrlMalformedMessage: '請輸入格式正確的 URL。',
    },
    detail: {
        fallbackTitle: '筆記詳情',
        notFound: '找不到筆記',
        goBack: '返回',
    },
    list: {
        title: '我的筆記',
        subtitle: '你的個人筆記與想法',
        emptyTitle: '尚無筆記',
        emptyDescription: '點擊 + 按鈕建立你的第一則筆記。',
        openNoteToVisitLink: '開啟筆記以存取連結',
        editAction: '編輯',
        deleteAction: '刪除',
        deleteDialogTitle: '刪除筆記',
        deleteDialogMessage: '確定要刪除這則筆記嗎？',
        cancelAction: '取消',
    },
} as const;

export default notes;
