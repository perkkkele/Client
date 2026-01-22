/**
 * Voice Session API (v2)
 * 
 * API functions to interact with the new LiveKit Agents-based
 * voice streaming system with Turn Detector.
 */

import { API_URL } from "./config";

/**
 * Response from the voice session start endpoint
 */
export interface VoiceSessionV2Response {
    success: boolean;
    data?: {
        roomName: string;
        livekitUrl: string;
        clientToken: string;
        heygenToken: string;
        agentToken: string;
        avatarId: string;
    };
    error?: string;
}

/**
 * Start a new voice session v2 with our own LiveKit room.
 * 
 * This creates a room in our LiveKit Cloud account and returns tokens
 * for the client, HeyGen avatar, and our voice agent to join.
 * 
 * @param token - Auth token
 * @param professionalId - ID of the professional whose avatar to use
 * @param chatId - ID of the chat session
 * @returns Session data including room name and tokens
 */
export async function startVoiceSessionV2(
    token: string,
    professionalId: string,
    chatId: string
): Promise<VoiceSessionV2Response> {
    try {
        const response = await fetch(`${API_URL}/voice/session-v2/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ professionalId, chatId }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[VoiceSessionV2] Start error:", data);
            return {
                success: false,
                error: data.error || `Error starting session: ${response.status}`,
            };
        }

        console.log("[VoiceSessionV2] Session started:", data.data?.roomName);
        return data;

    } catch (error: any) {
        console.error("[VoiceSessionV2] Start exception:", error);
        return {
            success: false,
            error: error.message || "Failed to start voice session",
        };
    }
}

/**
 * Stop a voice session v2 and cleanup the LiveKit room.
 * 
 * @param token - Auth token
 * @param roomName - Name of the room to stop
 */
export async function stopVoiceSessionV2(token: string, roomName: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/voice/session-v2/stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomName }),
        });

        if (!response.ok) {
            console.error("[VoiceSessionV2] Stop error:", response.status);
            return false;
        }

        console.log("[VoiceSessionV2] Session stopped:", roomName);
        return true;

    } catch (error) {
        console.error("[VoiceSessionV2] Stop exception:", error);
        return false;
    }
}

/**
 * Get status of active voice rooms (for debugging).
 * 
 * @param token - Auth token
 */
export async function getVoiceSessionStatus(token: string): Promise<{
    activeRooms: number;
    rooms: Array<{ name: string; numParticipants: number; createdAt: string }>;
} | null> {
    try {
        const response = await fetch(`${API_URL}/voice/session-v2/status`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.data;

    } catch (error) {
        console.error("[VoiceSessionV2] Status exception:", error);
        return null;
    }
}

