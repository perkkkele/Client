/**
 * HumanVideoCall Component
 * Renders live video call between client and professional within the chat interface
 * Features: Remote video, local PiP, call controls, "EN VIVO" badge
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Alert,
    Animated,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Camera } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import {
    Room,
    RoomEvent,
    Track,
    VideoTrack,
    RemoteParticipant,
    LocalParticipant,
    createLocalVideoTrack,
} from "livekit-client";
import { VideoView } from "@livekit/react-native";

const COLORS = {
    primary: "#f9f506",
    backgroundDark: "#1a1a1a",
    green400: "#4ADE80",
    green500: "#22C55E",
    red400: "#F87171",
    red500: "#EF4444",
    gold400: "#FBBF24",
    gold500: "#F59E0B",
    textMain: "#FFFFFF",
    textMuted: "#9CA3AF",
    overlay: "rgba(0,0,0,0.4)",
};

interface HumanVideoCallProps {
    livekitUrl: string;
    token: string;
    onDisconnect: () => void;
    onConnectionChange?: (connected: boolean) => void;
    style?: object;
}

export default function HumanVideoCall({
    livekitUrl,
    token,
    onDisconnect,
    onConnectionChange,
    style,
}: HumanVideoCallProps) {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true); // Front camera by default
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

    // Force re-render counter - incremented when tracks change
    const [trackUpdateCounter, setTrackUpdateCounter] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for "EN VIVO" badge
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Debug: Log when remoteVideoTrack state changes
    useEffect(() => {
        console.log('[HumanVideoCall] Remote video track state changed:',
            remoteVideoTrack ? `Track present (sid: ${remoteVideoTrack.sid})` : 'null'
        );
    }, [remoteVideoTrack]);

    // Debug: Log when localVideoTrack state changes with details
    useEffect(() => {
        if (localVideoTrack) {
            console.log('[HumanVideoCall] Local video track state changed:', {
                sid: localVideoTrack.sid,
                hasMediaStreamTrack: !!localVideoTrack.mediaStreamTrack,
                trackId: localVideoTrack.mediaStreamTrack?.id,
                trackEnabled: localVideoTrack.mediaStreamTrack?.enabled,
                trackReadyState: localVideoTrack.mediaStreamTrack?.readyState,
            });
        } else {
            console.log('[HumanVideoCall] Local video track state changed: null');
        }
    }, [localVideoTrack]);
    // Connect to room
    useEffect(() => {
        if (!livekitUrl || !token) return;

        const newRoom = new Room();

        const handleConnected = () => {
            console.log("[HumanVideoCall] Connected to room");
            setIsConnected(true);
            onConnectionChange?.(true);

            // Start call duration timer
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        };

        const handleDisconnected = () => {
            console.log("[HumanVideoCall] Disconnected from room");
            setIsConnected(false);
            onConnectionChange?.(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };

        const handleTrackSubscribed = (
            track: Track,
            _publication: any,
            participant: RemoteParticipant
        ) => {
            const localId = newRoom.localParticipant?.identity || 'unknown';
            console.log(`[HumanVideoCall][${localId}] Remote track subscribed: ${track.kind} from ${participant.identity}`);
            if (track.kind === Track.Kind.Video) {
                const videoTrack = track as VideoTrack;
                console.log(`[HumanVideoCall][${localId}] Remote video track details:`, {
                    sid: videoTrack.sid,
                    isMuted: videoTrack.isMuted,
                    mediaStreamTrack: videoTrack.mediaStreamTrack ? 'present' : 'missing'
                });
                // Force re-render by updating counter immediately after setting track
                setRemoteVideoTrack(videoTrack);
                // Use setTimeout to ensure the state update triggers a new render cycle
                setTimeout(() => {
                    setTrackUpdateCounter(prev => prev + 1);
                    console.log(`[HumanVideoCall][${localId}] Force re-render triggered for remote video`);
                }, 100);
            }
        };

        const handleTrackUnsubscribed = (track: Track) => {
            const localId = newRoom.localParticipant?.identity || 'unknown';
            console.log(`[HumanVideoCall][${localId}] Remote track unsubscribed: ${track.kind}`);
            if (track.kind === Track.Kind.Video) {
                setRemoteVideoTrack(null);
            }
        };

        const handleLocalTrackPublished = (publication: any, participant: LocalParticipant) => {
            const localId = newRoom.localParticipant?.identity || 'unknown';
            console.log(`[HumanVideoCall][${localId}] Local track published: ${publication.track?.kind}`);
            if (publication.track?.kind === Track.Kind.Video) {
                setLocalVideoTrack(publication.track as VideoTrack);
                // Force re-render to ensure PiP updates correctly
                setTimeout(() => {
                    setTrackUpdateCounter(prev => prev + 1);
                    console.log(`[HumanVideoCall][${localId}] Force re-render triggered for local video`);
                }, 100);
            }
        };

        newRoom.on(RoomEvent.Connected, handleConnected);
        newRoom.on(RoomEvent.Disconnected, handleDisconnected);
        newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        newRoom.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);

        // Connect and enable camera/mic (front camera by default)
        newRoom.connect(livekitUrl, token).then(async () => {
            const participantId = newRoom.localParticipant?.identity || 'unknown';
            console.log(`[HumanVideoCall][${participantId}] Connected, checking permissions...`);

            // Request camera and microphone permissions
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();

            console.log(`[HumanVideoCall][${participantId}] Permissions - Camera: ${cameraStatus}, Mic: ${micStatus}`);

            if (cameraStatus !== 'granted' || micStatus !== 'granted') {
                console.error(`[HumanVideoCall][${participantId}] Permissions denied`);
                Alert.alert(
                    'Permisos necesarios',
                    'Para la videollamada necesitamos acceso a tu cámara y micrófono. Por favor, habilita los permisos en la configuración de la aplicación.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            // Try to enable camera - if it fails, we can still receive remote video
            try {
                console.log(`[HumanVideoCall][${participantId}] Enabling camera...`);
                await newRoom.localParticipant.setCameraEnabled(true, {
                    facingMode: 'user' // Front camera
                });
                await newRoom.localParticipant.setMicrophoneEnabled(true);

                // Explicitly get the local video track after camera is enabled
                const cameraPublication = newRoom.localParticipant.getTrackPublication(Track.Source.Camera);
                if (cameraPublication?.track) {
                    console.log(`[HumanVideoCall][${participantId}] Setting local video track from publication`);
                    setLocalVideoTrack(cameraPublication.track as VideoTrack);
                    // Force re-render for PiP
                    setTimeout(() => {
                        setTrackUpdateCounter(prev => prev + 1);
                        console.log(`[HumanVideoCall][${participantId}] Force re-render triggered for local PiP from publication`);
                    }, 150);
                } else {
                    console.log(`[HumanVideoCall][${participantId}] WARNING: No local camera track found after enabling`);
                }
            } catch (cameraError: any) {
                console.error(`[HumanVideoCall][${participantId}] Camera error (continuing anyway):`, cameraError.message || cameraError);
                // Even if local camera fails, we can still receive and display remote video
                Alert.alert(
                    'Error de cámara',
                    'No se pudo activar tu cámara, pero puedes continuar viendo y escuchando al otro participante.',
                    [{ text: 'Entendido' }]
                );
            }
        }).catch(err => {
            console.error("[HumanVideoCall] Connection error:", err);
        });

        setRoom(newRoom);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            newRoom.disconnect();
        };
    }, [livekitUrl, token]);

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Toggle microphone
    const handleToggleMute = async () => {
        if (!room) return;
        const newMuted = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!newMuted);
        setIsMuted(newMuted);
    };

    // Toggle camera on/off
    const handleToggleCamera = async () => {
        if (!room) return;
        const newCameraOff = !isCameraOff;
        await room.localParticipant.setCameraEnabled(!newCameraOff);
        setIsCameraOff(newCameraOff);
    };

    // Switch between front and back camera
    const handleSwitchCamera = async () => {
        if (!room || isCameraOff || isSwitchingCamera) return;

        const participantId = room.localParticipant?.identity || 'unknown';
        setIsSwitchingCamera(true);

        try {
            console.log(`[HumanVideoCall][${participantId}] ========== SWITCH CAMERA TRIGGERED ==========`);
            console.log(`[HumanVideoCall][${participantId}] Current isFrontCamera:`, isFrontCamera);
            const newFacingMode = isFrontCamera ? 'environment' : 'user';

            // Get current video track
            const videoPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);

            // Create new track with different facingMode and republish
            console.log(`[HumanVideoCall][${participantId}] Creating new video track with facingMode:`, newFacingMode);

            // Unpublish current video track first
            if (videoPublication?.track) {
                await room.localParticipant.unpublishTrack(videoPublication.track);
                console.log(`[HumanVideoCall][${participantId}] Unpublished current video track`);
            }

            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 200));

            // Create new track with opposite facingMode
            const newTrack = await createLocalVideoTrack({
                facingMode: newFacingMode,
                resolution: { width: 640, height: 480 },
            });

            // Publish the new track
            await room.localParticipant.publishTrack(newTrack, {
                source: Track.Source.Camera,
            });

            // Update local video state and force re-render for remote viewers
            setLocalVideoTrack(newTrack);
            setIsFrontCamera(!isFrontCamera);
            setTrackUpdateCounter(prev => prev + 1);
            console.log(`[HumanVideoCall][${participantId}] Switched to ${newFacingMode} camera successfully`);
            console.log(`[HumanVideoCall][${participantId}] ========== SWITCH CAMERA COMPLETE ==========`);

        } catch (error) {
            console.error(`[HumanVideoCall][${participantId}] Error switching camera:`, error);

            // Fallback: try re-enabling camera if switching failed
            try {
                console.log(`[HumanVideoCall][${participantId}] Fallback: re-enabling camera...`);
                await room.localParticipant.setCameraEnabled(true);
            } catch (fallbackError) {
                console.error(`[HumanVideoCall][${participantId}] Fallback also failed:`, fallbackError);
            }
        } finally {
            setIsSwitchingCamera(false);
        }
    };

    // End call
    const handleEndCall = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        room?.disconnect();
        onDisconnect();
    };

    return (
        <View style={[styles.container, style]}>
            {/* Remote video (the other person) */}
            <View style={styles.remoteVideoContainer}>
                {remoteVideoTrack ? (
                    <VideoView
                        key={`remote-${remoteVideoTrack.sid || 'default'}-${trackUpdateCounter}`}
                        videoTrack={remoteVideoTrack}
                        style={styles.remoteVideo}
                        objectFit="cover"
                        zOrder={0}
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <MaterialIcons name="person" size={64} color={COLORS.textMuted} />
                        <Text style={styles.waitingText}>
                            {isConnected ? "Esperando video..." : "Conectando..."}
                        </Text>
                    </View>
                )}

                {/* Gold border for human session */}
                <View style={styles.goldBorder} pointerEvents="none" />
            </View>

            {/* Local video PiP (your own camera) */}
            {localVideoTrack && !isCameraOff && (
                <View style={styles.localVideoContainer}>
                    <VideoView
                        key={`local-${localVideoTrack.sid || 'default'}-${isFrontCamera ? 'front' : 'back'}-${trackUpdateCounter}`}
                        videoTrack={localVideoTrack}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={isFrontCamera}
                        zOrder={1}
                    />
                </View>
            )}

            {/* EN VIVO Badge */}
            <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>EN VIVO</Text>
            </Animated.View>

            {/* Call duration */}
            <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
            </View>

            {/* Call controls overlay */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={handleToggleMute}
                >
                    <MaterialIcons
                        name={isMuted ? "mic-off" : "mic"}
                        size={24}
                        color={COLORS.textMain}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                    onPress={handleToggleCamera}
                >
                    <MaterialIcons
                        name={isCameraOff ? "videocam-off" : "videocam"}
                        size={24}
                        color={COLORS.textMain}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isCameraOff && styles.controlButtonDisabled]}
                    onPress={handleSwitchCamera}
                    disabled={isCameraOff}
                >
                    <MaterialIcons
                        name="cameraswitch"
                        size={24}
                        color={isCameraOff ? COLORS.textMuted : COLORS.textMain}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endCallButton]}
                    onPress={handleEndCall}
                >
                    <MaterialIcons name="call-end" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: COLORS.backgroundDark,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
    },
    remoteVideoContainer: {
        flex: 1,
        backgroundColor: "#2a2a2a",
    },
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    goldBorder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 3,
        borderColor: COLORS.gold400,
        borderRadius: 16,
    },
    waitingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    waitingText: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginTop: 8,
    },
    localVideoContainer: {
        position: "absolute",
        bottom: 60,
        right: 12,
        width: 100,
        height: 140,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: COLORS.textMain,
        backgroundColor: "#1a1a1a", // Fallback background
    },
    localVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    liveBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.9)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.textMain,
        marginRight: 6,
    },
    liveText: {
        color: COLORS.textMain,
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    durationBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: COLORS.overlay,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    durationText: {
        color: COLORS.textMain,
        fontSize: 13,
        fontWeight: "600",
    },
    controlsContainer: {
        position: "absolute",
        bottom: 12,
        left: 12,
        flexDirection: "row",
        gap: 10,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.overlay,
        justifyContent: "center",
        alignItems: "center",
    },
    controlButtonActive: {
        backgroundColor: "rgba(239, 68, 68, 0.8)",
    },
    controlButtonDisabled: {
        opacity: 0.5,
    },
    endCallButton: {
        backgroundColor: COLORS.red500,
    },
});
