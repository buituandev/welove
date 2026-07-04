import { CgvMovie, CgvMovieResponse } from "@/types/cgv";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { cgvClient } from "./client";
import { cgvKeys } from "./queryKeys";

export const useCgvMoviesQuery = (options?: Omit<UseQueryOptions<CgvMovie[], Error>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: cgvKeys.sneakShow(),
        queryFn: () => getCgvMoviesData(),
        staleTime: 1000 * 60 * 5,
        ...options,
    });
};

export const getCgvMoviesData = async (): Promise<CgvMovie[]> => {
    const res = await cgvClient.get<CgvMovieResponse>(`api/movie/listSneakShow`);
    return res.data.data;
}