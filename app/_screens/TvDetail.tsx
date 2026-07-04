import { TvDetailView } from "@/components/tracker/TvDetailView";
import { useLocalSearchParams } from "expo-router";

const TvDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <TvDetailView tvId={Number(id)} />;
};

export default TvDetailScreen;
