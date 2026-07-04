const themeSettings = {
    title: '主題',
    subtitle: '選擇應用外觀',
    options: {
        light:    { label: '淺色',    description: '始終使用淺色主題' },
        dark:     { label: '深色',    description: '始終使用深色主題' },
        system:   { label: '跟隨系統', description: '跟隨裝置設定' },
        adaptive: { label: '自適應',  description: '根據日出日落切換主題' },
        'material-you': { label: 'Material You', description: '基於桌布的動態色彩 (僅限 Android)' },
    },
} as const;

export default themeSettings;
