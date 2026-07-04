export type ZodiacSignKey =
    | 'aquarius'
    | 'pisces'
    | 'aries'
    | 'taurus'
    | 'gemini'
    | 'cancer'
    | 'leo'
    | 'virgo'
    | 'libra'
    | 'scorpio'
    | 'sagittarius'
    | 'capricorn'
    | 'unknown';

export type ChineseZodiacKey =
    | 'rat'
    | 'ox'
    | 'tiger'
    | 'rabbit'
    | 'dragon'
    | 'snake'
    | 'horse'
    | 'goat'
    | 'monkey'
    | 'rooster'
    | 'dog'
    | 'pig';

export type GenerationKey =
    | 'genAlpha'
    | 'genZ'
    | 'millennial'
    | 'genX'
    | 'babyBoomer'
    | 'silentGeneration';

export type MoonPhaseKey =
    | 'newMoon'
    | 'waxingCrescent'
    | 'firstQuarter'
    | 'waxingGibbous'
    | 'fullMoon'
    | 'waningGibbous'
    | 'lastQuarter'
    | 'waningCrescent';

export type BMIStatusKey =
    | 'underweight'
    | 'normalWeight'
    | 'overweight'
    | 'obesity';

export const enrichProfileData = async (birthday: string) => {
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return null;

    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    return {
        dayOfWeek: getDayOfWeek(date),
        daysLived: getDaysLived(date),
        moonPhase: getMoonPhase(year, month, day),
        historicalEvent: await getHistoricalEvent(month, day),
        zodiacSign: calculateZodiacSign(birthday),
        chineseZodiac: getChineseZodiac(date.getUTCFullYear()),
        lifePathNumber: calculateLifePath(birthday),
        generation: getGeneration(date.getUTCFullYear()),
    };
};

export const calculateZodiacSign = (birthday: string): ZodiacSignKey => {
    const date = new Date(birthday);
    
    if (isNaN(date.getTime())) {
        return 'unknown';
    }

    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';

    return 'unknown';
};

/**
 * 1. Chinese Zodiac (Based on a 12-year cycle)
 */
const getChineseZodiac = (year: number): ChineseZodiacKey => {
    const animals: ChineseZodiacKey[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
    // The cycle repeats every 12 years; 1924 was a year of the Rat
    return animals[(year - 1924) % 12];
};

/**
 * 2. Life Path Number (Numerology)
 * Sums all digits of the birthday until a single digit or Master Number (11, 22, 33) is reached.
 */
const calculateLifePath = (birthday: string): number => {
    const digits = birthday.replace(/\D/g, ''); // Get only numbers
    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
        sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return sum;
};

/**
 * 3. Generation Labeling
 */
const getGeneration = (year: number): GenerationKey => {
    if (year >= 2013) return 'genAlpha';
    if (year >= 1997) return 'genZ';
    if (year >= 1981) return 'millennial';
    if (year >= 1965) return 'genX';
    if (year >= 1946) return 'babyBoomer';
    return 'silentGeneration';
};

const getDayOfWeek = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
};

/**
 * 2. Days Lived & Exact Age
 */
const getDaysLived = (birthDate: Date): string => {
    const diff = new Date().getTime() - birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)).toLocaleString();
};

/**
 * 3. Moon Phase (Conway's Algorithm approximation)
 * Returns a string representing the moon phase.
 */
const getMoonPhase = (year: number, month: number, day: number): MoonPhaseKey => {
    let r = year % 100;
    r %= 19;
    if (r > 9) r -= 19;
    r = ((r * 11) % 30) + month + day;
    if (month < 3) r += 2;
    r = (year < 2000) ? 4 - r : 8.3 - r;
    r = Math.floor(r % 30);
    if (r < 0) r += 30;

    const phases: MoonPhaseKey[] = ['newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'fullMoon', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
    // Map the 30-day cycle to our 8 phases
    const index = Math.floor(r / 3.75) % 8;
    return phases[index];
};

/**
 * 4. Historical "On This Day"
 * Uses the Wikimedia API (Free, no API key required)
 */
interface WikiOnThisDayEvent {
    text: string;
    year: number;
    pages: {
        type: string;
        title: string;
        displaytitle: string;
        thumbnail?: { source: string; width: number; height: number };
        originalimage?: { source: string; width: number; height: number };
        description: string;
        extract: string;
        content_urls: {
            desktop: { page: string; revisions: string; edit: string; talk: string };
            mobile: { page: string; revisions: string; edit: string; talk: string };
        };
    }[];
}

interface WikiOnThisDayResponse {
    events: WikiOnThisDayEvent[];
}

const getHistoricalEvent = async (month: number, day: number): Promise<string> => {
    try {
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${paddedMonth}/${paddedDay}`,
            { headers: { 'User-Agent': 'WeLoveApp/1.0 (mobile; contact@welove.app)' } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: WikiOnThisDayResponse = await response.json();
        return data.events[0]?.text ?? "A quiet day in history.";
    } catch (error) {
        return "History is still being written...";
    }
};

export const calculateBMI = (heightCm: number, weightKg: number): number => {
    if (heightCm <= 0) return 0;
    const heightMeters = heightCm / 100;
    const bmi = weightKg / (heightMeters * heightMeters);
    return Math.round(bmi * 10) / 10;
};

export const getBMIStatus = (bmi: number): BMIStatusKey => {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normalWeight';
    if (bmi < 30) return 'overweight';
    return 'obesity';
};