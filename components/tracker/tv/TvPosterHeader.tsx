import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { Canvas, ImageShader, LinearGradient, Rect, SkImage, vec } from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { TMDBMovieImage } from "@/types/moviedb/movie-images";
import { getBestLogo, getLogoDimensions } from "../logoUtils";
import {
    ContentRatingPill,
    DotSep,
    GenrePill,
    sharedStyles,
    WatchProviderIcon,
} from "./shared/TvDetailAtoms";
import { withAlpha, getImageUrl } from "./shared/tvDetailUtils";




interface TvPosterHeaderProps {
    tv: any;
    skiaImage: SkImage | null;
    darkDominant: string;
    contentRating: string | null;
    watchProviders: any | null;
    firstAirYear: string;
    runtime: string;
    posterHeight?: number;
    logos?: TMDBMovieImage[];
}

export const TvPosterHeader = ({
    tv,
    skiaImage,
    darkDominant,
    contentRating,
    watchProviders,
    firstAirYear,
    runtime,
    posterHeight = 500,
    logos = [],
}: TvPosterHeaderProps) => {
    const { width } = useWindowDimensions();
    const bestLogo = useMemo(() => getBestLogo(logos), [logos]);


    const deduplicedProviders = [
        ...(watchProviders?.flatrate ?? []),
        ...(watchProviders?.rent ?? []),
        ...(watchProviders?.buy ?? []),
    ].filter((v: any, i: number, a: any[]) =>
        a.findIndex((t: any) => t.provider_id === v.provider_id) === i,
    ).slice(0, 5);

    return (
        <View style={{ position: "relative", overflow: "hidden", height: posterHeight }}>
            {/* Skia Canvas with blur + gradient */}
            <Canvas style={{ height: posterHeight }}>
                {skiaImage && (
                    <BlurMask
                        mask={
                            <LinearGradient
                                start={vec(0, posterHeight * 0.5)}
                                end={vec(0, posterHeight)}
                                colors={["transparent", "black"]}
                            />
                        }
                    >
                        <ImageShader
                            image={skiaImage}
                            x={0} width={width} height={posterHeight}
                            fit="cover" tx="clamp" ty="clamp"
                        />
                    </BlurMask>
                )}
                <Rect x={0} y={0} width={width} height={posterHeight}>
                    <LinearGradient
                        start={vec(0, posterHeight)}
                        end={vec(0, 0)}
                        colors={[withAlpha(darkDominant, "FF"), withAlpha(darkDominant, "99"), "transparent"]}
                        positions={[0, 0.25, 1]}
                    />
                </Rect>
            </Canvas>

            {/* Overlay content */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", bottom: 0, left: 16, right: 16,
                    justifyContent: "flex-end", alignItems: "center",
                    paddingBottom: 24,
                }}
            >
                {/* Title */}
                {bestLogo ? (
                    <Image
                        source={{ uri: getImageUrl(bestLogo.file_path, 500) }}
                        style={getLogoDimensions(bestLogo.aspect_ratio, width)}
                        contentFit="contain"
                    />
                ) : (
                    <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700", textAlign: "center" }}>
                        {tv.name}
                    </FlexText>
                )}

                {/* Tagline */}
                {tv.tagline ? (
                    <Text style={{ color: "white", opacity: 0.6, fontSize: 14, textAlign: "center", fontStyle: "italic", marginTop: 4 }}>
                        {tv.tagline}
                    </Text>
                ) : null}

                {/* Genres */}
                {tv.genres?.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                        {tv.genres.map((g: any) => <GenrePill key={g.id} name={g.name} />)}
                    </View>
                )}

                {/* Watch Providers */}
                {deduplicedProviders.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
                        {deduplicedProviders.map((p: any) => (
                            <WatchProviderIcon key={p.provider_id} logoPath={p.logo_path} providerId={p.provider_id} />
                        ))}
                    </View>
                )}

                {/* Meta row */}
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap", justifyContent: "center", paddingHorizontal: 16 }}>
                    {!!contentRating && <ContentRatingPill rating={contentRating} />}
                    {tv.origin_country?.length > 0 && (
                        <>
                            <FlexText style={[sharedStyles.label]}>{tv.origin_country[0]}</FlexText>
                            <DotSep />
                        </>
                    )}
                    <FlexText style={sharedStyles.label}>{firstAirYear}</FlexText>
                    <DotSep />
                    <FlexText style={sharedStyles.label}>{runtime}</FlexText>
                    <DotSep />
                    <IMDbBadge score={tv.vote_average} />
                    {tv.networks?.slice(0, 3).map((n: any) => (
                        <React.Fragment key={n.id}>
                            <DotSep />
                            <FlexText style={sharedStyles.label} numberOfLines={1}>{n.name}</FlexText>
                        </React.Fragment>
                    ))}
                    {tv.networks?.length > 3 && (
                        <>
                            <DotSep />
                            <FlexText style={sharedStyles.label}>More</FlexText>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};
