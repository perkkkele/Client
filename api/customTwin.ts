import { API_URL } from './config';

/**
 * Custom Twin API Client
 * 
 * Cliente para comunicarse con el motor custom del gemelo digital.
 * Maneja mensajes, sesiones de LiveAvatar, y configuración.
 */

/**
 * Envía un mensaje al gemelo digital y obtiene respuesta
 * @param professionalId - ID del profesional
 * @param chatId - ID del chat
 * @param clientId - ID del cliente
 * @param message - Mensaje del usuario
 */
export async function sendMessage(
    professionalId: string,
    chatId: string,
    clientId: string,
    message: string
): Promise<{
    success: boolean;
    spoken: string;
    written: string;
    quick_replies: string[];
    should_escalate: boolean;
    escalation_reason: string | null;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            chatId,
            clientId,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error sending message: ${response.status}`);
    }

    return response.json();
}

/**
 * Audio chunk from TTS service
 */
export interface AudioChunk {
    data: string;         // Base64 PCM audio
    chunkIndex: number;
    totalChunks: number;
}

/**
 * Response from voice message endpoint
 */
export interface VoiceMessageResponse {
    success: boolean;
    transcription: string;
    spoken: string;
    written: string;
    quick_replies: string[];
    audio?: {
        chunks: AudioChunk[];
        chunkCount: number;
        estimatedDuration: number;
        totalBytes: number;
    };
    should_escalate: boolean;
}

/**
 * Envía un mensaje de voz al gemelo digital
 * @param professionalId - ID del profesional
 * @param chatId - ID del chat
 * @param clientId - ID del cliente
 * @param audioBase64 - Audio grabado en base64
 * @param format - Formato del audio (webm, mp3, wav, etc.)
 */
export async function sendVoiceMessage(
    professionalId: string,
    chatId: string,
    clientId: string,
    audioBase64: string,
    format: string = 'webm'
): Promise<VoiceMessageResponse> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/voice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            audio: audioBase64,
            format,
            chatId,
            clientId,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error sending voice: ${response.status}`);
    }

    return response.json();
}

/**
 * Inicia una sesión de LiveAvatar Custom Mode
 * @param professionalId - ID del profesional
 * @param chatId - ID del chat
 * @param liveAvatarSessionId - ID de sesión de LiveAvatar
 * @param liveAvatarSessionToken - Token de sesión
 */
export async function startSession(
    professionalId: string,
    chatId: string,
    liveAvatarSessionId: string,
    liveAvatarSessionToken: string
): Promise<{
    success: boolean;
    message: string;
    isReady: boolean;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/session/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chatId,
            liveAvatarSessionId,
            liveAvatarSessionToken,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error starting session: ${response.status}`);
    }

    return response.json();
}

/**
 * Cierra una sesión de LiveAvatar
 * @param professionalId - ID del profesional
 * @param chatId - ID del chat
 */
export async function endSession(
    professionalId: string,
    chatId: string
): Promise<{
    success: boolean;
    message: string;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/session/end`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ending session: ${response.status}`);
    }

    return response.json();
}

/**
 * Interrumpe al avatar (cuando el usuario habla)
 * @param professionalId - ID del profesional
 * @param chatId - ID del chat
 */
export async function interruptAvatar(
    professionalId: string,
    chatId: string
): Promise<{
    success: boolean;
    message: string;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/session/interrupt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error interrupting avatar: ${response.status}`);
    }

    return response.json();
}

/**
 * Obtiene la configuración del motor del gemelo digital
 * @param professionalId - ID del profesional
 */
export async function getEngineConfig(
    professionalId: string
): Promise<{
    engineMode: 'FULL' | 'CUSTOM';
    ttsConfig: {
        voice: string;
        speed: number;
    };
    knowledgeVectorSynced: boolean;
    isActive: boolean;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/config`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error getting config: ${response.status}`);
    }

    return response.json();
}

/**
 * Sincroniza el conocimiento del profesional a la base de datos vectorial
 * @param professionalId - ID del profesional
 */
export async function syncKnowledge(
    professionalId: string
): Promise<{
    success: boolean;
    message: string;
    vectorsCreated: number;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/knowledge/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error syncing knowledge: ${response.status}`);
    }

    return response.json();
}

/**
 * Cambia el modo del motor (FULL/CUSTOM)
 * @param professionalId - ID del profesional
 * @param engineMode - Nuevo modo
 */
export async function setEngineMode(
    professionalId: string,
    engineMode: 'FULL' | 'CUSTOM'
): Promise<{
    success: boolean;
    message: string;
}> {
    const response = await fetch(`${API_URL}/custom-twin/${professionalId}/engine-mode`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ engineMode }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error setting engine mode: ${response.status}`);
    }

    return response.json();
}

export default {
    sendMessage,
    sendVoiceMessage,
    startSession,
    endSession,
    interruptAvatar,
    getEngineConfig,
    syncKnowledge,
    setEngineMode,
};
