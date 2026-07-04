import { MovieDetailView } from "@/components/tracker/MovieDetailView";
import { useLocalSearchParams } from "expo-router";

const MovieDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <MovieDetailView movieId={Number(id)} />;
};

export default MovieDetailScreen;
