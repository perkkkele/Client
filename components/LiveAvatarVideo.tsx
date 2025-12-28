import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface TranscriptionSegment {
    id: string;
    text: string;
    final: boolean;
}

interface LiveAvatarVideoProps {
    livekitUrl: string;
    livekitToken: string;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: string) => void;
    onTranscription?: (text: string, isFinal: boolean) => void;
    style?: any;
}

// Try to import LiveKit
let LiveKitModule: any = null;
let isLiveKitAvailable = false;
let initError: string | null = null;

try {
    LiveKitModule = require('@livekit/react-native');

    // LiveKit React Native needs registerGlobals to be called first
    if (LiveKitModule?.registerGlobals) {
        LiveKitModule.registerGlobals();
    }

    // Configure AudioSession for better volume on Android
    if (LiveKitModule?.AudioSession) {
        const { AudioSession } = LiveKitModule;

        // Start audio session with speaker output
        AudioSession.getAudioOutputs().then((outputs: any[]) => {
            console.log('Available audio outputs:', outputs);
        }).catch(() => { });

        // Configure for media playback with speaker
        AudioSession.configureAudio({
            android: {
                audioMode: 'normal',
                audioFocusMode: 'gain',
                audioAttributesUsage: 'media',
                audioAttributesContentType: 'speech',
            },
        }).catch(() => { });

        AudioSession.startAudioSession().catch(() => { });
    }

    // Check for required exports
    if (LiveKitModule?.LiveKitRoom && LiveKitModule?.VideoTrack) {
        isLiveKitAvailable = true;
    } else {
        initError = 'LiveKit: LiveKitRoom or VideoTrack not available';
    }
} catch (e: any) {
    initError = e.message || 'Failed to load LiveKit';
}

// Fallback component when LiveKit is not available
function LiveKitFallback({ style, error }: { style?: any; error?: string }) {
    return (
        <View style={[styles.fallbackContainer, style]}>
            <Text style={styles.fallbackTitle}>Sesión Activa</Text>
            <Text style={styles.fallbackText}>
                {error || 'El video requiere un build de desarrollo.'}
            </Text>
            <Text style={styles.fallbackHint}>
                La sesión está activa - usa el chat de texto.
            </Text>
        </View>
    );
}

// Component to capture transcriptions via LiveKit data channel
// LiveAvatar sends events to 'agent-response' topic with avatar.transcription_ended
function TranscriptionCapture({
    onTranscription
}: {
    onTranscription?: (text: string, isFinal: boolean) => void
}) {
    const { useDataChannel } = LiveKitModule;
    const lastTranscriptRef = useRef<string>('');

    // Subscribe to agent-response topic for avatar transcriptions
    const dataChannel = useDataChannel ? useDataChannel('agent-response') : null;


    useEffect(() => {
        if (!dataChannel) return;

        // The message might be in different properties
        const rawMessage = dataChannel.message || dataChannel.payload;
        if (!rawMessage) return;

        try {
            // Try to get string from various formats
            let messageStr = '';
            if (typeof rawMessage === 'string') {
                messageStr = rawMessage;
            } else if (rawMessage instanceof ArrayBuffer) {
                messageStr = new TextDecoder().decode(rawMessage);
            } else if (rawMessage instanceof Uint8Array) {
                messageStr = new TextDecoder().decode(rawMessage);
            } else if (rawMessage.payload) {
                messageStr = typeof rawMessage.payload === 'string'
                    ? rawMessage.payload
                    : new TextDecoder().decode(rawMessage.payload);
            }

            if (!messageStr || messageStr.length === 0) return;

            const event = JSON.parse(messageStr);

            // Handle avatar transcription event (this is the actual event name from HeyGen)
            if (event.event_type === 'avatar.transcription' && event.text) {
                const text = event.text.trim();
                if (text && text !== lastTranscriptRef.current) {
                    lastTranscriptRef.current = text;
                    console.log('Avatar says:', text);
                    onTranscription?.(text, true);
                }
            }

            // Also capture user transcription for logging
            if (event.event_type === 'user.transcription' && event.text) {
                console.log('User said:', event.text);
            }
        } catch (e: any) {
            // Silently ignore parse errors
        }
    }, [dataChannel?.message, dataChannel?.payload, onTranscription]);

    return null;
}

// Inner component that uses LiveKit hooks (must be inside LiveKitRoom)
function VideoRenderer({
    style,
    onTranscription
}: {
    style?: any;
    onTranscription?: (text: string, isFinal: boolean) => void;
}) {
    const { useTracks, VideoTrack, isTrackReference } = LiveKitModule;

    // Get all tracks
    const tracks = useTracks ? useTracks() : [];

    // Find video track from remote participant (heygen)
    const videoTrack = tracks?.find((t: any) => {
        if (!isTrackReference?.(t)) return false;
        return t.publication?.kind === 'video' && t.participant?.identity === 'heygen';
    });

    if (!videoTrack) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="small" color="#f9f506" />
                <Text style={styles.loadingText}>Esperando avatar...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.videoContainer, style]}>
            <VideoTrack
                trackRef={videoTrack}
                style={styles.videoTrack}
                objectFit="cover"
            />
            <TranscriptionCapture onTranscription={onTranscription} />
        </View>
    );
}

// Main video player using LiveKitRoom component
function LiveKitVideoPlayer({
    livekitUrl,
    livekitToken,
    onConnectionChange,
    onError,
    onTranscription,
    style
}: LiveAvatarVideoProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { LiveKitRoom } = LiveKitModule;

    if (error) {
        return (
            <View style={[styles.errorContainer, style]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={livekitUrl}
            token={livekitToken}
            connect={true}
            audio={true}
            video={false}
            onConnected={() => {
                setIsConnected(true);
                onConnectionChange?.(true);
            }}
            onDisconnected={() => {
                setIsConnected(false);
                onConnectionChange?.(false);
            }}
            onError={(e: any) => {
                setError(e?.message || 'Error de conexión');
                onError?.(e?.message);
            }}
        >
            {!isConnected ? (
                <View style={[styles.loadingContainer, style]}>
                    <ActivityIndicator size="large" color="#f9f506" />
                    <Text style={styles.loadingText}>Conectando video...</Text>
                </View>
            ) : (
                <VideoRenderer style={style} onTranscription={onTranscription} />
            )}
        </LiveKitRoom>
    );
}

// Main exported component
export default function LiveAvatarVideo(props: LiveAvatarVideoProps) {
    if (!isLiveKitAvailable) {
        return <LiveKitFallback style={props.style} error={initError || undefined} />;
    }

    return <LiveKitVideoPlayer {...props} />;
}

// Export availability check
export { isLiveKitAvailable };

const styles = StyleSheet.create({
    fallbackContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: 20,
    },
    fallbackTitle: {
        color: '#f9f506',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    fallbackText: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    fallbackHint: {
        color: '#9CA3AF',
        fontSize: 12,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000000',
        borderRadius: 16,
        overflow: 'hidden',
    },
    videoTrack: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
