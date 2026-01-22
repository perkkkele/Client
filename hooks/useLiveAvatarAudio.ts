import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing LiveAvatar audio WebSocket connection in CUSTOM mode
 * 
 * In CUSTOM mode, audio must be sent via a separate WebSocket (ws_url)
 * using the agent.speak event with PCM 16-bit 24kHz audio in Base64
 */

interface UseLiveAvatarAudioOptions {
    wsUrl: string | null;
    enabled?: boolean;
    onError?: (error: Error) => void;
    onSpeakingChange?: (isSpeaking: boolean) => void;
}

interface UseLiveAvatarAudioReturn {
    isConnected: boolean;
    isReady: boolean;
    isSpeaking: boolean;
    sendAudioChunk: (audioBase64: string) => void;
    endSpeaking: () => void;
    interrupt: () => void;
}

export function useLiveAvatarAudio(options: UseLiveAvatarAudioOptions): UseLiveAvatarAudioReturn {
    const { wsUrl, enabled = true, onError, onSpeakingChange } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const eventIdRef = useRef(0);
    const connectedWsUrlRef = useRef<string | null>(null);
    const isConnectingRef = useRef(false);
    const onSpeakingChangeRef = useRef(onSpeakingChange);

    // Keep callback ref updated
    useEffect(() => {
        onSpeakingChangeRef.current = onSpeakingChange;
    }, [onSpeakingChange]);

    // Connect to WebSocket when wsUrl is available (only once per wsUrl)
    useEffect(() => {
        // Skip if disabled or no wsUrl
        if (!enabled || !wsUrl) {
            return;
        }

        // Skip if already connected to this wsUrl or currently connecting
        if (connectedWsUrlRef.current === wsUrl || isConnectingRef.current) {
            return;
        }

        // Close any existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        console.log('[LiveAvatarAudio] Connecting to:', wsUrl);
        isConnectingRef.current = true;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[LiveAvatarAudio] WebSocket connected');
                setIsConnected(true);
                connectedWsUrlRef.current = wsUrl;
                isConnectingRef.current = false;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const eventType = data.type || data.event_type;

                    // Only log important events, not warnings
                    if (eventType !== 'warning') {
                        console.log('[LiveAvatarAudio] Received:', eventType);
                    }

                    // Track avatar speaking state
                    if (eventType === 'agent.speak_started') {
                        console.log('[LiveAvatarAudio] Avatar started speaking');
                        setIsSpeaking(true);
                        onSpeakingChangeRef.current?.(true);
                    } else if (eventType === 'agent.speak_ended' || eventType === 'agent.idle_started') {
                        console.log('[LiveAvatarAudio] Avatar stopped speaking');
                        setIsSpeaking(false);
                        onSpeakingChangeRef.current?.(false);
                    }

                    // Wait for session.state_updated with connected state
                    if (data.type === 'session.state_updated' && data.state === 'connected') {
                        console.log('[LiveAvatarAudio] Session ready for audio');
                        setIsReady(true);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            };

            ws.onerror = (error) => {
                console.error('[LiveAvatarAudio] WebSocket error:', error);
                isConnectingRef.current = false;
                onError?.(new Error('WebSocket connection error'));
            };

            ws.onclose = (event) => {
                console.log('[LiveAvatarAudio] WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setIsReady(false);
                setIsSpeaking(false);
                connectedWsUrlRef.current = null;
                isConnectingRef.current = false;
            };

        } catch (error: any) {
            console.error('[LiveAvatarAudio] Failed to connect:', error);
            isConnectingRef.current = false;
            onError?.(error);
        }

        return () => {
            if (wsRef.current) {
                console.log('[LiveAvatarAudio] Cleaning up WebSocket');
                wsRef.current.close();
                wsRef.current = null;
                connectedWsUrlRef.current = null;
                isConnectingRef.current = false;
            }
        };
        // Only depend on wsUrl and enabled - use stable references
    }, [wsUrl, enabled]);

    /**
     * Send an audio chunk to the avatar for lip-sync
     * Audio should be PCM 16-bit 24kHz in Base64
     */
    const sendAudioChunk = useCallback((audioBase64: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[LiveAvatarAudio] WebSocket not ready, cannot send audio');
            return;
        }

        try {
            const event = {
                type: 'agent.speak',
                audio: audioBase64,
            };
            wsRef.current.send(JSON.stringify(event));
            // Reduce log verbosity
            // console.log('[LiveAvatarAudio] Sent audio chunk via agent.speak, size:', audioBase64.length);
        } catch (error: any) {
            console.error('[LiveAvatarAudio] Error sending audio:', error);
        }
    }, []);

    /**
     * Signal end of speaking
     */
    const endSpeaking = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            eventIdRef.current++;
            const event = {
                type: 'agent.speak_end',
                event_id: `turn-${eventIdRef.current}`,
            };
            wsRef.current.send(JSON.stringify(event));
            console.log('[LiveAvatarAudio] Sent speak_end');
        } catch (error: any) {
            console.error('[LiveAvatarAudio] Error sending speak_end:', error);
        }
    }, []);

    /**
     * Interrupt the avatar's current speech
     * This clears the audio buffer and stops the avatar
     */
    const interrupt = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            // Send interrupt event to stop the avatar
            const event = {
                type: 'agent.interrupt',
            };
            wsRef.current.send(JSON.stringify(event));
            console.log('[LiveAvatarAudio] Sent interrupt');
            setIsSpeaking(false);
            onSpeakingChangeRef.current?.(false);
        } catch (error: any) {
            console.error('[LiveAvatarAudio] Error sending interrupt:', error);
        }
    }, []);

    return {
        isConnected,
        isReady,
        isSpeaking,
        sendAudioChunk,
        endSpeaking,
        interrupt,
    };
}

export default useLiveAvatarAudio;

