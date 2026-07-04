const hashtag = {
    posts: {
        title: 'Posts',
        count_one: '{{count}} post',
        count_other: '{{count}} posts',
        emptyTitle: 'No posts yet',
        emptyBody: 'Be the first to post with #{{tag}}',
    },
    list: {
        title: 'Trending Tags',
        tagsCount_one: '{{count}} tag',
        tagsCount_other: '{{count}} tags',
        subtitle: 'Discover what people are talking about',
        emptyTitle: 'No trending tags',
        emptyBody: 'Check back later for trending hashtags.',
    },
} as const;

export default hashtag;
