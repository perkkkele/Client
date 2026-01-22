import { useState, useCallback, useEffect, useRef } from 'react';
import * as customTwinApi from '../api/customTwin';

/**
 * Hook para el motor custom del gemelo digital
 * 
 * Gestiona la comunicación con el motor custom, incluyendo:
 * - Envío de mensajes y recepción de respuestas
 * - Quick replies dinámicas
 * - Estado del avatar (hablando, escuchando)
 * - Detección de escalación
 */

export interface CustomTwinMessage {
    id: string;
    content: string;
    spokenContent?: string;
    sender: 'user' | 'twin';
    timestamp: Date;
}

export interface CustomTwinState {
    isLoading: boolean;
    isSpeaking: boolean;
    quickReplies: string[];
    error: string | null;
    shouldEscalate: boolean;
    escalationReason: string | null;
}

export interface UseCustomTwinEngineOptions {
    professionalId: string;
    chatId: string;
    clientId: string;
    enabled?: boolean;
    onMessageReceived?: (message: CustomTwinMessage) => void;
    onQuickRepliesUpdated?: (replies: string[]) => void;
    onEscalationNeeded?: (reason: string | null) => void;
    onError?: (error: Error) => void;
}

export function useCustomTwinEngine(options: UseCustomTwinEngineOptions) {
    const {
        professionalId,
        chatId,
        clientId,
        enabled = true,
        onMessageReceived,
        onQuickRepliesUpdated,
        onEscalationNeeded,
        onError,
    } = options;

    const [state, setState] = useState<CustomTwinState>({
        isLoading: false,
        isSpeaking: false,
        quickReplies: [],
        error: null,
        shouldEscalate: false,
        escalationReason: null,
    });

    const messageIdCounter = useRef(0);

    /**
     * Genera un ID único para un mensaje
     */
    const generateMessageId = useCallback(() => {
        messageIdCounter.current += 1;
        return `msg_${Date.now()}_${messageIdCounter.current}`;
    }, []);

    /**
     * Envía un mensaje al gemelo digital
     */
    const sendMessage = useCallback(async (message: string): Promise<CustomTwinMessage | null> => {
        if (!enabled || !message.trim()) {
            return null;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const response = await customTwinApi.sendMessage(
                professionalId,
                chatId,
                clientId,
                message
            );

            // Crear mensaje de respuesta
            const twinMessage: CustomTwinMessage = {
                id: generateMessageId(),
                content: response.written,
                spokenContent: response.spoken,
                sender: 'twin',
                timestamp: new Date(),
            };

            // Actualizar estado
            setState(prev => ({
                ...prev,
                isLoading: false,
                isSpeaking: true, // El avatar está hablando
                quickReplies: response.quick_replies || [],
                shouldEscalate: response.should_escalate,
                escalationReason: response.escalation_reason,
            }));

            // Callbacks
            if (onMessageReceived) {
                onMessageReceived(twinMessage);
            }

            if (onQuickRepliesUpdated && response.quick_replies) {
                onQuickRepliesUpdated(response.quick_replies);
            }

            if (response.should_escalate && onEscalationNeeded) {
                onEscalationNeeded(response.escalation_reason);
            }

            return twinMessage;
        } catch (error) {
            const err = error as Error;
            console.error('[useCustomTwinEngine] Error sending message:', err);

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err.message,
            }));

            if (onError) {
                onError(err);
            }

            return null;
        }
    }, [enabled, professionalId, chatId, clientId, generateMessageId, onMessageReceived, onQuickRepliesUpdated, onEscalationNeeded, onError]);

    /**
     * Envía un mensaje de voz al gemelo digital
     * @param audioBase64 - Audio grabado en base64
     * @param format - Formato del audio (webm, mp3, wav, etc.)
     * @returns Objeto con mensaje del usuario (transcripción) y respuesta del twin
     */
    const sendVoiceMessage = useCallback(async (
        audioBase64: string,
        format: string = 'm4a'
    ): Promise<{
        userMessage: CustomTwinMessage | null;
        twinMessage: CustomTwinMessage | null;
        transcription: string;
    } | null> => {
        if (!enabled || !audioBase64) {
            return null;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            console.log('[useCustomTwinEngine] Sending voice message...');

            const response = await customTwinApi.sendVoiceMessage(
                professionalId,
                chatId,
                clientId,
                audioBase64,
                format
            );

            // Si no se detectó habla
            if (!response.transcription) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                }));
                return {
                    userMessage: null,
                    twinMessage: null,
                    transcription: '',
                };
            }

            // Crear mensaje del usuario (transcripción)
            const userMessage: CustomTwinMessage = {
                id: generateMessageId(),
                content: response.transcription,
                sender: 'user',
                timestamp: new Date(),
            };

            // Crear mensaje de respuesta del twin
            const twinMessage: CustomTwinMessage = {
                id: generateMessageId(),
                content: response.written,
                spokenContent: response.spoken,
                sender: 'twin',
                timestamp: new Date(),
            };

            // Actualizar estado
            setState(prev => ({
                ...prev,
                isLoading: false,
                isSpeaking: true,
                quickReplies: response.quick_replies || [],
                shouldEscalate: response.should_escalate,
            }));

            // Callbacks
            if (onQuickRepliesUpdated && response.quick_replies) {
                onQuickRepliesUpdated(response.quick_replies);
            }

            if (response.should_escalate && onEscalationNeeded) {
                onEscalationNeeded(null);
            }

            console.log('[useCustomTwinEngine] Voice message processed:', response.transcription);

            return {
                userMessage,
                twinMessage,
                transcription: response.transcription,
            };
        } catch (error) {
            const err = error as Error;
            console.error('[useCustomTwinEngine] Error sending voice message:', err);

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err.message,
            }));

            if (onError) {
                onError(err);
            }

            return null;
        }
    }, [enabled, professionalId, chatId, clientId, generateMessageId, onQuickRepliesUpdated, onEscalationNeeded, onError]);

    /**
     * Indica que el avatar terminó de hablar
     */
    const onSpeakEnded = useCallback(() => {
        setState(prev => ({
            ...prev,
            isSpeaking: false,
        }));
    }, []);

    /**
     * Interrumpe al avatar
     */
    const interrupt = useCallback(async () => {
        try {
            await customTwinApi.interruptAvatar(professionalId, chatId);
            setState(prev => ({
                ...prev,
                isSpeaking: false,
            }));
        } catch (error) {
            console.error('[useCustomTwinEngine] Error interrupting:', error);
        }
    }, [professionalId, chatId]);

    /**
     * Selecciona una quick reply
     */
    const selectQuickReply = useCallback((reply: string) => {
        return sendMessage(reply);
    }, [sendMessage]);

    /**
     * Limpia las quick replies
     */
    const clearQuickReplies = useCallback(() => {
        setState(prev => ({
            ...prev,
            quickReplies: [],
        }));
    }, []);

    /**
     * Resetea el estado de error
     */
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
        }));
    }, []);

    return {
        // Estado
        isLoading: state.isLoading,
        isSpeaking: state.isSpeaking,
        quickReplies: state.quickReplies,
        error: state.error,
        shouldEscalate: state.shouldEscalate,
        escalationReason: state.escalationReason,

        // Acciones
        sendMessage,
        sendVoiceMessage,
        selectQuickReply,
        interrupt,
        onSpeakEnded,
        clearQuickReplies,
        clearError,
    };
}

/**
 * Hook para verificar el modo del motor
 */
export function useEngineMode(professionalId: string) {
    const [engineMode, setEngineMode] = useState<'FULL' | 'CUSTOM' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchConfig() {
            try {
                const config = await customTwinApi.getEngineConfig(professionalId);
                setEngineMode(config.engineMode);
            } catch (error) {
                console.error('[useEngineMode] Error fetching config:', error);
                setEngineMode('FULL'); // Default a FULL si hay error
            } finally {
                setIsLoading(false);
            }
        }

        if (professionalId) {
            fetchConfig();
        }
    }, [professionalId]);

    return { engineMode, isLoading };
}

export default useCustomTwinEngine;
