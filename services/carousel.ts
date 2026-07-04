import { CarouselItem } from "@/types/carousel";
import { useQuery } from "@tanstack/react-query";
import { client } from "./client";
import { carouselKeys } from "./queryKeys";

export const useCarouselQuery = () => {
    return useQuery({
        queryKey: carouselKeys.lists(),
        queryFn: () => getCarouselData(),
    });
};

export const getCarouselData = async (): Promise<CarouselItem[]> => {
    const res = await client.get(`/api/carousel`);
    return res.data.data;
}