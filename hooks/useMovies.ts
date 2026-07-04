import { tmdbClient } from '@/services/client';
import { Movie, MovieDetails } from '@/types/moviedb/movie';
import { TMDBMovieImages } from '@/types/moviedb/movie-images';
import { TMDBReview } from '@/types/moviedb/movie-entities';
import { TMDBMovieWatchProviders } from '@/types/moviedb/movie-watch-providers';
import { TMDBResponse } from '@/types/moviedb/common';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// (Standard queries can remain for trending or single page needs)

// Fetch Trending All (Movies & TV Shows)
export function useTrendingAll() {
    return useQuery({
        queryKey: ['trending', 'all'],
        queryFn: async () => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('trending/all/day');
            // Filter out people types from the carousel
            return data.results.filter((item: any) => item.media_type !== 'person');
        },
        staleTime: 5 * 60 * 1000, // 5 minutes — avoid refetch on tab switch
    });
}

// Fetch Trending Movies
export function useTrendingMovies() {
    return useQuery({
        queryKey: ['movies', 'trending'],
        queryFn: async () => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>('trending/movie/day');
            return data.results;
        },
    });
}

// Fetch Movie Details (with credits & videos appended)
export function useMovieDetails(movieId?: number) {
    return useQuery({
        queryKey: ['movies', 'detail', movieId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<MovieDetails>(`movie/${movieId}`, {
                params: {
                    append_to_response: 'credits,videos',
                    language: 'en-US',
                },
            });
            return data;
        },
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000, // 10 min — avoid refetch on re-visit
    });
}

// Fetch Person Details (with explicit movie & tv credits and images)
export function usePersonDetails(personId?: number) {
    return useQuery({
        queryKey: ['person', 'detail', personId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`person/${personId}`, {
                params: {
                    append_to_response: 'movie_credits,tv_credits,images',
                    language: 'en-US',
                },
            });
            return data;
        },
        enabled: !!personId,
        staleTime: 10 * 60 * 1000,
    });
}

// Fetch Movie Images (backdrops + posters)
export function useMovieImages(movieId?: number) {
    return useQuery({
        queryKey: ['movie', 'images', movieId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<TMDBMovieImages>(`movie/${movieId}/images`);
            return data;
        },
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000,
    });
}

