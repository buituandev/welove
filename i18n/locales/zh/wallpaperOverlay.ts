const wallpaperOverlay = {
    prompt: '要将这张图片设置为壁纸吗？',
    applying: '正在应用…',
    setBoth: '同时设置',
    homeScreen: '主屏幕',
    lockScreen: '锁屏',
    cancel: '先不设置',
    alert: {
        errorTitle: '错误',
        successTitle: '成功',
        noUrl: '未提供壁纸链接',
        setSuccess: '壁纸已更新！',
        setFailed: '设置壁纸失败，请重试。',
    },
} as const;

export default wallpaperOverlay;
