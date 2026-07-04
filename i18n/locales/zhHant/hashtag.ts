const hashtag = {
    posts: {
        title: '動態',
        count_one: '{{count}} 則',
        count_other: '{{count}} 則',
        emptyTitle: '暫無動態',
        emptyBody: '成為第一個使用 #{{tag}} 發佈的人',
    },
    list: {
        title: '熱門話題',
        tagsCount_one: '{{count}} 個話題',
        tagsCount_other: '{{count}} 個話題',
        subtitle: '看看大家在討論什麼',
        emptyTitle: '暫無熱門話題',
        emptyBody: '稍後再來看看熱門標籤。',
    },
} as const;

export default hashtag;
