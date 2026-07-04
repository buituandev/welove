const wallpaperOverlay = {
    prompt: '要將這張圖片設為桌布嗎？',
    applying: '正在套用…',
    setBoth: '同時設定',
    homeScreen: '主畫面',
    lockScreen: '鎖定畫面',
    cancel: '先不要',
    alert: {
        errorTitle: '錯誤',
        successTitle: '成功',
        noUrl: '未提供桌布連結',
        setSuccess: '桌布已更新！',
        setFailed: '設定桌布失敗，請再試一次。',
    },
} as const;

export default wallpaperOverlay;
