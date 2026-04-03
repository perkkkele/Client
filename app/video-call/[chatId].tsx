import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getVideoCallToken, endVideoCall } from "../../api/videoCall";
import { getChat } from "../../api/chat";
import { getMessages, sendTextMessage, ChatMessage } from "../../api/chatMessage";
import ProCallVideo, { VideoCallControls } from "../../components/ProCallVideo";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#137fec",
    backgroundDark: "#0a0f14",
    surfaceDark: "#141c24",
    borderDark: "#1f2937",
    textMain: "#FFFFFF",
    textSecondary: "#9CA3AF",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    green400: "#4ade80",
    green500: "#22c55e",
    red400: "#f87171",
    red500: "#ef4444",
};

export default function VideoCallScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { user, token } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation("settings");
    const scrollViewRef = useRef<ScrollView>(null);

    // Video call state
    const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [participantName, setParticipantName] = useState("Participant");
    const [callDuration, setCallDuration] = useState(0);
    const [remoteParticipant, setRemoteParticipant] = useState<string | null>(null);
    const [videoControls, setVideoControls] = useState<VideoCallControls | null>(null);

    // Controls state
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);

    // Loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Timer ref
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load call data
    const loadCallData = useCallback(async () => {
        if (!token || !chatId) return;

        try {
            // Get chat info
            const chat = await getChat(token, chatId);
            const isP1 = (chat.participant_one as any)?._id === user?._id;
            const otherParticipant = isP1 ? chat.participant_two : chat.participant_one;
            const name = (otherParticipant as any)?.firstname
                ? `${(otherParticipant as any).firstname} ${(otherParticipant as any).lastname || ''}`
                : 'Participant';
            setParticipantName(name.trim());

            // Get video call token
            const tokenData = await getVideoCallToken(token, chatId);
            setLivekitUrl(tokenData.livekitUrl);
            setLivekitToken(tokenData.token || null);

            // Load existing messages
            const msgs = await getMessages(token, chatId);
            setMessages(msgs);

        } catch (err: any) {
            console.error("Error loading call:", err);
            setError(err.message || t("videoCallScreen.loadError"));
        } finally {
            setLoading(false);
        }
    }, [token, chatId, user?._id]);

    useEffect(() => {
        loadCallData();
    }, [loadCallData]);

    // Call duration timer
    useEffect(() => {
        if (isConnected) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isConnected]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle end call
    const handleEndCall = async () => {
        showAlert({
            type: 'warning',
            title: t("videoCallScreen.endCallTitle"),
            message: t("videoCallScreen.endCallMessage"),
            buttons: [
                { text: t("videoCallScreen.cancel"), style: 'cancel' },
                {
                    text: t("videoCallScreen.endCall"),
                    style: 'destructive',
                    onPress: async () => {
                        if (token && chatId) {
                            try {
                                await endVideoCall(token, chatId);
                            } catch (err) {
                                console.error("Error ending call:", err);
                            }
                        }
                        router.back();
                    }
                }
            ]
        });
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!inputText.trim() || !token || !chatId || sending) return;

        const messageText = inputText.trim();
        setInputText("");
        setSending(true);

        try {
            const newMessage = await sendTextMessage(token, chatId, messageText);
            setMessages(prev => [...prev, newMessage]);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err) {
            console.error("Error sending message:", err);
            setInputText(messageText);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>{t("videoCallScreen.connectingCall")}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !livekitToken) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color={COLORS.red400} />
                    <Text style={styles.errorTitle}>{t("videoCallScreen.connectionError")}</Text>
                    <Text style={styles.errorText}>{error || t("videoCallScreen.connectionErrorFallback")}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>{t("videoCallScreen.back")}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Video Area */}
            <View style={styles.videoArea}>
                {/* Header overlay */}
                <View style={styles.headerOverlay}>
                    <View style={styles.callInfo}>
                        <View style={[styles.statusDot, isConnected && styles.statusDotActive]} />
                        <Text style={styles.participantName}>{participantName}</Text>
                    </View>
                    <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
                </View>

                {/* Video */}
                <ProCallVideo
                    livekitUrl={livekitUrl!}
                    livekitToken={livekitToken}
                    style={styles.video}
                    onConnectionChange={setIsConnected}
                    onError={(err) => console.error("Video error:", err)}
                    onParticipantJoin={(identity) => setRemoteParticipant(identity)}
                    onParticipantLeave={() => setRemoteParticipant(null)}
                    onControlsReady={(controls) => {
                        console.log('[VideoCall] Controls ready');
                        setVideoControls(controls);
                    }}
                    muted={isMuted}
                    cameraOff={isCameraOff}
                />

                {/* Remote participant indicator */}
                {!remoteParticipant && isConnected && (
                    <View style={styles.waitingOverlay}>
                        <ActivityIndicator size="small" color={COLORS.textMain} />
                        <Text style={styles.waitingText}>{t("videoCallScreen.waitingFor", { name: participantName })}</Text>
                    </View>
                )}
            </View>

            {/* Chat Panel (if shown) */}
            {showChat && (
                <KeyboardAvoidingView
                    style={styles.chatPanel}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatMessages}
                        contentContainerStyle={styles.chatContent}
                    >
                        {messages.map((msg) => (
                            <View
                                key={msg._id}
                                style={[
                                    styles.messageBubble,
                                    (typeof msg.user === 'string' ? msg.user : msg.user._id) === user?._id
                                        ? styles.myMessage
                                        : styles.theirMessage
                                ]}
                            >
                                <Text style={styles.messageText}>{msg.message}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.chatInput}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={t("videoCallScreen.writeMessage")}
                            placeholderTextColor={COLORS.gray500}
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || sending}
                        >
                            <MaterialIcons name="send" size={20} color={COLORS.textMain} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={() => {
                        const newMuted = !isMuted;
                        setIsMuted(newMuted);
                        videoControls?.setMuted(newMuted);
                    }}
                >
                    <MaterialIcons
                        name={isMuted ? "mic-off" : "mic"}
                        size={24}
                        color={COLORS.textMain}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                    onPress={() => {
                        const newCameraOff = !isCameraOff;
                        setIsCameraOff(newCameraOff);
                        videoControls?.setCameraEnabled(!newCameraOff);
                    }}
                >
                    <MaterialIcons
                        name={isCameraOff ? "videocam-off" : "videocam"}
                        size={24}
                        color={COLORS.textMain}
                    />
                </TouchableOpacity>

                {/* Camera switch button */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                        console.log('[VideoCall] Switching camera...');
                        videoControls?.switchCamera();
                    }}
                    disabled={isCameraOff}
                >
                    <MaterialIcons
                        name="cameraswitch"
                        size={24}
                        color={isCameraOff ? COLORS.gray500 : COLORS.textMain}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, showChat && styles.controlButtonActive]}
                    onPress={() => setShowChat(!showChat)}
                >
                    <MaterialIcons name="chat" size={24} color={COLORS.textMain} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.endCallButton}
                    onPress={handleEndCall}
                >
                    <MaterialIcons name="call-end" size={28} color={COLORS.textMain} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    errorText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    backButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.textMain,
        fontWeight: "600",
    },
    videoArea: {
        flex: 1,
        position: "relative",
    },
    video: {
        flex: 1,
    },
    headerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    callInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.gray500,
    },
    statusDotActive: {
        backgroundColor: COLORS.green500,
    },
    participantName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    duration: {
        fontSize: 14,
        color: COLORS.textMain,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    waitingOverlay: {
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        alignItems: "center",
        gap: 12,
    },
    waitingText: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    chatPanel: {
        height: 200,
        backgroundColor: COLORS.surfaceDark,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderDark,
    },
    chatMessages: {
        flex: 1,
    },
    chatContent: {
        padding: 12,
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primary,
    },
    theirMessage: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.borderDark,
    },
    messageText: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    chatInput: {
        flexDirection: "row",
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderDark,
    },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: COLORS.textMain,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 32,
        gap: 20,
        backgroundColor: COLORS.surfaceDark,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    controlButtonActive: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    endCallButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.red500,
        alignItems: "center",
        justifyContent: "center",
    },
});
