/**
 * Gemini Voice API
 * Client-side API for fetching Gemini Live voice catalog
 * Used in CUSTOMS2S mode (speech-to-speech via Gemini Live API)
 */

import { API_URL } from "./config";

export interface GeminiVoice {
    id: string;
    name: string;
    displayName: string;
    gender: string;
    description: string;
    language: string;
    provider: 'gemini';
    previewAvailable: boolean;
    tags: string[];
    recommended?: boolean;
    useCases?: string[];
}

/**
 * Fetch Gemini voices catalog
 * @param language - Language code for descriptions: 'es' (default), 'en'
 * @param gender - Filter by gender: 'male', 'female', 'neutral'
 */
export async function getGeminiVoices(
    language: string = 'es',
    gender?: string
): Promise<GeminiVoice[]> {
    try {
        const params = new URLSearchParams();
        if (language) params.append('language', language);
        if (gender) params.append('gender', gender.toLowerCase());

        const response = await fetch(`${API_URL}/gemini-voices/voices?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch Gemini voices: ${response.status}`);
        }

        const data = await response.json();
        return data.voices || [];
    } catch (error) {
        console.error('[GeminiVoiceApi] Error fetching voices:', error);
        throw error;
    }
}

/**
 * Get a single Gemini voice by ID
 * @param voiceId - Voice name/ID (e.g. 'Kore', 'Puck')
 */
export async function getGeminiVoice(voiceId: string): Promise<GeminiVoice | null> {
    try {
        const response = await fetch(`${API_URL}/gemini-voices/voices/${voiceId}`);

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch voice: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[GeminiVoiceApi] Error fetching voice:', error);
        return null;
    }
}
