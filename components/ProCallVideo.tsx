// ProCallVideo Component
// Renders video for professional ↔ client video calls using LiveKit
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ProCallVideoProps {
    livekitUrl: string;
    livekitToken: string;
    onConnectionChange?: (connected: boolean) => void;
    onError?: (error: string) => void;
    onParticipantJoin?: (identity: string) => void;
    onParticipantLeave?: (identity: string) => void;
    style?: any;
}

// Try to import LiveKit
let LiveKitModule: any = null;
let isLiveKitAvailable = false;
let initError: string | null = null;

try {
    LiveKitModule = require('@livekit/react-native');

    if (LiveKitModule?.registerGlobals) {
        LiveKitModule.registerGlobals();
    }

    // Configure AudioSession
    if (LiveKitModule?.AudioSession) {
        const { AudioSession } = LiveKitModule;

        AudioSession.configureAudio({
            android: {
                audioMode: 'communication',
                audioFocusMode: 'gain',
                audioAttributesUsage: 'voiceCommunication',
                audioAttributesContentType: 'speech',
                preferredOutputList: ['speaker'],
            },
            ios: {
                defaultOutput: 'speaker',
            },
        }).catch((e: any) => console.log('AudioSession configure error:', e));

        AudioSession.startAudioSession().catch(() => { });
    }

    if (LiveKitModule?.LiveKitRoom && LiveKitModule?.VideoTrack) {
        isLiveKitAvailable = true;
    } else {
        initError = 'LiveKit: Components not available';
    }
} catch (e: any) {
    initError = e.message || 'Failed to load LiveKit';
}

// Fallback when LiveKit not available
function LiveKitFallback({ style, error }: { style?: any; error?: string }) {
    return (
        <View style={[styles.fallbackContainer, style]}>
            <Text style={styles.fallbackTitle}>Videollamada</Text>
            <Text style={styles.fallbackText}>
                {error || 'El video requiere un build de desarrollo.'}
            </Text>
            <Text style={styles.fallbackHint}>
                Ejecuta: npx expo run:android o npx expo run:ios
            </Text>
        </View>
    );
}

// Video renderer for both participants
function VideoRenderer({ style }: { style?: any }) {
    const { useTracks, VideoTrack, isTrackReference } = LiveKitModule;

    const tracks = useTracks ? useTracks() : [];

    // Find video tracks from remote participants
    const remoteVideoTracks = tracks?.filter((t: any) => {
        if (!isTrackReference?.(t)) return false;
        return t.publication?.kind === 'video' && !t.participant?.isLocal;
    }) || [];

    // Find local video track
    const localVideoTrack = tracks?.find((t: any) => {
        if (!isTrackReference?.(t)) return false;
        return t.publication?.kind === 'video' && t.participant?.isLocal;
    });

    if (remoteVideoTracks.length === 0) {
        return (
            <View style={[styles.loadingContainer, style]}>
                <ActivityIndicator size="large" color="#137fec" />
                <Text style={styles.loadingText}>Esperando a la otra persona...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.videoContainer, style]}>
            {/* Remote video (main view) */}
            <VideoTrack
                trackRef={remoteVideoTracks[0]}
                style={styles.remoteVideo}
                objectFit="cover"
            />

            {/* Local video (PiP) */}
            {localVideoTrack && (
                <View style={styles.pipContainer}>
                    <VideoTrack
                        trackRef={localVideoTrack}
                        style={styles.pipVideo}
                        objectFit="cover"
                    />
                </View>
            )}
        </View>
    );
}

// Main LiveKit Room component
function LiveKitVideoPlayer({
    livekitUrl,
    livekitToken,
    onConnectionChange,
    onError,
    onParticipantJoin,
    onParticipantLeave,
    style
}: ProCallVideoProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { LiveKitRoom, useParticipants } = LiveKitModule;

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
            video={true}
            onConnected={() => {
                console.log('[ProCallVideo] Connected to room');
                setIsConnected(true);
                onConnectionChange?.(true);
            }}
            onDisconnected={() => {
                console.log('[ProCallVideo] Disconnected from room');
                setIsConnected(false);
                onConnectionChange?.(false);
            }}
            onError={(e: any) => {
                console.error('[ProCallVideo] Error:', e);
                setError(e?.message || 'Error de conexión');
                onError?.(e?.message);
            }}
            onParticipantConnected={(participant: any) => {
                console.log('[ProCallVideo] Participant joined:', participant?.identity);
                onParticipantJoin?.(participant?.identity);
            }}
            onParticipantDisconnected={(participant: any) => {
                console.log('[ProCallVideo] Participant left:', participant?.identity);
                onParticipantLeave?.(participant?.identity);
            }}
        >
            {!isConnected ? (
                <View style={[styles.loadingContainer, style]}>
                    <ActivityIndicator size="large" color="#137fec" />
                    <Text style={styles.loadingText}>Conectando...</Text>
                </View>
            ) : (
                <VideoRenderer style={style} />
            )}
        </LiveKitRoom>
    );
}

// Main exported component
export default function ProCallVideo(props: ProCallVideoProps) {
    if (!isLiveKitAvailable) {
        return <LiveKitFallback style={props.style} error={initError || undefined} />;
    }

    return <LiveKitVideoPlayer {...props} />;
}

export { isLiveKitAvailable };

const styles = StyleSheet.create({
    fallbackContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: 20,
    },
    fallbackTitle: {
        color: '#137fec',
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    pipContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 100,
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    pipVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
