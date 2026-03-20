import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, NativeEventEmitter, NativeModules } from 'react-native';
import { Audio } from 'expo-av';
import LiveAudioStream from 'react-native-live-audio-stream';
import { WS_URL } from '../api/config';

/**
 * Hook for real-time streaming voice conversation
 * 
 * Uses react-native-live-audio-stream for true real-time audio streaming.
 * Connects to the server via WebSocket for bidirectional streaming:
 * - Sends audio chunks in real-time as user speaks
 * - Receives partial transcriptions
 * - Receives LLM response streaming
 * - Receives and plays TTS audio
 */

interface UseStreamingVoiceOptions {
    professionalId: string;
    clientId: string;
    chatId: string;
    enabled?: boolean;
    // LiveKit agent mode - when provided, uses server-side audio agent for AEC
    livekitUrl?: string;
    livekitAgentToken?: string;
    onUserMessage?: (message: string) => void;
    onPartialTranscript?: (transcript: string) => void;
    onPartialResponse?: (text: string) => void;
    onResponseComplete?: (response: string) => void;
    onQuickReplies?: (replies: string[]) => void;
    onAppointmentProposal?: (data: { date: string; time: string; type: string; duration?: number | null; professionalId: string; clientId: string; chatId: string }) => void;
    onAudioChunk?: (audioData: { format: string; data: string; sampleRate: number; text: string }) => void;
    onError?: (error: Error) => void;
    onAvatarSpeakingChange?: (speaking: boolean) => void;
    onInterrupted?: () => void;  // Called when server detects barge-in and interrupts response
}

interface UseStreamingVoiceReturn {
    isConnected: boolean;
    isReady: boolean;
    isSpeaking: boolean;        // User is speaking
    isProcessing: boolean;      // AI is generating response
    isPlaying: boolean;         // Audio is playing
    partialTranscript: string;  // What user is saying (live)
    partialResponse: string;    // What AI is saying (live)
    connect: () => Promise<void>;
    disconnect: () => void;
    interrupt: () => void;      // Stop AI response
    setAvatarSpeaking: (speaking: boolean) => void;  // Notify server of avatar speaking state (for barge-in)
    sendTextMessage: (text: string) => void;  // Send text message for LLM+TTS processing (quick replies)
}

// Audio configuration for streaming
const AUDIO_CONFIG = {
    sampleRate: 16000,      // 16kHz - optimal for speech recognition
    channels: 1,            // Mono
    bitsPerSample: 16,      // 16-bit
    audioSource: 6,         // Android: VOICE_RECOGNITION
    bufferSize: 4096,       // Buffer size in bytes
};

