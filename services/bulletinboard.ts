import { useQuery } from "@tanstack/react-query";
import { bulletinClient } from "./client";

export const getBulletinboard = async () => {
    const urlStr = process.env.EXPO_PUBLIC_BULLETINBOARD_URL;

    if (!urlStr) {
        throw new Error("EXPO_PUBLIC_BULLETINBOARD_URL is not set in environment variables");
    }

    let path = urlStr;
    try {
        const urlObj = new URL(urlStr);
        path = urlObj.pathname + urlObj.search;
    } catch (e) { }

    const response = await bulletinClient.get(path);

    return response.data;
};

export const useBulletinboard = () => {
    return useQuery({
        queryKey: ["bulletinboard"],
        queryFn: getBulletinboard,
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
        gcTime: 1000 * 60 * 10,   // 10 minutes cache time
        refetchOnWindowFocus: true, // auto refetch when app regains focus
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 2, // retry twice on failure before showing error
    });
};
