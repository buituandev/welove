import React from "react";
import { Text, View } from "react-native";
import { InfoRow, sharedStyles } from "./shared/TvDetailAtoms";

interface TvInfoSectionProps {
    tv: any;
}

export const TvInfoSection = ({ tv }: TvInfoSectionProps) => (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Text style={[sharedStyles.sectionTitle, { marginBottom: 4 }]}>Information</Text>
        {!!tv.first_air_date && <InfoRow label="First Aired" value={tv.first_air_date} />}
        {!!tv.last_air_date && <InfoRow label="Last Aired" value={tv.last_air_date} />}
        {!!tv.number_of_seasons && <InfoRow label="Seasons" value={tv.number_of_seasons.toString()} />}
        {!!tv.number_of_episodes && <InfoRow label="Episodes" value={tv.number_of_episodes.toString()} />}
        {!!tv.status && <InfoRow label="Status" value={tv.status} />}
        {!!tv.original_language && <InfoRow label="Original Language" value={tv.original_language.toUpperCase()} />}
        {!!tv.homepage && <InfoRow label="Homepage" isLink value={tv.homepage} />}
        {tv.production_companies?.length > 0 && (
            <InfoRow label="Production Companies" value={tv.production_companies.map((g: any) => g.name).join(", ")} />
        )}
        {tv.spoken_languages?.length > 0 && (
            <InfoRow label="Spoken Languages" value={tv.spoken_languages.map((g: any) => g.name).join(", ")} />
        )}
        {!!tv.vote_count && tv.vote_count > 0 && (
            <InfoRow label="Rating" value={`${tv.vote_average?.toFixed(1)} / 10 (${tv.vote_count?.toLocaleString()} votes)`} />
        )}
        {tv.genres?.length > 0 && (
            <InfoRow label="Genres" value={tv.genres.map((g: any) => g.name).join(", ")} />
        )}
    </View>
);
