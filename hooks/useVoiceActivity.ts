import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Hook for continuous voice recording with Voice Activity Detection (VAD)
 * 
 * Automatically detects when the user starts and stops speaking,
 * similar to ChatGPT Voice or Gemini Live.
 * 
 * Uses expo-av for audio recording and amplitude-based VAD.
 */

interface UseVoiceActivityOptions {
    /** Callback when speech segment is complete (user stopped talking) */
    onSpeechComplete?: (audioBase64: string, durationMs: number) => void;
    /** Callback when user starts speaking */
    onSpeechStart?: () => void;
    /** Callback when speech is being detected (continuous) */
    onSpeechActive?: () => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Whether VAD is enabled (controls auto-start) */
    enabled?: boolean;
    /** Silence duration in ms before considering speech ended (default: 1500ms) */
    silenceThreshold?: number;
    /** Minimum speech duration in ms to be considered valid (default: 500ms) */
    minSpeechDuration?: number;
}

interface UseVoiceActivityReturn {
    /** Whether the system is actively listening */
    isListening: boolean;
    /** Whether speech is currently being detected */
    isSpeaking: boolean;
    /** Whether audio is being processed after speech */
    isProcessing: boolean;
    /** Duration of current speech segment */
    speechDuration: number;
    /** Start listening for voice */
    startListening: () => Promise<void>;
    /** Stop listening */
    stopListening: () => Promise<void>;
    /** Temporarily pause listening (e.g. while playing response) */
    pauseListening: () => void;
    /** Resume listening after pause */
    resumeListening: () => void;
}

// Recording configuration optimized for voice
const RECORDING_OPTIONS: Audio.RecordingOptions = {
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 64000,
    },
    ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.MEDIUM,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 64000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 64000,
    },
};

// VAD configuration
const VAD_CONFIG = {
    /** Amplitude threshold to consider as speech (0-160 for expo-av) */
    speechThreshold: -30, // dB, values closer to 0 are louder
    /** How often to check audio levels (ms) */
    checkInterval: 100,
    /** Default silence threshold */
    defaultSilenceThreshold: 1500,
    /** Default minimum speech duration */
    defaultMinSpeechDuration: 500,
};

