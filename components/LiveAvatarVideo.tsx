import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Dynamic import for LiveKit (may not work in Expo Go)
let Room: any = null;
let RoomContext: any = null;
let VideoTrack: any = null;
let useRemoteParticipants: any = null;
let useParticipantTracks: any = null;
let Track: any = null;
let isLiveKitAvailable = false;

try {
    const livekit = require('@livekit/react-native');
    Room = livekit.Room;
    RoomContext = livekit.RoomContext;
    VideoTrack = livekit.VideoTrack;
    useRemoteParticipants = livekit.useRemoteParticipants;
    useParticipantTracks = livekit.useParticipantTracks;
    Track = livekit.Track;
    isLiveKitAvailable = true;
    console.log('LiveKit loaded successfully');
} catch (e) {
    console.log('LiveKit not available (requires development build)');
}

interface LiveAvatarVideoProps {
    livekitUrl: string;
    livekitToken: string;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: string) => void;
    style?: any;
}

// Fallback component when LiveKit is not available
function LiveKitFallback({ style }: { style?: any }) {
    return (
        <View style={[styles.fallbackContainer, style]}>
            <Text style={styles.fallbackTitle}>Video en Vivo</Text>
            <Text style={styles.fallbackText}>
                El video requiere un build de desarrollo.
            </Text>
            <Text style={styles.fallbackHint}>
                La sesión está activa - usa el chat de texto.
            </Text>
        </View>
    );
}

// Actual video component using LiveKit
function LiveKitVideoPlayer({
    livekitUrl,
    livekitToken,
    onConnectionChange,
    onError,
    style
}: LiveAvatarVideoProps) {
    const [room] = useState(() => new Room());
    const [isConnecting, setIsConnecting] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function connect() {
            try {
                console.log('Connecting to LiveKit room:', livekitUrl);
                setIsConnecting(true);
                setError(null);

                await room.connect(livekitUrl, livekitToken);

                if (mounted) {
                    console.log('Connected to LiveKit room');
                    setIsConnected(true);
                    setIsConnecting(false);
                    onConnectionChange?.(true);
                }
            } catch (e: any) {
                console.error('LiveKit connection error:', e);
                if (mounted) {
                    setError(e.message || 'Error de conexión');
                    setIsConnecting(false);
                    onError?.(e.message || 'Error de conexión');
                }
            }
        }

        connect();

        return () => {
            mounted = false;
            room.disconnect();
            onConnectionChange?.(false);
        };
    }, [livekitUrl, livekitToken, room, onConnectionChange, onError]);

    if (isConnecting) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="large" color="#f9f506" />
                <Text style={styles.loadingText}>Conectando video...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.errorContainer, style]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!isConnected) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <Text style={styles.loadingText}>Esperando conexión...</Text>
            </View>
        );
    }

    // Render the video track
    return (
        <RoomContext.Provider value={room}>
            <RemoteVideoRenderer style={style} />
        </RoomContext.Provider>
    );
}

// Component to render remote participant video
function RemoteVideoRenderer({ style }: { style?: any }) {
    const participants = useRemoteParticipants();

    if (participants.length === 0) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="small" color="#f9f506" />
                <Text style={styles.loadingText}>Esperando avatar...</Text>
            </View>
        );
    }

    const participant = participants[0];
    const tracks = useParticipantTracks(
        [Track.Source.Camera, Track.Source.ScreenShare],
        participant.identity
    );

    const videoTrack = tracks.find(
        (t: any) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
    );

    if (!videoTrack) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
        );
    }

    return (
        <VideoTrack
            trackRef={videoTrack}
            style={[styles.videoTrack, style]}
        />
    );
}

// Main exported component
export default function LiveAvatarVideo(props: LiveAvatarVideoProps) {
    if (!isLiveKitAvailable) {
        return <LiveKitFallback style={props.style} />;
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
    videoTrack: {
        flex: 1,
        borderRadius: 16,
    },
});
