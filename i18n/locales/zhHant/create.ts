const create = {
    action: {
        post: '發佈',
    },
    header: {
        title: '發佈動態',
        subtitle: '與您的粉絲分享內容',
    },
    form: {
        contentPlaceholder: '想說點什麼？',
        ghost: '匿名',
        sensitive: '敏感內容',
        linkLabelPlaceholder: '標籤 (例: 網站)',
        linkUrlPlaceholder: 'URL (例: https://...)',
        links: '連結',
        locationPlaceholder: '新增位置...',
        media: '媒體',
        addMusic: '新增音樂',
        searchMusicPlaceholder: '搜尋歌曲...',
    },
    validation: {
        contentTooLong: '內容過長（最多 2000 字）',
        locationTooLong: '位置過長（最多 200 字）',
        linkLabelRequired: '填寫連結時須填寫標籤',
        urlRequired: '填寫標籤時須填寫連結',
        urlInvalid: '請輸入有效的網址',
        contentOrMediaRequired: '請新增文字或媒體後再發佈',
    },
    dialog: {
        screenTitle: '發佈動態',
        errorTitle: '錯誤',
        successTitle: '成功',
        permissionTitle: '需要權限',
        profileNotLoaded: '個人資料未載入，請重試。',
        postCreated: '動態已發佈！',
        createFailed: '發佈失敗，請重試。',
        mediaPermissionRequired: '請授予相簿權限以選擇圖片。',
        mediaPickerFailed: '無法開啟選擇器，請重試。',
        ok: '確定',
    },
    toast: {
        updating: '正在更新動態...',
        creating: '正在建立動態...',
        uploadingMedia: '正在上傳媒體並發佈...',
        publishing: '正在發佈...',
        success: '動態發佈成功！',
        updateSuccess: '動態更新成功！',
    },
} as const;

export default create;
