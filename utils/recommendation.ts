/**
 * recommendation.ts
 *
 * 100% offline, highly advanced local recommendation engine.
 *
 * Techniques used:
 * 1. BM25 TF-IDF       — dynamically scores word rarity based on the local video library.
 * 2. Recency Bias      — chronologically weights user history (recent = more relevant).
 * 3. Concept Expansion — semantic synonym mapping tailored for niche demographics.
 * 4. Phrase Boosting   — heavily rewards exact sequence matches (Actor/Studio names).
 * 5. Multilingual NLP  — CJK unigram tokenization + Bigram overlapping for non-Latin text.
 * 6. Suffix Stemming   — reduces English word variants to a common root safely.
 * 7. Sørensen-Dice     — character-trigram fuzzy similarity (typo + prefix tolerance).
 * 8. Signal Parsing    — respects durations ("under 5 min") and popularity ("hidden gem").
 */

import type { VideoCard } from '@/types/shows/videoCard';

// ─── Constants & Configuration ───────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
  'has', 'have', 'how', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'so',
  'that', 'the', 'this', 'to', 'up', 'was', 'were', 'what', 'when', 'where',
  'which', 'who', 'will', 'with', 'you', 'your',
  // Note: "hd" and "4k" are intentionally excluded as they are high-value search terms here.
  // Common filler words for this specific industry:
  'video', 'episode', 'part', 'watch', 'official', 'scene', 'clip', 'trailer', 'full', 'update'
]);

// Semantic expansion: tailored for niche demographics, formats, and sub-genres
const CONCEPT_MAP: Record<string, string[]> = {
  amateur: ['homemade', 'cam', 'solo', 'indie', 'college', 'couple'],
  physique: ['muscle', 'jock', 'athletic', 'gym', 'bear', 'twink', 'hunk', 'chub', 'mature', 'young', 'thick', 'petite', 'milf', 'dilf', 'bbw'],
  anatomy: ['ass', 'booty', 'butt', 'pussy', 'puss', 'kitty', 'dick', 'cock', 'dong', 'd', 'tits', 'boobs', 'breasts'],
  action: ['anal', 'blowjob', 'bj', 'suck', 'ride', 'fuck', 'creampie', 'swallow', 'facial', 'deepthroat', 'squirt'],
  format: ['vr', 'pov', 'interview', 'bts', 'behind the scenes', 'uncensored', 'leaked', 'compilation'],
  vibe: ['romantic', 'passion', 'rough', 'hardcore', 'softcore', 'massage', 'sensual', 'bdsm', 'kink'],
  roleplay: ['story', 'plot', 'fantasy', 'boss', 'coworker', 'student', 'teacher', 'step', 'maid', 'nurse', 'cop'],
  studio: ['premium', 'exclusive', 'pro', 'member', 'network'],
};

// ─── NLP Utilities ───────────────────────────────────────────────────────────

function stem(word: string): string {
  if (typeof word !== 'string') return '';
  let w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // MULTILINGUAL SAFEGUARD: Immediately return if word contains non-Latin characters.
  // Applying English suffix stripping to CJK, Arabic, or Cyrillic corrupts the data.
  if (/[^\x00-\x7F]/.test(w)) return w;

  // Step 1 — common suffixes
  if (w.endsWith('ingly')) w = w.slice(0, -5);
  else if (w.endsWith('edly')) w = w.slice(0, -4);
  else if (w.endsWith('ing') || w.endsWith('ous') || w.endsWith('ful') || w.endsWith('ish')) w = w.slice(0, -3);
  else if (w.endsWith('ness') || w.endsWith('ment') || w.endsWith('tion')) {
    w = w.endsWith('tion') ? w.slice(0, -4) + 't' : w.slice(0, -4);
  }
  else if (w.endsWith('ly') || w.endsWith('ed') || w.endsWith('er') || w.endsWith('es') || w.endsWith('ic') || w.endsWith('al')) w = w.slice(0, -2);

  // Step 2 & 3 — trailing single s and double consonant normalisation
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('us') && !w.endsWith('is') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 3 && w[w.length - 1] === w[w.length - 2]) w = w.slice(0, -1);
  return w;
}

