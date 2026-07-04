const themeSettings = {
    title: '主题',
    subtitle: '选择应用外观',
    options: {
        light:    { label: '浅色',    description: '始终使用浅色主题' },
        dark:     { label: '深色',    description: '始终使用深色主题' },
        system:   { label: '跟随系统', description: '跟随设备设置' },
        adaptive: { label: '自适应',  description: '根据日出日落切换主题' },
        'material-you': { label: 'Material You', description: '基于壁纸的动态颜色 (仅限 Android)' },
    },
} as const;

export default themeSettings;
