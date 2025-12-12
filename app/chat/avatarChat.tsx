import { MaterialIcons } from "@expo/vector-icons";
import {
    AudioSession,
    LiveKitRoom,
    useRoomContext,
    useTracks,
    VideoTrack,
    isTrackReference,
} from "@livekit/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { liveAvatarApi } from "../../api";
import { useAuth } from "../../context";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

// Unified component that renders both video and chat inside single LiveKitRoom
function RoomContent({
    isSanta,
    messages,
    onAddMessage
}: {
    isSanta: boolean;
    messages: Message[];
    onAddMessage: (text: string, isUser: boolean) => void;
}) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const room = useRoomContext();
    const tracks = useTracks([Track.Source.Camera]);

    // Find the remote track (avatar's video)
    const avatarTrack = tracks.find(
        (track) => isTrackReference(track) && !track.participant.isLocal
    );

    async function handleSend() {
        if (!message.trim() || sending) return;

        const userMessage = message.trim();
        setMessage("");
        onAddMessage(userMessage, true);
        setSending(true);

        try {
            // Send text command to avatar via data channel
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({
                type: "avatar.speak_response",
                text: userMessage,
            }));

            await room.localParticipant.publishData(data, {
                reliable: true,
            });

            console.log("Sent message to avatar:", userMessage);
        } catch (err: any) {
            console.error("Send error:", err);
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    return (
        <>
            {/* Video Container */}
            <View style={styles.videoContainer}>
                {avatarTrack && isTrackReference(avatarTrack) ? (
                    <VideoTrack
                        trackRef={avatarTrack}
                        style={styles.avatarVideo}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>{isSanta ? "🎅" : "👤"}</Text>
                        <Text style={styles.avatarWaiting}>Esperando video del avatar...</Text>
                    </View>
                )}
            </View>

            {/* Chat Area */}
            <View style={styles.chatContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                >
                    {messages.map((msg, index) => (
                        <View
                            key={`${msg.id}-${index}`}
                            style={[
                                styles.messageBubble,
                                msg.isUser ? styles.userBubble : (isSanta ? styles.santaBubble : styles.avatarBubble),
                            ]}
                        >
                            {!msg.isUser && isSanta && (
                                <Text style={styles.santaIcon}>🎅</Text>
                            )}
                            <Text style={[
                                styles.messageText,
                                msg.isUser ? styles.userText : styles.avatarText,
                            ]}>
                                {msg.text}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={[styles.inputContainer, isSanta && styles.santaInputContainer]}>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={isSanta ? "Escribe tu mensaje a Santa..." : "Escribe un mensaje..."}
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            isSanta ? styles.santaSendButton : styles.defaultSendButton,
                            (!message.trim() || sending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!message.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <MaterialIcons name="send" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

export default function AvatarChatScreen() {
    const { chatId, partnerEmail } = useLocalSearchParams<{ chatId: string; partnerEmail: string }>();
    const { user } = useAuth();

    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
    const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(true);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);

    const avatarConfig = liveAvatarApi.getAvatarConfig(partnerEmail || "");
    const isSanta = partnerEmail === liveAvatarApi.SANTA_CONFIG.email;

    useEffect(() => {
        if (!avatarConfig) {
            setError("Este usuario no tiene avatar configurado");
            setConnecting(false);
            return;
        }

        // Start audio session
        AudioSession.startAudioSession();
        initSession();

        return () => {
            AudioSession.stopAudioSession();
            if (sessionToken) {
                liveAvatarApi.closeSession(sessionToken);
            }
        };
    }, []);

    async function initSession() {
        try {
            setConnecting(true);
            setError(null);

            console.log("Creating LiveAvatar session...");
            const tokenResponse = await liveAvatarApi.createSessionToken(avatarConfig!);
            setSessionToken(tokenResponse.session_token);

            console.log("Starting session...");
            const startResponse = await liveAvatarApi.startSession(tokenResponse.session_token);

            console.log("LiveKit URL:", startResponse.livekit_url);
            setLiveKitUrl(startResponse.livekit_url);
            setLiveKitToken(startResponse.livekit_client_token);

            setConnected(true);
            addMessage("¡Jo, jo, jo! ¡Hola! Soy Santa Claus. ¿En qué puedo ayudarte hoy?", false);

        } catch (err: any) {
            console.error("Session init error:", err);
            setError(err.message || "Error al conectar con el avatar");
        } finally {
            setConnecting(false);
        }
    }

    function addMessage(text: string, isUser: boolean) {
        const newMessage: Message = {
            id: Date.now().toString() + Math.random().toString(),
            text,
            isUser,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
    }

    function handleBack() {
        if (sessionToken) {
            liveAvatarApi.closeSession(sessionToken);
        }
        router.back();
    }

    // Build fallback URL for browser
    const liveKitMeetUrl = liveKitUrl && liveKitToken
        ? `https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(liveKitUrl)}&token=${encodeURIComponent(liveKitToken)}`
        : null;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={[styles.header, isSanta && styles.santaHeader]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>
                        {isSanta ? "🎅 Santa Claus" : "Avatar Chat"}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {connected ? "Conectado" : connecting ? "Conectando..." : "Desconectado"}
                    </Text>
                </View>
                {isSanta && liveKitMeetUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(liveKitMeetUrl)}>
                        <MaterialIcons name="open-in-browser" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Main Content - Single LiveKitRoom for everything */}
            {connecting ? (
                <View style={styles.loadingFullContainer}>
                    <ActivityIndicator size="large" color={isSanta ? "#c41e3a" : "#4F46E5"} />
                    <Text style={styles.loadingText}>Conectando con el avatar...</Text>
                    {isSanta && <Text style={styles.santaEmoji}>🎄</Text>}
                </View>
            ) : error ? (
                <View style={styles.errorFullContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#c41e3a" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={initSession}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : liveKitUrl && liveKitToken ? (
                <LiveKitRoom
                    serverUrl={liveKitUrl}
                    token={liveKitToken}
                    connect={true}
                    options={{
                        adaptiveStream: { pixelDensity: 'screen' },
                    }}
                    audio={true}
                    video={false}
                >
                    <RoomContent
                        isSanta={isSanta}
                        messages={messages}
                        onAddMessage={addMessage}
                    />
                </LiveKitRoom>
            ) : (
                <View style={styles.loadingFullContainer}>
                    <Text style={styles.avatarEmoji}>{isSanta ? "🎅" : "👤"}</Text>
                    <Text style={styles.avatarWaiting}>Preparando avatar...</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a2e",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4F46E5",
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
    },
    santaHeader: {
        backgroundColor: "#c41e3a",
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    videoContainer: {
        height: 300,
        backgroundColor: "#0d0d1a",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarVideo: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        alignItems: "center",
    },
    avatarEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    avatarWaiting: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
    },
    loadingFullContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a2e",
    },
    loadingText: {
        color: "white",
        marginTop: 15,
        fontSize: 14,
    },
    santaEmoji: {
        fontSize: 40,
        marginTop: 20,
    },
    errorFullContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#1a1a2e",
    },
    errorText: {
        color: "white",
        marginTop: 10,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 15,
        backgroundColor: "#c41e3a",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "white",
        fontWeight: "600",
    },
    chatContainer: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 12,
        borderRadius: 18,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "flex-start",
    },
    userBubble: {
        backgroundColor: "#4F46E5",
        alignSelf: "flex-end",
        borderBottomRightRadius: 4,
    },
    avatarBubble: {
        backgroundColor: "white",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
    },
    santaBubble: {
        backgroundColor: "#fff5f5",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: "#c41e3a",
    },
    santaIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        flex: 1,
    },
    userText: {
        color: "white",
    },
    avatarText: {
        color: "#333",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 10,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    santaInputContainer: {
        borderTopColor: "#c41e3a",
    },
    input: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    defaultSendButton: {
        backgroundColor: "#4F46E5",
    },
    santaSendButton: {
        backgroundColor: "#c41e3a",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
