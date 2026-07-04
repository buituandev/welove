import { TMDBMovieImage } from "@/types/moviedb/movie-images";

/**
 * Finds the best logo among available movie/tv images based on language (prioritizes English)
 * and voting data.
 */
export const getBestLogo = (logos?: TMDBMovieImage[]) => {
    if (!logos || logos.length === 0) return null;
    const enLogos = logos.filter(l => l.iso_639_1 === "en");
    if (enLogos.length > 0) {
        return enLogos.sort((a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count)[0];
    }
    const neutralLogos = logos.filter(l => !l.iso_639_1);
    if (neutralLogos.length > 0) {
        return neutralLogos.sort((a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count)[0];
    }
    return [...logos].sort((a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count)[0];
};

/**
 * Intelligently calculates logo width and height based on its aspect ratio
 * to maintain a consistent visual weight (area) while strictly adhering to screen constraints.
 */
export const getLogoDimensions = (aspectRatio: number, screenWidth: number) => {
    // Target visual area of the logo in square pixels.
    // 9500 gives a balanced size (e.g. ~170x55 for 3.0 ratio wide logo, 90x90 capped for 1.0 square logo).
    const targetArea = 9500; 
    
    let height = Math.sqrt(targetArea / aspectRatio);
    let width = height * aspectRatio;
    
    // Constraints to avoid extreme cases
    const maxLogoWidth = screenWidth * 0.8;
    const maxLogoHeight = 85; // Avoid pushing other header elements down with excessively tall logos
    const minLogoHeight = 40; // Maintain legibility for extremely wide/panoramic logos
    
    if (height > maxLogoHeight) {
        height = maxLogoHeight;
        width = height * aspectRatio;
    } else if (height < minLogoHeight) {
        height = minLogoHeight;
        width = height * aspectRatio;
    }
    
    if (width > maxLogoWidth) {
        width = maxLogoWidth;
        height = width / aspectRatio;
    }
    
    return {
        width,
        height,
    };
};
