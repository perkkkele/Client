import { API_URL } from './config';

/**
 * Quick Replies API Client
 * 
 * Generates contextual quick reply suggestions for the chat interface.
 * Used in FULL mode where quick replies are generated server-side.
 */

export interface QuickRepliesResponse {
    quickReplies: string[];
    source: 'llm' | 'fallback';
}

/**
 * Generate quick replies based on the conversation context
 * @param professionalId - ID of the professional
 * @param twinResponse - The avatar's latest response text
 * @param userMessage - The user's last message (optional)
 */
export async function generateQuickReplies(
    professionalId: string,
    twinResponse: string,
    userMessage?: string
): Promise<QuickRepliesResponse> {
    try {
        const response = await fetch(`${API_URL}/quick-replies/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professionalId,
                twinResponse,
                userMessage: userMessage || '',
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('[QuickRepliesAPI] Error:', error);
        // Return fallback replies on error
        return {
            quickReplies: [
                'Quiero reservar cita',
                'Cuáles son tus tarifas?',
                'Trabajas los fines de semana?',
                'Gracias por la info'
            ],
            source: 'fallback'
        };
    }
}

export default {
    generateQuickReplies,
};