function trigrams(str: string): string[] {
  if (typeof str !== 'string') return [];
  const s = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (s.length < 2) return s.length ? [s] : [];
  const grams: string[] = [];
  for (let i = 0; i <= s.length - 2; i++) grams.push(s.slice(i, i + 2));
  return grams;
}

function dice(ga: string[], gb: string[]): number {
  if (!Array.isArray(ga) || !Array.isArray(gb) || ga.length === 0 || gb.length === 0) return 0;
  let matches = 0;
  const mapA = new Map<string, number>();
  for (const g of ga) mapA.set(g, (mapA.get(g) || 0) + 1);
  for (const g of gb) {
    const count = mapA.get(g);
    if (count && count > 0) {
      matches++;
      mapA.set(g, count - 1);
    }
  }
  return (2 * matches) / (ga.length + gb.length);
}

function tokenize(text: string): string[] {
  if (typeof text !== 'string') return [];
  // 1. Lowercase and replace non-letters/numbers with spaces
  let normalized = text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ');

  // 2. MULTILINGUAL FIX (CJK Support):
  // Because Chinese, Japanese, and Korean don't use spaces, we inject spaces 
  // around CJK characters. This turns them into individual tokens (unigrams) 
  // so the TF-IDF dictionary can properly score character rarity.
  // Covers: CJK Ideographs (\u4E00-\u9FFF), Kana (\u3040-\u30FF), Hangul (\uAC00-\uD7A3)
  normalized = normalized.replace(/([\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7A3])/g, ' $1 ');

  return normalized
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

// ─── TF-IDF / BM25 Dictionary Builder ────────────────────────────────────────

/**
 * Calculates Inverse Document Frequency (IDF) for all tokens in the library.
 * Rare words (e.g., exact actor names, specific codes) get massive scores.
 * Common words get low scores.
 */
function buildLibraryIDF(videos: VideoCard[]): Map<string, number> {
  const documentFrequency = new Map<string, number>();
  const cleanVideos = Array.isArray(videos) ? videos : [];
  const N = cleanVideos.length;

  for (const v of cleanVideos) {
    if (!v || typeof v.title !== 'string') continue;
    // Unique stems per video title
    const uniqueStems = new Set(tokenize(v.title).map(stem));
    for (const s of uniqueStems) {
      documentFrequency.set(s, (documentFrequency.get(s) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [s, df] of documentFrequency.entries()) {
    // BM25 IDF formulation: log(1 + (N - df + 0.5) / (df + 0.5))
    const score = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    idf.set(s, score);
  }
  return idf;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseDurationSec(dur: string): number {
  if (typeof dur !== 'string' || !dur) return 0;
  const parts = dur.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseViews(v: string): number {
  if (typeof v !== 'string' || !v) return 0;
  const s = v.toLowerCase().replace(/[^0-9.km]/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (s.endsWith('m')) return n * 1_000_000;
  if (s.endsWith('k')) return n * 1_000;
  return n;
}

// ─── Public Types ────────────────────────────────────────────────────────────

export interface RecommendationResult {
  video: VideoCard;
  reason: string;
  score: number;
}

export interface InterestProfile {
  topKeywords: string[];
  generatedVibe: string;
  isNewUser: boolean;
}

// ─── Core Recommendation Engine ──────────────────────────────────────────────

export function getDynamicRecommendation(
  videos: VideoCard[],
  vibeQuery: string,
): RecommendationResult {
  const cleanVideos = Array.isArray(videos) ? videos : [];
  if (!cleanVideos.length) {
    throw new Error('No candidate videos');
  }

  const queryRaw = typeof vibeQuery === 'string' ? vibeQuery.toLowerCase().trim() : '';
  let queryTokens = tokenize(queryRaw);

  // 1. Concept Expansion (inject synonyms directly into the query)
  const expandedTokens = [...queryTokens];
  for (const token of queryTokens) {
    for (const [key, synonyms] of Object.entries(CONCEPT_MAP)) {
      if (token.includes(key) || stem(token) === stem(key)) {
        expandedTokens.push(...synonyms);
      }
    }
  }
  // Deduplicate after expansion
  queryTokens = Array.from(new Set(expandedTokens));

  // 2. Pre-compute Query Data
  const queryData = queryTokens.map(token => ({
    raw: token,
    stem: stem(token),
    grams: trigrams(token)
  }));
  const fullQueryGrams = trigrams(queryRaw);

  // 3. Build Dynamic IDF Dictionary
  const idfMap = buildLibraryIDF(cleanVideos);
  // Unseen words get max theoretical IDF score
  const maxIDF = Math.log(1 + (cleanVideos.length + 0.5) / 0.5);
  const getIDF = (term: string) => idfMap.get(term) || maxIDF;

  // 4. Signal Parsers
  const wantsShort = /\b(short|quick|brief|under|less)\b/.test(queryRaw);
  const wantsLong = /\b(long|full|extended|over|more)\b/.test(queryRaw);

  let targetSec: number | null = null;
  const hrMatch = queryRaw.match(/(\d+)\s*(?:hr|hour)/);
  const minMatch = queryRaw.match(/(\d+)\s*(?:min|minute)/);

  if (hrMatch) targetSec = parseInt(hrMatch[1], 10) * 3600;
  else if (minMatch) targetSec = parseInt(minMatch[1], 10) * 60;

  const wantsPopular = /\b(popular|trending|hot|top|viral|famous)\b/.test(queryRaw);
  const wantsHidden = /\b(hidden|gem|underrated|rare|obscure|unknown)\b/.test(queryRaw);

  let bestScore = -Infinity;
  let bestVideo = cleanVideos[0];

  for (const video of cleanVideos) {
    if (!video) continue;
    let score = 0;
    const titleRaw = typeof video.title === 'string' ? video.title.toLowerCase() : '';
    const titleTokens = tokenize(titleRaw);
    const titleStems = titleTokens.map(stem);

    const titleGrams = titleTokens.map(trigrams);
    const fullTitleGrams = trigrams(titleRaw);

    // [A] Exact Phrase Boost (O(1) substring check, huge reward for sequences)
    // CRITICAL: Massively increased to 40. Matching exact actor names or specific studio serial codes is the highest priority signal.
    if (queryRaw.length > 3 && titleRaw.includes(queryRaw)) {
      score += 40;
    }

    // [B] IDF-Weighted Token Matches
    for (const qObj of queryData) {
      const termIDF = getIDF(qObj.stem);

      // Exact word match (Multiplier set to 5 to prioritize specific tags)
      if (titleTokens.includes(qObj.raw)) {
        score += termIDF * 5;
      }
      // Stemmed match (e.g. "running" -> "run") (Set to 3)
      else if (titleStems.includes(qObj.stem)) {
        score += termIDF * 3;
      }
      // Fuzzy Trigram Match (handles typos)
      else {
        let bestFuzzy = 0;
        for (const tGrams of titleGrams) {
          const d = dice(qObj.grams, tGrams);
          if (d > bestFuzzy) bestFuzzy = d;
        }
        if (bestFuzzy > 0.6) {
          score += termIDF * bestFuzzy * 1.5;
        }
      }
    }

    // [C] Whole Phrase Trigram overlap
    score += dice(fullQueryGrams, fullTitleGrams) * 5;

    // [D] Duration Signal
    const durSec = parseDurationSec(video.duration);
    if (durSec > 0) {
      if (targetSec !== null) {
        const tolerance = targetSec * 0.25; // 25% tolerance
        const diff = Math.abs(durSec - targetSec);
        score += Math.max(0, 10 - (diff / tolerance) * 5);
      } else if (wantsShort && durSec < 420) { // < 7 mins
        score += 8;
      } else if (wantsLong && durSec > 1200) { // > 20 mins
        score += 8;
      }
    }

    // [E] Popularity Signal
    const views = parseViews(video.views);
    if (wantsPopular) {
      if (video.hot) score += 6;
      if (views > 0) score += Math.log10(views + 1) * 2;
    } else if (wantsHidden) {
      if (!video.hot) score += 5;
      if (views > 0) score += (1 / Math.log10(views + 100)) * 25;
    } else {
      if (video.hot) score += 0.5; // Passive tiebreaker
    }

    if (score > bestScore) {
      bestScore = score;
      bestVideo = video;
    }
  }

  const reason = buildReason(queryRaw, bestVideo, wantsShort, wantsLong, wantsPopular, wantsHidden);
  return { video: bestVideo, reason, score: bestScore };
}

function buildReason(query: string, video: VideoCard, short: boolean, long: boolean, popular: boolean, hidden: boolean): string {
  const title = video && typeof video.title === 'string' ? video.title : 'Selected Video';
  const duration = video && typeof video.duration === 'string' ? video.duration : '';

  if (hidden) return `"${title}" is an underrated gem matching your vibe!`;
  if (popular) return `"${title}" is trending right now and fits your request perfectly.`;
  if (short) return `"${title}" (${duration}) is a great quick watch for your current vibe.`;
  if (long) return `"${title}" (${duration}) is an immersive, longer watch fitting your request.`;
  return `Based on your vibe, "${title}" is the perfect match.`;
}

// ─── Interest Profile Builder (With Recency Decay) ───────────────────────────

function applyHistoryBiased(items: string[], baseWeight: number, freq: Record<string, number>) {
  if (!Array.isArray(items)) return;
  const len = items.length;
  items.forEach((raw, i) => {
    if (typeof raw !== 'string' || !raw) return;
    // Linear Recency Bias: Oldest item = 1x weight. Newest item = 2.5x weight.
    const recencyMultiplier = len > 1 ? 1 + (1.5 * (i / (len - 1))) : 1.5;
    const weight = baseWeight * recencyMultiplier;

    const tokens = tokenize(raw);
    for (const t of tokens) {
      if (t.length === 0) continue;
      const s = stem(t);
      if (!s) continue;
      freq[s] = (freq[s] ?? 0) + weight;
    }
  });
}

export function buildInterestProfile(
  watchlistTitles: string[] = [],
  searchQueries: string[] = [],
  likedTitles: string[] = [],
): InterestProfile {
  const freq: Record<string, number> = {};

  const cleanWatchlist = Array.isArray(watchlistTitles) ? watchlistTitles : [];
  const cleanSearch = Array.isArray(searchQueries) ? searchQueries : [];
  const cleanLikes = Array.isArray(likedTitles) ? likedTitles : [];

  // Process history with positional recency tracking
  applyHistoryBiased(cleanWatchlist, 1.0, freq);
  applyHistoryBiased(cleanSearch, 1.5, freq); // Searches indicate slightly higher direct intent
  applyHistoryBiased(cleanLikes, 3.0, freq);   // Likes are strong positive reinforcement signals

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  const topKeywords = sorted.slice(0, 5);
  const isNewUser = topKeywords.length === 0;

  // Clean up array joins to pass cleanly to the dynamic engine
  const generatedVibe = topKeywords.join(' ');

  return { topKeywords, generatedVibe, isNewUser };
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export function getPersonalisedRecommendation(
  videos: VideoCard[],
  watchlistTitles: string[] = [],
  searchQueries: string[] = [],
  likedTitles: string[] = [],
): RecommendationResult & { profile: InterestProfile } {
  const cleanVideos = Array.isArray(videos) ? videos : [];
  const profile = buildInterestProfile(watchlistTitles, searchQueries, likedTitles);

  if (profile.isNewUser || !cleanVideos.length) {
    const hot = cleanVideos.find(v => v && v.hot) ?? cleanVideos[0] ?? null;
    return {
      video: hot,
      reason: `Trending right now — an amazing place to start!`,
      score: 0,
      profile,
    };
  }

  const result = getDynamicRecommendation(cleanVideos, profile.generatedVibe);
  return { ...result, profile };
}