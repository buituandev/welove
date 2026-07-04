const search = {
    header: {
        title: '搜索',
        resultsCount_one: '{{count}} 条结果',
        resultsCount_other: '{{count}} 条结果',
        peopleCount: '用户 {{count}}',
        exploreSubtitle: '探索平台上的更多内容',
    },
    searchBar: {
        placeholder: '你在找什么？',
    },
    empty: {
        titleNoResults: '未找到结果',
        titleNoPeople: '暂无用户',
        titleSearchPeople: '搜索用户',
        subtitleNoProfilesMatch: '没有与「{{query}}」匹配的资料',
        subtitleNoProfilesAvailable: '暂无可用的用户资料',
        subtitleTypeName: '输入姓名查找用户',
    },
    sections: {
        mostSearched: '热门搜索',
        trending: '趋势',
        seeAll: '查看全部',
        postsCount_one: '{{count}} 条动态',
        postsCount_other: '{{count}} 条动态',
    },
    profile: {
        yearsOld_one: '{{count}} 岁',
        yearsOld_other: '{{count}} 岁',
        view: '查看',
    },
} as const;

export default search;
