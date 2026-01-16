/**
 * HumanVideoCall Component
 * Renders live video call between client and professional within the chat interface
 * Features: Remote video, local PiP, call controls, "EN VIVO" badge
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
    Room,
    RoomEvent,
    Track,
    VideoTrack,
    RemoteParticipant,
    LocalParticipant,
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
            console.log("[HumanVideoCall] Track subscribed:", track.kind);
            if (track.kind === Track.Kind.Video) {
                setRemoteVideoTrack(track as VideoTrack);
            }
        };

        const handleTrackUnsubscribed = (track: Track) => {
            if (track.kind === Track.Kind.Video) {
                setRemoteVideoTrack(null);
            }
        };

        const handleLocalTrackPublished = (publication: any, participant: LocalParticipant) => {
            if (publication.track?.kind === Track.Kind.Video) {
                setLocalVideoTrack(publication.track as VideoTrack);
            }
        };

        newRoom.on(RoomEvent.Connected, handleConnected);
        newRoom.on(RoomEvent.Disconnected, handleDisconnected);
        newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        newRoom.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);

        // Connect and enable camera/mic (front camera by default)
        newRoom.connect(livekitUrl, token).then(async () => {
            await newRoom.localParticipant.setCameraEnabled(true, {
                facingMode: 'user' // Front camera
            });
            await newRoom.localParticipant.setMicrophoneEnabled(true);
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
        if (!room || isCameraOff) return;
        try {
            const newFacingMode = isFrontCamera ? 'environment' : 'user';
            // Re-enable camera with new facing mode
            await room.localParticipant.setCameraEnabled(false);
            await room.localParticipant.setCameraEnabled(true, {
                facingMode: newFacingMode
            });
            setIsFrontCamera(!isFrontCamera);
            console.log("[HumanVideoCall] Switched to", newFacingMode, "camera");
        } catch (error) {
            console.error("[HumanVideoCall] Error switching camera:", error);
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
            {/* Remote video (professional) */}
            <View style={styles.remoteVideoContainer}>
                {remoteVideoTrack ? (
                    <VideoView
                        videoTrack={remoteVideoTrack}
                        style={styles.remoteVideo}
                        objectFit="cover"
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

            {/* Local video PiP */}
            {localVideoTrack && !isCameraOff && (
                <View style={styles.localVideoContainer}>
                    <VideoView
                        videoTrack={localVideoTrack}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={true}
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
        width: "100%",
        aspectRatio: 4 / 3,
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
    },
    localVideo: {
        flex: 1,
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