export function useVoiceActivity(options: UseVoiceActivityOptions = {}): UseVoiceActivityReturn {
    const {
        onSpeechComplete,
        onSpeechStart,
        onSpeechActive,
        onError,
        enabled = true,
        silenceThreshold = VAD_CONFIG.defaultSilenceThreshold,
        minSpeechDuration = VAD_CONFIG.defaultMinSpeechDuration,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [speechDuration, setSpeechDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const recordingRef = useRef<Audio.Recording | null>(null);
    const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speechStartTimeRef = useRef<number>(0);
    const lastSpeechTimeRef = useRef<number>(0);
    const hasSpokenRef = useRef<boolean>(false);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, []);

    // Auto-start when enabled
    useEffect(() => {
        if (enabled && !isListening && !isPaused) {
            startListening();
        } else if (!enabled && isListening) {
            stopListening();
        }
    }, [enabled]);

    /**
     * Process audio when speech segment is complete
     */
    const processRecordedAudio = useCallback(async () => {
        if (!recordingRef.current) return;

        const speechDurationMs = Date.now() - speechStartTimeRef.current;

        // Check minimum duration
        if (speechDurationMs < minSpeechDuration) {
            console.log('[VAD] Speech too short, ignoring:', speechDurationMs, 'ms');
            // Restart recording for next segment
            await restartRecording();
            return;
        }

        setIsProcessing(true);
        console.log('[VAD] Processing speech segment:', speechDurationMs, 'ms');

        try {
            // Stop current recording
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;

            if (!uri) {
                throw new Error('No recording URI available');
            }

            // Read as base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Clean up file
            await FileSystem.deleteAsync(uri, { idempotent: true });

            console.log('[VAD] Audio converted, size:', base64Audio.length);

            // Callback with audio
            onSpeechComplete?.(base64Audio, speechDurationMs);

        } catch (error: any) {
            console.error('[VAD] Error processing audio:', error);
            onError?.(error);
        } finally {
            setIsProcessing(false);
            setIsSpeaking(false);
            hasSpokenRef.current = false;
            setSpeechDuration(0);

            // Restart listening for next utterance
            if (isListening && !isPaused) {
                await startRecording();
            }
        }
    }, [minSpeechDuration, onSpeechComplete, onError, isListening, isPaused]);

    /**
     * Restart recording without processing (for short/invalid segments)
     */
    const restartRecording = useCallback(async () => {
        try {
            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }
                recordingRef.current = null;
            }

            setIsSpeaking(false);
            hasSpokenRef.current = false;
            setSpeechDuration(0);

            // Start fresh recording
            if (isListening && !isPaused) {
                await startRecording();
            }
        } catch (error) {
            console.error('[VAD] Error restarting recording:', error);
        }
    }, [isListening, isPaused]);

    /**
     * Start audio recording
     */
    const startRecording = useCallback(async () => {
        try {
            console.log('[VAD] Starting recording...');

            // Configure audio
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create new recording
            const { recording } = await Audio.Recording.createAsync(
                RECORDING_OPTIONS,
                (status) => {
                    // This callback is called with metering info if enabled
                    if (status.isRecording && status.metering !== undefined) {
                        handleMeteringUpdate(status.metering);
                    }
                },
                100 // Update interval in ms
            );

            recordingRef.current = recording;
            speechStartTimeRef.current = 0;
            lastSpeechTimeRef.current = 0;
            hasSpokenRef.current = false;

            console.log('[VAD] Recording started, listening for speech...');

        } catch (error: any) {
            console.error('[VAD] Error starting recording:', error);
            onError?.(error);
        }
    }, [onError]);

    /**
     * Handle audio level updates for VAD
     */
    const handleMeteringUpdate = useCallback((metering: number) => {
        // metering is in dB, typically -160 to 0
        // Values closer to 0 are louder
        const now = Date.now();
        const isSpeech = metering > VAD_CONFIG.speechThreshold;

        if (isSpeech) {
            // Speech detected
            lastSpeechTimeRef.current = now;

            if (!hasSpokenRef.current) {
                // Speech just started
                hasSpokenRef.current = true;
                speechStartTimeRef.current = now;
                setIsSpeaking(true);
                onSpeechStart?.();
                console.log('[VAD] Speech started, level:', metering.toFixed(1), 'dB');
            } else {
                // Speech continuing
                setSpeechDuration(now - speechStartTimeRef.current);
                onSpeechActive?.();
            }

            // Clear any pending silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        } else if (hasSpokenRef.current) {
            // Silence after speech - start timer to detect end of utterance
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    console.log('[VAD] Silence threshold reached, processing speech...');
                    silenceTimerRef.current = null;
                    processRecordedAudio();
                }, silenceThreshold);
            }
        }
    }, [silenceThreshold, onSpeechStart, onSpeechActive, processRecordedAudio]);

    /**
     * Start listening for voice
     */
    const startListening = useCallback(async () => {
        try {
            console.log('[VAD] Requesting microphone permission...');

            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Microphone permission not granted');
            }

            setIsListening(true);
            setIsPaused(false);
            await startRecording();

        } catch (error: any) {
            console.error('[VAD] Error starting listening:', error);
            onError?.(error);
        }
    }, [startRecording, onError]);

    /**
     * Stop listening completely
     */
    const stopListening = useCallback(async () => {
        console.log('[VAD] Stopping listening...');

        // Clear timers
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        // Stop recording
        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
            recordingRef.current = null;
        }

        // Reset audio mode
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
        } catch (e) {
            // Ignore
        }

        setIsListening(false);
        setIsSpeaking(false);
        setIsProcessing(false);
        setSpeechDuration(0);
        hasSpokenRef.current = false;
    }, []);

    /**
     * Pause listening temporarily (e.g. while playing audio response)
     */
    const pauseListening = useCallback(() => {
        console.log('[VAD] Pausing listening...');
        setIsPaused(true);

        // Don't process current audio, just stop
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (recordingRef.current) {
            recordingRef.current.stopAndUnloadAsync().catch(() => { });
            recordingRef.current = null;
        }

        setIsSpeaking(false);
        hasSpokenRef.current = false;
    }, []);

    /**
     * Resume listening after pause
     */
    const resumeListening = useCallback(async () => {
        console.log('[VAD] Resuming listening...');
        setIsPaused(false);

        if (isListening) {
            await startRecording();
        }
    }, [isListening, startRecording]);

    return {
        isListening,
        isSpeaking,
        isProcessing,
        speechDuration,
        startListening,
        stopListening,
        pauseListening,
        resumeListening,
    };
}

/**
 * Format milliseconds to mm:ss display
 */
export function formatSpeechDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default useVoiceActivity;
