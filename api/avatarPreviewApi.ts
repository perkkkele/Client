/**
 * Avatar Preview API
 * Client-side API for the live avatar preview system.
 * Manages preview sessions: start, speak, and stop.
 */

import { API_URL } from "./config";

export interface PreviewSessionData {
    livekitUrl: string;
    clientToken: string;
    roomName: string;
    isHotSession: boolean;
}

/**
 * Start a preview session (creates LiveKit room + LiveAvatar session)
 * Returns LiveKit connection info for displaying the avatar video.
 * 
 * @param token - Auth token
 * @param avatarId - LiveAvatar avatar ID
 * @param language - Language code (es, en, fr, de)
 */
export async function startPreview(
    token: string,
    avatarId: string,
    language: string = 'es'
): Promise<{ success: boolean; data?: PreviewSessionData; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/avatar-preview/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ avatarId, language }),
        });

        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || `Error: ${response.status}` };
        }
        return result;
    } catch (error: any) {
        console.error('[AvatarPreviewApi] Start error:', error);
        return { success: false, error: error.message || 'Failed to start preview' };
    }
}

/**
 * Make the avatar speak using the selected ElevenLabs voice
 * 
 * @param token - Auth token
 * @param voiceId - ElevenLabs voice ID
 * @param language - Language code for the preview phrase
 */
export async function speakPreview(
    token: string,
    voiceId: string,
    language: string = 'es'
): Promise<{ success: boolean; audioDurationMs?: number; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/avatar-preview/speak`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ voiceId, language }),
        });

        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || `Error: ${response.status}` };
        }
        return result;
    } catch (error: any) {
        console.error('[AvatarPreviewApi] Speak error:', error);
        return { success: false, error: error.message || 'Failed to make avatar speak' };
    }
}

/**
 * Stop the preview session and clean up resources
 * 
 * @param token - Auth token
 */
export async function stopPreview(token: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/avatar-preview/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        return response.ok;
    } catch (error) {
        console.error('[AvatarPreviewApi] Stop error:', error);
        return false;
    }
}

export default {
    startPreview,
    speakPreview,
    stopPreview,
};
