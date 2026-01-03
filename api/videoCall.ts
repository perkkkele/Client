// Video Call API
// Client-side functions for video call management

import { API_URL } from "./config";

export interface VideoCallRoom {
    name: string;
    livekitUrl: string;
    chatId: string;
}

export interface VideoCallToken {
    room: string;
    livekitUrl: string;
    identity: string;
    isProfessional: boolean;
    token?: string;
}

export interface VideoCallStatus {
    active: boolean;
    roomId: string | null;
}

// Create/initiate a video call for a chat
export async function createVideoCall(
    token: string,
    chatId: string
): Promise<{ room: VideoCallRoom }> {
    const response = await fetch(`${API_URL}/video-call/${chatId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear videollamada");
    }

    return response.json();
}

// Get token to join a video call
export async function getVideoCallToken(
    token: string,
    chatId: string
): Promise<VideoCallToken> {
    const response = await fetch(`${API_URL}/video-call/${chatId}/token`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al obtener token");
    }

    return response.json();
}

// End a video call
export async function endVideoCall(
    token: string,
    chatId: string
): Promise<void> {
    const response = await fetch(`${API_URL}/video-call/${chatId}/end`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al finalizar videollamada");
    }
}

// Get video call status
export async function getVideoCallStatus(
    token: string,
    chatId: string
): Promise<VideoCallStatus> {
    const response = await fetch(`${API_URL}/video-call/${chatId}/status`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al obtener estado");
    }

    return response.json();
}
