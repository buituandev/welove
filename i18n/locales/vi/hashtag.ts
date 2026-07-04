const hashtag = {
    posts: {
        title: 'Bài viết',
        count_one: '{{count}} bài viết',
        count_other: '{{count}} bài viết',
        emptyTitle: 'Chưa có bài viết',
        emptyBody: 'Hãy là người đầu tiên đăng với #{{tag}}',
    },
    list: {
        title: 'Hashtag xu hướng',
        tagsCount_one: '{{count}} hashtag',
        tagsCount_other: '{{count}} hashtag',
        subtitle: 'Khám phá mọi người đang nói gì',
        emptyTitle: 'Chưa có hashtag xu hướng',
        emptyBody: 'Quay lại sau để xem hashtag đang lên xu hướng.',
    },
} as const;

export default hashtag;
