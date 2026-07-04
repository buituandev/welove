const search = {
    header: {
        title: 'Tìm kiếm',
        resultsCount_one: '{{count}} kết quả',
        resultsCount_other: '{{count}} kết quả',
        peopleCount: 'Mọi người {{count}}',
        exploreSubtitle: 'Khám phá thêm nhiều nội dung trên nền tảng',
    },
    searchBar: {
        placeholder: 'Bạn đang tìm gì?',
    },
    empty: {
        titleNoResults: 'Không tìm thấy kết quả',
        titleNoPeople: 'Chưa có người dùng',
        titleSearchPeople: 'Tìm người',
        subtitleNoProfilesMatch: 'Không có hồ sơ nào khớp "{{query}}"',
        subtitleNoProfilesAvailable: 'Không có hồ sơ khả dụng',
        subtitleTypeName: 'Nhập tên để tìm người',
    },
    sections: {
        mostSearched: 'Tìm kiếm nhiều',
        trending: 'Xu hướng',
        seeAll: 'Xem tất cả',
        postsCount_one: '{{count}} bài viết',
        postsCount_other: '{{count}} bài viết',
    },
    profile: {
        yearsOld_one: '{{count}} tuổi',
        yearsOld_other: '{{count}} tuổi',
        view: 'Xem',
    },
} as const;

export default search;
