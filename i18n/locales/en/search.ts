const search = {
    header: {
        title: 'Search',
        resultsCount_one: '{{count}} result',
        resultsCount_other: '{{count}} results',
        peopleCount: 'People {{count}}',
        exploreSubtitle: 'Explore for more contents on the platform',
    },
    searchBar: {
        placeholder: 'What are you looking for?',
    },
    empty: {
        titleNoResults: 'No results found',
        titleNoPeople: 'No people yet',
        titleSearchPeople: 'Search for people',
        subtitleNoProfilesMatch: 'No profiles match "{{query}}"',
        subtitleNoProfilesAvailable: 'No profiles available',
        subtitleTypeName: 'Type a name to find people',
    },
    sections: {
        mostSearched: 'Most Searched',
        trending: 'Trending',
        seeAll: 'See all',
        postsCount_one: '{{count}} post',
        postsCount_other: '{{count}} posts',
    },
    profile: {
        yearsOld_one: '{{count}} year old',
        yearsOld_other: '{{count}} years old',
        view: 'View',
    },
} as const;

export default search;