// Fetch Watch Providers
export function useMovieWatchProviders(movieId?: number) {
    return useQuery({
        queryKey: ['movie', 'watch_providers', movieId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<TMDBMovieWatchProviders>(`movie/${movieId}/watch/providers`);
            return data;
        },
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — Similar Movies
export function useMovieSimilarInfinite(movieId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['movie', 'similar', movieId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>(`movie/${movieId}/similar`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — Movie Recommendations
export function useMovieRecommendationsInfinite(movieId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['movie', 'recommendations', movieId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>(`movie/${movieId}/recommendations`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — Movie Reviews
export function useMovieReviewsInfinite(movieId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['movie', 'reviews', movieId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<TMDBReview>>(`movie/${movieId}/reviews`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!movieId,
        staleTime: 10 * 60 * 1000,
    });
}

// ─── TV Show Detail Hooks ───────────────────────────────────────────────────

// Fetch TV Details (with credits, videos & content_ratings appended)
export function useTvDetails(tvId?: number) {
    return useQuery({
        queryKey: ['tv', 'detail', tvId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`tv/${tvId}`, {
                params: {
                    append_to_response: 'credits,videos,content_ratings',
                    language: 'en-US',
                },
            });
            return data;
        },
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Fetch TV Images (backdrops + posters)
export function useTvImages(tvId?: number) {
    return useQuery({
        queryKey: ['tv', 'images', tvId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`tv/${tvId}/images`);
            return data;
        },
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Fetch TV Watch Providers
export function useTvWatchProviders(tvId?: number) {
    return useQuery({
        queryKey: ['tv', 'watch_providers', tvId],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`tv/${tvId}/watch/providers`);
            return data;
        },
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — Similar TV Shows
export function useTvSimilarInfinite(tvId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['tv', 'similar', tvId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>(`tv/${tvId}/similar`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — TV Recommendations
export function useTvRecommendationsInfinite(tvId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['tv', 'recommendations', tvId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>(`tv/${tvId}/recommendations`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — TV Reviews
export function useTvReviewsInfinite(tvId?: number, language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['tv', 'reviews', tvId, language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<TMDBReview>>(`tv/${tvId}/reviews`, {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: !!tvId,
        staleTime: 10 * 60 * 1000,
    });
}

// Infinite — Popular Movies
export function usePopularMoviesInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['movies', 'popular', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>('movie/popular', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// Infinite — Popular People
export function usePopularPeopleInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['people', 'popular', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('person/popular', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// ─── TV Shows ───────────────────────────────────────────────────────────────

// Infinite — Airing Today TV
export function useAiringTodayTVInfinite(language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['tv', 'airing_today', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('tv/airing_today', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

// Infinite — On The Air TV
export function useOnTheAirTVInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['tv', 'on_the_air', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('tv/on_the_air', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// Infinite — Popular TV
export function usePopularTVInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['tv', 'popular', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('tv/popular', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// Infinite — Top Rated TV
export function useTopRatedTVInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['tv', 'top_rated', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<any>>('tv/top_rated', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// Infinite — Top Rated Movies
export function useTopRatedMoviesInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['movies', 'top_rated', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>('movie/top_rated', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// Infinite — Now Playing Movies
export function useNowPlayingMoviesInfinite(language: string = 'en-US') {
    return useInfiniteQuery({
        queryKey: ['movies', 'now_playing', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>('movie/now_playing', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

// Infinite — Upcoming Movies
export function useUpcomingMoviesInfinite(language: string = 'en-US', enabled: boolean = true) {
    return useInfiniteQuery({
        queryKey: ['movies', 'upcoming', 'inf', language],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await tmdbClient.get<TMDBResponse<Movie>>('movie/upcoming', {
                params: { language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

// ─── TV Season & Episode Detail Hooks ───────────────────────────────────────

// Fetch TV Season Details (with credits, images, videos appended)
export function useTvSeasonDetails(tvId?: number, seasonNumber?: number) {
    return useQuery({
        queryKey: ['tv', 'season', tvId, seasonNumber],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`tv/${tvId}/season/${seasonNumber}`, {
                params: {
                    append_to_response: 'credits,images,videos',
                    language: 'en-US',
                },
            });
            return data;
        },
        enabled: !!tvId && seasonNumber !== undefined && seasonNumber !== null,
        staleTime: 10 * 60 * 1000,
    });
}

// Fetch TV Episode Details (with credits, images, videos appended)
export function useTvEpisodeDetails(tvId?: number, seasonNumber?: number, episodeNumber?: number) {
    return useQuery({
        queryKey: ['tv', 'episode', tvId, seasonNumber, episodeNumber],
        queryFn: async () => {
            const { data } = await tmdbClient.get<any>(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
                params: {
                    append_to_response: 'credits,images,videos',
                    language: 'en-US',
                },
            });
            return data;
        },
        enabled: !!tvId && seasonNumber !== undefined && episodeNumber !== undefined,
    });
}

// Infinite — Typed Search (All, Movie, TV, Person)
export type SearchType = 'all' | 'movie' | 'tv' | 'person';

export function useTypedSearchInfinite(query: string, type: SearchType, language: string = 'en-US') {
    const q = query.trim();
    return useInfiniteQuery({
        queryKey: ['movies', 'search', 'inf', type, q, language],
        queryFn: async ({ pageParam = 1 }) => {
            const endpoint = type === 'all' ? 'search/multi' : `search/${type}`;
            const { data } = await tmdbClient.get<TMDBResponse<any>>(endpoint, {
                params: { query: q, language, page: pageParam },
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.total_pages ? last.page + 1 : undefined,
        enabled: q.length > 2,
    });
}

export function useSearchSuggestions(query: string, type: SearchType, language: string = 'en-US') {
    const q = query.trim();
    return useQuery({
        queryKey: ['movies', 'search', 'suggestions', type, q, language],
        queryFn: async () => {
            const endpoint = type === 'all' ? 'search/multi' : `search/${type}`;
            const { data } = await tmdbClient.get<TMDBResponse<any>>(endpoint, {
                params: { query: q, language, page: 1 },
            });
            return data.results.slice(0, 5);
        },
        enabled: q.length > 2,
        staleTime: 5 * 60 * 1000,
    });
}
