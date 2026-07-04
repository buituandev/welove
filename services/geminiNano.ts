import { generateText } from 'react-native-gemini-nano';
import { SUMMARIZE_PROMPT } from '../prompts/summarize';

// In-memory cache for post summaries to avoid re-computation
const summaryCache = new Map<string, string>();

/**
 * Summarizes the given text using Gemini Nano on-device model.
 * Caches the response by postId to avoid duplicate computations.
 */
export async function summarizePost(postId: string, text: string): Promise<string> {
    if (summaryCache.has(postId)) {
        return summaryCache.get(postId)!;
    }

    const prompt = `${SUMMARIZE_PROMPT}${text}`;
    const response = await generateText(prompt, {
        temperature: 0.5, // lower temperature for more deterministic/factual summaries
        maxTokens: 256,
    });

    const trimmedResponse = response.trim();
    summaryCache.set(postId, trimmedResponse);
    return trimmedResponse;
}

/**
 * Clear the summary cache if needed (e.g., on logout).
 */
export function clearSummaryCache() {
    summaryCache.clear();
}
