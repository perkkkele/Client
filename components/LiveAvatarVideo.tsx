import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LiveAvatarVideoProps {
    livekitUrl: string;
    livekitToken: string;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: string) => void;
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

// Inner component that uses LiveKit hooks (must be inside LiveKitRoom)
function VideoRenderer({ style }: { style?: any }) {
    const { useTracks, VideoTrack, isTrackReference } = LiveKitModule;

    // Get all tracks
    const tracks = useTracks ? useTracks() : [];
    console.log('All tracks:', tracks?.length || 0);

    // Find video track from remote participant (heygen)
    const videoTrack = tracks?.find((t: any) => {
        if (!isTrackReference?.(t)) return false;
        // Look for video from heygen participant
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
        </View>
    );
}

// Main video player using LiveKitRoom component
function LiveKitVideoPlayer({
    livekitUrl,
    livekitToken,
    onConnectionChange,
    onError,
    style
}: LiveAvatarVideoProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { LiveKitRoom, RoomContext } = LiveKitModule;

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
                console.log('LiveKit connected!');
                setIsConnected(true);
                onConnectionChange?.(true);
            }}
            onDisconnected={() => {
                console.log('LiveKit disconnected');
                setIsConnected(false);
                onConnectionChange?.(false);
            }}
            onError={(e: any) => {
                console.error('LiveKit error:', e);
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
                <VideoRenderer style={style} />
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
