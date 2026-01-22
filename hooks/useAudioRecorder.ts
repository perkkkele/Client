import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Hook for audio recording in CUSTOM mode
 * 
 * Records audio from the microphone and returns it as base64 for transcription.
 */

interface UseAudioRecorderOptions {
    onRecordingComplete?: (audioBase64: string, durationMs: number) => void;
    onError?: (error: Error) => void;
}

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isProcessing: boolean;
    recordingDuration: number;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<string | null>;
    cancelRecording: () => Promise<void>;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
    const { onRecordingComplete, onError } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const recordingRef = useRef<Audio.Recording | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            console.log('[AudioRecorder] Requesting permissions...');

            // Request permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Microphone permission not granted');
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('[AudioRecorder] Starting recording...');

            // Create and start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            startTimeRef.current = Date.now();
            setIsRecording(true);
            setRecordingDuration(0);

            // Update duration every 100ms
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(Date.now() - startTimeRef.current);
            }, 100);

            console.log('[AudioRecorder] Recording started');
        } catch (error: any) {
            console.error('[AudioRecorder] Error starting recording:', error);
            onError?.(error);
        }
    }, [onError]);

    const stopRecording = useCallback(async (): Promise<string | null> => {
        try {
            if (!recordingRef.current) {
                console.warn('[AudioRecorder] No recording to stop');
                return null;
            }

            setIsProcessing(true);
            console.log('[AudioRecorder] Stopping recording...');

            // Clear duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            const durationMs = Date.now() - startTimeRef.current;

            // Stop recording
            await recordingRef.current.stopAndUnloadAsync();

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            // Get recording URI
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;
            setIsRecording(false);

            if (!uri) {
                throw new Error('No recording URI available');
            }

            console.log('[AudioRecorder] Recording saved to:', uri);

            // Read file as base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            console.log('[AudioRecorder] Recording converted to base64, size:', base64Audio.length);

            // Delete temporary file
            await FileSystem.deleteAsync(uri, { idempotent: true });

            // Notify completion
            onRecordingComplete?.(base64Audio, durationMs);

            setIsProcessing(false);
            return base64Audio;
        } catch (error: any) {
            console.error('[AudioRecorder] Error stopping recording:', error);
            setIsProcessing(false);
            setIsRecording(false);
            onError?.(error);
            return null;
        }
    }, [onRecordingComplete, onError]);

    const cancelRecording = useCallback(async () => {
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();

                // Delete the recorded file
                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }

                recordingRef.current = null;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setIsRecording(false);
            setRecordingDuration(0);
            console.log('[AudioRecorder] Recording cancelled');
        } catch (error: any) {
            console.error('[AudioRecorder] Error cancelling recording:', error);
            setIsRecording(false);
        }
    }, []);

    return {
        isRecording,
        isProcessing,
        recordingDuration,
        startRecording,
        stopRecording,
        cancelRecording,
    };
}

/**
 * Format milliseconds to mm:ss display
 */
export function formatRecordingDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default useAudioRecorder;
