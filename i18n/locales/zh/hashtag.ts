const hashtag = {
    posts: {
        title: '动态',
        count_one: '{{count}} 条',
        count_other: '{{count}} 条',
        emptyTitle: '暂无动态',
        emptyBody: '成为第一个使用 #{{tag}} 发布的人',
    },
    list: {
        title: '热门话题',
        tagsCount_one: '{{count}} 个话题',
        tagsCount_other: '{{count}} 个话题',
        subtitle: '看看大家在讨论什么',
        emptyTitle: '暂无热门话题',
        emptyBody: '稍后再来看看热门话题。',
    },
} as const;

export default hashtag;
