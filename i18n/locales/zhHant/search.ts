const search = {
    header: {
        title: '搜尋',
        resultsCount_one: '{{count}} 筆結果',
        resultsCount_other: '{{count}} 筆結果',
        peopleCount: '使用者 {{count}}',
        exploreSubtitle: '探索平台上的更多內容',
    },
    searchBar: {
        placeholder: '你在找什麼？',
    },
    empty: {
        titleNoResults: '找不到結果',
        titleNoPeople: '暫無使用者',
        titleSearchPeople: '搜尋使用者',
        subtitleNoProfilesMatch: '沒有與「{{query}}」相符的資料',
        subtitleNoProfilesAvailable: '暫無可用的使用者資料',
        subtitleTypeName: '輸入姓名查找使用者',
    },
    sections: {
        mostSearched: '熱門搜尋',
        trending: '趨勢',
        seeAll: '查看全部',
        postsCount_one: '{{count}} 則動態',
        postsCount_other: '{{count}} 則動態',
    },
    profile: {
        yearsOld_one: '{{count}} 歲',
        yearsOld_other: '{{count}} 歲',
        view: '查看',
    },
} as const;

export default search;
