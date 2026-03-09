/**
 * ElevenLabs Voice API
 * Client-side API for fetching ElevenLabs voice catalog
 * proxied through our server to keep API keys secure
 */

import { API_URL } from "./config";

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    gender: string | null;
    language: string;
    accent: string | null;
    age: string | null;
    description: string | null;
    use_case: string | null;
    preview_url: string | null;
    category: string | null;
}

/**
 * Fetch ElevenLabs voices — curated catalog filtered by language and avatar gender
 * @param language - Language code: 'es', 'en', 'fr', 'de'
 * @param gender - Avatar gender: 'male', 'female' (filters voices to match)
 */
export async function getVoices(
    language: string = 'es',
    gender?: string
): Promise<ElevenLabsVoice[]> {
    try {
        const params = new URLSearchParams({ language });
        if (gender) params.append('gender', gender.toLowerCase());

        const response = await fetch(`${API_URL}/elevenlabs/voices?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.status}`);
        }

        const data = await response.json();
        return data.voices || [];
    } catch (error) {
        console.error('[ElevenLabsApi] Error fetching voices:', error);
        throw error;
    }
}

/**
 * Get preview URL for a voice
 * If the voice has a native preview_url, returns that.
 * Otherwise, returns the server-generated preview endpoint URL.
 * 
 * @param voiceId - ElevenLabs voice ID
 * @param language - Language for generated preview text
 * @param existingPreviewUrl - Existing preview URL from voice metadata
 */
export function getPreviewUrl(
    voiceId: string,
    language: string = 'es',
    existingPreviewUrl?: string | null
): string {
    // Use existing preview URL if available
    if (existingPreviewUrl) {
        return existingPreviewUrl;
    }
    // Fall back to our server-generated TTS preview
    return `${API_URL}/elevenlabs/voices/${voiceId}/preview?language=${language}`;
}