export function useStreamingVoice(options: UseStreamingVoiceOptions): UseStreamingVoiceReturn {
    const {
        professionalId,
        clientId,
        chatId,
        enabled = true,
        livekitUrl,
        livekitAgentToken,
        onUserMessage,
        onPartialTranscript,
        onPartialResponse,
        onResponseComplete,
        onQuickReplies,
        onAppointmentProposal,
        onAudioChunk,
        onError,
        onInterrupted,
    } = options;

    // Determine if we're using agent mode (server-side audio with AEC)
    // Agent mode uses LiveKit's native WebRTC AEC - echo cancellation happens automatically
    const useAgentMode = !!(livekitUrl && livekitAgentToken);

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [partialTranscript, setPartialTranscript] = useState('');
    const [partialResponse, setPartialResponse] = useState('');

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const handleServerMessageRef = useRef<(data: any) => void>(() => { });
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isStreamingRef = useRef(false);
    const partialResponseRef = useRef('');

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    // Auto-connect when enabled and we have required data
    useEffect(() => {
        // Don't connect if chatId is empty or missing
        const hasValidChatId = chatId && chatId.length > 0;
        console.log('[StreamingVoice] Auto-connect check:', {
            enabled,
            professionalId: !!professionalId,
            clientId: !!clientId,
            chatId: chatId?.substring(0, 8) || 'none',
            hasValidChatId,
            isConnected,
            wsRef: wsRef.current ? 'exists' : 'null'
        });

        if (enabled && professionalId && clientId && hasValidChatId && !isConnected) {
            console.log('[StreamingVoice] Triggering connect()');
            connect();
        } else if (!enabled && isConnected) {
            console.log('[StreamingVoice] Triggering disconnect() - enabled became false');
            disconnect();
        }
    }, [enabled, professionalId, clientId, chatId]);

    /**
     * Connect to voice streaming WebSocket
     */
    const connect = useCallback(async () => {
        try {
            console.log('[StreamingVoice] Connecting...', useAgentMode ? '(Agent Mode)' : '(Legacy Mode)');

            // Request microphone permission
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Microphone permission not granted');
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            // Build WebSocket URL based on mode
            let wsUrl: string;
            if (useAgentMode) {
                // Agent mode: server receives audio from LiveKit (with native WebRTC AEC)
                const encodedLivekitUrl = encodeURIComponent(livekitUrl!);
                const encodedAgentToken = encodeURIComponent(livekitAgentToken!);
                wsUrl = `${WS_URL}/voice-stream-agent?professionalId=${professionalId}&clientId=${clientId}&chatId=${chatId}&livekitUrl=${encodedLivekitUrl}&livekitAgentToken=${encodedAgentToken}`;
                console.log('[StreamingVoice] Using agent-based endpoint with AEC');
                console.log('[StreamingVoice] LiveKit URL:', livekitUrl?.substring(0, 50) + '...');
            } else {
                // Legacy mode: client sends audio directly (fallback when LiveKit tokens not available)
                wsUrl = `${WS_URL}/voice-stream?professionalId=${professionalId}&clientId=${clientId}&chatId=${chatId}`;
                console.log('[StreamingVoice] Using legacy mode (no AEC)');
            }

            console.log('[StreamingVoice] Connecting to:', wsUrl.substring(0, 100) + '...');

            // Create WebSocket connection
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                console.log('[StreamingVoice] WebSocket connected, readyState:', ws.readyState);
                setIsConnected(true);
            };

            ws.onmessage = async (event) => {
                console.log('[StreamingVoice] Message received, type:', typeof event.data, 'isBuffer:', event.data instanceof ArrayBuffer);
                if (event.data instanceof ArrayBuffer) {
                    // Binary audio data - queue for playback
                    audioQueueRef.current.push(event.data);
                    playQueuedAudio();
                } else {
                    // JSON control message
                    try {
                        const data = JSON.parse(event.data);
                        handleServerMessageRef.current(data);
                    } catch (e) {
                        console.error('[StreamingVoice] Error parsing message:', e);
                    }
                }
            };

            ws.onerror = (error: any) => {
                console.error('[StreamingVoice] WebSocket error, readyState:', ws.readyState);
                console.error('[StreamingVoice] Error details:', JSON.stringify(error, null, 2));
                onError?.(new Error('WebSocket error'));
            };

            ws.onclose = (event: any) => {
                console.log('[StreamingVoice] WebSocket closed, code:', event?.code, 'reason:', event?.reason, 'wasClean:', event?.wasClean);
                setIsConnected(false);
                setIsReady(false);
                if (!useAgentMode) {
                    stopAudioStream();
                }
            };

            wsRef.current = ws;
            console.log('[StreamingVoice] WebSocket created and stored in ref');

        } catch (error: any) {
            console.error('[StreamingVoice] Error connecting:', error);
            onError?.(error);
        }
    }, [professionalId, clientId, chatId, livekitUrl, livekitAgentToken, useAgentMode, onError]);

    /**
     * Handle messages from server
     */
    const handleServerMessage = useCallback((data: any) => {
        // Debug: log all message types
        if (data.type !== 'partial_transcript' && data.type !== 'final_transcript') {
            console.log('[StreamingVoice] Message type:', data.type);
        }

        switch (data.type) {
            case 'connected':
                console.log('[StreamingVoice] Session connected');
                if (useAgentMode) {
                    // In agent mode, server receives audio from LiveKit - we're ready immediately
                    console.log('[StreamingVoice] Agent mode: audio comes from LiveKit, no local streaming needed');
                    setIsReady(true);
                }
                break;

            case 'ready':
                console.log('[StreamingVoice] Deepgram ready');
                setIsReady(true);
                if (!useAgentMode) {
                    // Legacy mode: start local audio streaming
                    console.log('[StreamingVoice] Starting local audio stream');
                    startAudioStream();
                }
                break;

            case 'speech_started':
                setIsSpeaking(true);
                break;

            case 'partial_transcript':
                setPartialTranscript(data.transcript);
                onPartialTranscript?.(data.transcript);
                break;

            case 'final_transcript':
                // Final segment received
                break;

            case 'user_message':
                setIsSpeaking(false);
                setPartialTranscript('');
                setIsProcessing(true);
                partialResponseRef.current = '';
                onUserMessage?.(data.message);
                break;

            case 'partial_response':
                partialResponseRef.current += data.text;
                setPartialResponse(partialResponseRef.current);
                onPartialResponse?.(data.text);
                break;

            case 'response_complete':
                setIsProcessing(false);
                // Strip any [CITA:] markers from accumulated text (system-only, not for display)
                const fullResponse = partialResponseRef.current.replace(/\[CITA:.*?\]/g, '').trim();
                setPartialResponse('');
                partialResponseRef.current = '';
                onResponseComplete?.(fullResponse);
                break;

            case 'response_interrupted':
                console.log('[StreamingVoice] Response interrupted by server (barge-in detected)');
                setIsProcessing(false);
                partialResponseRef.current = '';
                setPartialResponse('');
                stopAudioPlayback();
                // Notify avatar-chat to interrupt LiveAvatar
                onInterrupted?.();
                break;

            case 'audio':
                // TTS audio for LiveAvatar lip-sync
                console.log('[StreamingVoice] Audio chunk received for lip-sync, size:', data.data?.length);
                onAudioChunk?.({
                    format: data.format,
                    data: data.data,
                    sampleRate: data.sampleRate,
                    text: data.text,
                });
                break;

            case 'error':
                console.error('[StreamingVoice] Server error:', data.error);
                onError?.(new Error(data.error));
                break;

            case 'disconnected':
                setIsConnected(false);
                setIsReady(false);
                break;

            case 'quick_replies':
                console.log('[StreamingVoice] Quick replies received:', data.quickReplies, 'source:', data.source);
                if (data.quickReplies && Array.isArray(data.quickReplies)) {
                    onQuickReplies?.(data.quickReplies);
                }
                break;

            case 'appointment_proposal':
                console.log('[StreamingVoice] 📅 Appointment proposal received:', data);
                onAppointmentProposal?.({
                    date: data.date,
                    time: data.time,
                    type: data.appointmentType,
                    duration: data.duration || null,
                    professionalId: data.professionalId,
                    clientId: data.clientId,
                    chatId: data.chatId,
                });
                break;
        }
    }, [onUserMessage, onPartialTranscript, onPartialResponse, onResponseComplete, onQuickReplies, onAppointmentProposal, onAudioChunk, onError, onInterrupted]);

    // Keep the ref always pointing to the latest handler to avoid stale closures
    useEffect(() => {
        handleServerMessageRef.current = handleServerMessage;
    }, [handleServerMessage]);

    /**
     * Start streaming audio from microphone
     */
    const startAudioStream = useCallback(() => {
        if (isStreamingRef.current) return;

        console.log('[StreamingVoice] Starting audio stream...');

        // Initialize LiveAudioStream
        LiveAudioStream.init({
            sampleRate: AUDIO_CONFIG.sampleRate,
            channels: AUDIO_CONFIG.channels,
            bitsPerSample: AUDIO_CONFIG.bitsPerSample,
            audioSource: AUDIO_CONFIG.audioSource,
            bufferSize: AUDIO_CONFIG.bufferSize,
            wavFile: '', // Not saving to file, streaming only
        });

        // Listen for audio data
        LiveAudioStream.on('data', (base64Data: string) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                // Convert base64 to ArrayBuffer and send
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                wsRef.current.send(bytes.buffer);
            }
        });

        // Start streaming
        LiveAudioStream.start();
        isStreamingRef.current = true;

        console.log('[StreamingVoice] Audio stream started');
    }, []);

    /**
     * Stop audio stream
     */
    const stopAudioStream = useCallback(() => {
        if (!isStreamingRef.current) return;

        console.log('[StreamingVoice] Stopping audio stream...');

        LiveAudioStream.stop();
        isStreamingRef.current = false;
    }, []);

    /**
     * Play queued audio from TTS
     */
    const playQueuedAudio = useCallback(async () => {
        if (isPlaying || audioQueueRef.current.length === 0) return;

        setIsPlaying(true);

        try {
            // For now, we'll just log the audio chunks
            // Full implementation would use expo-av or a native audio player
            while (audioQueueRef.current.length > 0) {
                const audioData = audioQueueRef.current.shift();
                if (!audioData) continue;

                console.log('[StreamingVoice] Would play audio chunk:', audioData.byteLength, 'bytes');

                // TODO: Implement actual audio playback
                // This would require converting PCM to a playable format
                // or using a native module that can play raw PCM
            }
        } catch (error) {
            console.error('[StreamingVoice] Error playing audio:', error);
        } finally {
            setIsPlaying(false);
        }
    }, [isPlaying]);

    /**
     * Stop audio playback
     */
    const stopAudioPlayback = useCallback(async () => {
        audioQueueRef.current = [];
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (e) {
                // Ignore
            }
            soundRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    /**
     * Disconnect from voice streaming
     */
    const disconnect = useCallback(() => {
        console.log('[StreamingVoice] Disconnecting...');

        stopAudioStream();
        stopAudioPlayback();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsReady(false);
        setIsSpeaking(false);
        setIsProcessing(false);
        setPartialTranscript('');
        setPartialResponse('');
        partialResponseRef.current = '';
    }, [stopAudioStream, stopAudioPlayback]);

    /**
     * Interrupt AI response (user wants to speak)
     */
    const interrupt = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
        }
        stopAudioPlayback();
    }, [stopAudioPlayback]);

    // Note: pauseListening/resumeListening removed - we rely on AEC for echo cancellation

    /**
     * Notify server that avatar is speaking (for barge-in detection in agent mode)
     */
    const setAvatarSpeaking = useCallback((speaking: boolean) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'avatar_speaking', speaking }));
        }
    }, []);

    /**
     * Send a text message to be processed by LLM and TTS
     * Used for quick replies and text input in voice mode
     */
    const sendTextMessage = useCallback((text: string) => {
        if (!text.trim()) return;

        console.log('[StreamingVoice] Sending text message:', text);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'text_message',
                message: text.trim()
            }));
            // Trigger processing state immediately for UI feedback
            setIsProcessing(true);
        } else {
            console.warn('[StreamingVoice] Cannot send text - WebSocket not connected');
        }
    }, []);

    return {
        isConnected,
        isReady,
        isSpeaking,
        isProcessing,
        isPlaying,
        partialTranscript,
        partialResponse,
        connect,
        disconnect,
        interrupt,
        setAvatarSpeaking,
        sendTextMessage,
    };
}

export default useStreamingVoice;
