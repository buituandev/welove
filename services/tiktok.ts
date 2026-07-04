import { fetch as nitroFetch } from "react-native-nitro-fetch";

export const getTiktokProfile = async (username: string) => {
    const input = {
        profiles: [username],
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        resultsPerPage: 100,
        excludePinnedPosts: false,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadAvatars: false,
    };

    const actorId = "0FXVyOXXEmdGcV88a";
    const token = process.env.EXPO_PUBLIC_APIFY_TOKEN;

    if (!token) {
        console.error("APIFY_TOKEN is missing");
        return;
    }

    try {
        console.log("Starting Apify actor run...");
        const runUrl =
            `https://api.apify.com/v2/acts/${actorId}/runs` +
            `?${new URLSearchParams({
                token,
                waitForFinish: "120",
            })}`;

        const runResponse = await nitroFetch(runUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });

        if (!runResponse.ok) {
            throw new Error(`Apify run failed: ${runResponse.status}`);
        }

        const runJson = await runResponse.json();
        const runData = runJson.data;
        const defaultDatasetId = runData.defaultDatasetId;

        console.log("Actor run finished. Fetching results from dataset:", defaultDatasetId);

        const datasetUrl =
            `https://api.apify.com/v2/datasets/${defaultDatasetId}/items` +
            `?${new URLSearchParams({ token })}`;

        const datasetResponse = await nitroFetch(datasetUrl);

        if (!datasetResponse.ok) {
            throw new Error(`Apify dataset fetch failed: ${datasetResponse.status}`);
        }

        const items = await datasetResponse.json();
        console.log(items);
    } catch (error) {
        console.error("Error running Apify actor:", error);
    }
};
