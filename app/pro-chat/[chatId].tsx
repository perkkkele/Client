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
    Alert,
    Dimensions,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, useIncomingCall } from "../../context";
import { getChat, proReply } from "../../api/chat";
import { getMessages, ChatMessage } from "../../api/chatMessage";
import { createVideoCall, getVideoCallToken } from "../../api/videoCall";
import { getAssetUrl } from "../../api";
import HumanVideoCall from "../../components/HumanVideoCall";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#2c2c24",
    textMain: "#181811",
    textMuted: "#9CA3AF",
    textLight: "#FFFFFF",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray800: "#1E293B",
    green500: "#22c55e",
    red500: "#EF4444",
    black: "#000000",
};

// Helper to format time
const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

// Helper to format date header
const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
};

export default function ProChatScreen() {
    const { chatId, startVideoCall } = useLocalSearchParams<{ chatId: string; startVideoCall?: string }>();
    const { user, token } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);
    const autoStartAttempted = useRef(false);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [clientName, setClientName] = useState("Cliente");
    const [clientAvatar, setClientAvatar] = useState<string | null>(null);
    const [clientInitials, setClientInitials] = useState("CL");
    const [isEscalated, setIsEscalated] = useState(false);
    const [escalatedReason, setEscalatedReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState("");

    // Video call state
    const [isInCall, setIsInCall] = useState(false);
    const [startingCall, setStartingCall] = useState(false);
    const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);

    const loadChatData = useCallback(async () => {
        if (!token || !chatId) return;

        try {
            const chat = await getChat(token, chatId);
            const client = chat.participant_one as any;
            if (client) {
                const name = client.firstname && client.lastname
                    ? `${client.firstname} ${client.lastname}`
                    : client.firstname || client.email?.split('@')[0] || 'Cliente';
                setClientName(name);

                const initials = client.firstname && client.lastname
                    ? `${client.firstname[0]}${client.lastname[0]}`.toUpperCase()
                    : client.firstname?.[0]?.toUpperCase() || 'CL';
                setClientInitials(initials);

                if (client.avatar) {
                    const avatarUrl = getAssetUrl(client.avatar);
                    if (avatarUrl) setClientAvatar(avatarUrl);
                }
            }

            setIsEscalated(!!(chat as any).escalatedAt);
            setEscalatedReason((chat as any).escalatedReason || null);

            const msgs = await getMessages(token, chatId);
            setMessages(msgs);
        } catch (error) {
            console.error("Error loading chat:", error);
            Alert.alert("Error", "No se pudo cargar la conversación");
        } finally {
            setLoading(false);
        }
    }, [token, chatId]);

    useEffect(() => {
        loadChatData();
    }, [loadChatData]);

    // Auto-start video call when navigating from appointment card
    useEffect(() => {
        if (startVideoCall === 'true' && !loading && !autoStartAttempted.current && token && chatId) {
            autoStartAttempted.current = true;
            // Start video call automatically without confirmation dialog
            (async () => {
                setStartingCall(true);
                try {
                    await createVideoCall(token, chatId);
                    const callData = await getVideoCallToken(token, chatId);
                    setLivekitUrl(callData.livekitUrl);
                    setLivekitToken(callData.token ?? null);
                    setIsInCall(true);
                } catch (error: any) {
                    console.error("Error auto-starting video call:", error);
                    Alert.alert("Error", error.message || "No se pudo iniciar la videollamada");
                } finally {
                    setStartingCall(false);
                }
            })();
        }
    }, [startVideoCall, loading, token, chatId]);

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    // Subscribe to real-time messages from client/twin
    const { subscribeToMessages } = useIncomingCall();

    useEffect(() => {
        if (!chatId || !subscribeToMessages) return;

        const unsubscribe = subscribeToMessages(chatId, (data) => {
            // Add new messages from client or twin (not from pro)
            if (!data.message.isFromProfessional) {
                const newMsg: ChatMessage = {
                    _id: data.message._id,
                    chat: data.message.chat,
                    user: data.message.user,
                    message: data.message.message,
                    type: (data.message.type || "TEXT") as "TEXT" | "IMAGE",
                    isFromBot: data.message.isFromBot,
                    isFromProfessional: false,
                    createdAt: data.message.createdAt,
                    updatedAt: data.message.updatedAt,
                };
                setMessages(prev => [...prev, newMsg]);
                console.log('[ProChat] Added client/twin message via socket');
            }
        });

        return unsubscribe;
    }, [chatId, subscribeToMessages]);

    const handleSend = async () => {
        if (!inputText.trim() || !token || !chatId || sending) return;

        const messageText = inputText.trim();
        setInputText("");
        setSending(true);

        try {
            await proReply(token, chatId, messageText);

            const newMessage: ChatMessage = {
                _id: Date.now().toString(),
                chat: chatId,
                user: user?._id || "",
                message: messageText,
                type: "TEXT",
                isFromBot: false,
                isFromProfessional: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            Alert.alert("Error", "No se pudo enviar el mensaje");
            setInputText(messageText);
        } finally {
            setSending(false);
        }
    };

    function handleBack() {
        if (isInCall) {
            Alert.alert(
                "Llamada en curso",
                "¿Deseas colgar la llamada y salir?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Colgar", style: "destructive", onPress: () => {
                            setIsInCall(false);
                            router.back();
                        }
                    }
                ]
            );
        } else {
            router.back();
        }
    }

    const handleStartVideoCall = async () => {
        if (!token || !chatId || startingCall) return;

        Alert.alert(
            "Iniciar videollamada",
            `¿Quieres iniciar una videollamada con ${clientName}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Iniciar",
                    onPress: async () => {
                        setStartingCall(true);
                        try {
                            await createVideoCall(token, chatId);
                            const callData = await getVideoCallToken(token, chatId);
                            setLivekitUrl(callData.livekitUrl);
                            setLivekitToken(callData.token ?? null);
                            setIsInCall(true);
                        } catch (error: any) {
                            console.error("Error starting call:", error);
                            Alert.alert("Error", error.message || "No se pudo iniciar la videollamada");
                        } finally {
                            setStartingCall(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEndCall = () => {
        setIsInCall(false);
        setLivekitUrl(null);
        setLivekitToken(null);
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    messages.forEach(msg => {
        const msgDate = new Date(msg.createdAt).toDateString();
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msg.createdAt, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    // Get avatar for message sender
    const getMessageAvatar = (msg: ChatMessage) => {
        if (msg.isFromProfessional) {
            // Professional's own avatar
            if (user?.avatar) {
                return getAssetUrl(user.avatar);
            }
            return null;
        } else if (msg.isFromBot) {
            // Digital twin - use professional avatar with robot indicator
            return null; // Will show robot icon
        } else {
            // Client avatar
            return clientAvatar;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Floating Header */}
            <View style={styles.headerOverlay}>
                <View style={styles.headerContent}>
                    {/* Back button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={20} color={COLORS.gray600} />
                    </TouchableOpacity>

                    {/* Client info bubble */}
                    <View style={styles.clientBubble}>
                        <View style={styles.avatarContainer}>
                            {clientAvatar ? (
                                <Image source={{ uri: clientAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{clientInitials}</Text>
                                </View>
                            )}
                            <View style={styles.onlineIndicator} />
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
                            <Text style={styles.clientSubtitle}>
                                {isEscalated ? "Chat escalado" : "En conversación"}
                            </Text>
                        </View>
                    </View>

                    {/* Video call button */}
                    {!isInCall && (
                        <TouchableOpacity
                            style={styles.videoCallButton}
                            onPress={handleStartVideoCall}
                            disabled={startingCall}
                        >
                            {startingCall ? (
                                <ActivityIndicator size="small" color={COLORS.textMain} />
                            ) : (
                                <MaterialIcons name="videocam" size={20} color={COLORS.textMain} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Video Call Area (when active) */}
                {isInCall && livekitUrl && livekitToken && (
                    <View style={styles.videoSection}>
                        <View style={styles.videoContainer}>
                            <HumanVideoCall
                                livekitUrl={livekitUrl}
                                token={livekitToken}
                                onDisconnect={handleEndCall}
                                style={styles.videoCall}
                            />
                        </View>
                    </View>
                )}

                {/* Chat Messages */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <KeyboardAvoidingView
                        style={styles.chatContainer}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={100}
                    >
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.messagesScroll}
                            contentContainerStyle={styles.messagesContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Spacer for header */}
                            <View style={{ height: isInCall ? 16 : 80 }} />

                            {groupedMessages.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.gray300} />
                                    <Text style={styles.emptyText}>No hay mensajes</Text>
                                </View>
                            ) : (
                                groupedMessages.map((group, groupIndex) => (
                                    <View key={groupIndex}>
                                        {/* Date header */}
                                        <View style={styles.dateHeader}>
                                            <Text style={styles.dateHeaderText}>
                                                {formatDateHeader(group.date)}
                                            </Text>
                                        </View>

                                        {group.messages.map((msg) => {
                                            const isFromPro = msg.isFromProfessional;
                                            const msgAvatar = getMessageAvatar(msg);

                                            return (
                                                <View
                                                    key={msg._id}
                                                    style={[
                                                        styles.messageRow,
                                                        isFromPro && styles.messageRowRight
                                                    ]}
                                                >
                                                    {/* Avatar (left side for received) */}
                                                    {!isFromPro && (
                                                        <View style={styles.messageAvatarContainer}>
                                                            {msg.isFromBot ? (
                                                                <View style={styles.botAvatarPlaceholder}>
                                                                    <MaterialIcons name="smart-toy" size={16} color={COLORS.textLight} />
                                                                </View>
                                                            ) : msgAvatar ? (
                                                                <Image source={{ uri: msgAvatar }} style={styles.messageAvatar} />
                                                            ) : (
                                                                <View style={styles.messageAvatarPlaceholder}>
                                                                    <Text style={styles.messageAvatarText}>{clientInitials}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}

                                                    {/* Message bubble */}
                                                    <View style={styles.messageBubbleContainer}>
                                                        <View style={[
                                                            styles.messageBubble,
                                                            isFromPro ? styles.sentBubble : styles.receivedBubble,
                                                            msg.isFromBot && styles.botBubble
                                                        ]}>
                                                            <Text style={[
                                                                styles.messageText,
                                                                isFromPro && styles.sentMessageText
                                                            ]}>
                                                                {msg.message}
                                                            </Text>
                                                        </View>
                                                        <Text style={[
                                                            styles.messageTime,
                                                            isFromPro && styles.messageTimeRight
                                                        ]}>
                                                            {formatTime(msg.createdAt)}
                                                            {msg.isFromBot && " • Gemelo"}
                                                            {isFromPro && " • Tú"}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))
                            )}

                            <View style={{ height: 16 }} />
                        </ScrollView>

                        {/* Input Area */}
                        <View style={styles.inputArea}>
                            <View style={styles.inputRow}>
                                {/* Add button */}
                                <TouchableOpacity style={styles.addButton}>
                                    <MaterialIcons name="add" size={22} color={COLORS.gray600} />
                                </TouchableOpacity>

                                {/* Text input */}
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Escribe un mensaje..."
                                        placeholderTextColor={COLORS.gray400}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline
                                        maxLength={2000}
                                    />
                                    <TouchableOpacity style={styles.micButton}>
                                        <MaterialIcons name="mic" size={20} color={COLORS.gray500} />
                                    </TouchableOpacity>
                                </View>

                                {/* Send button */}
                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        (!inputText.trim() || sending) && styles.sendButtonDisabled
                                    ]}
                                    onPress={handleSend}
                                    disabled={!inputText.trim() || sending}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <MaterialIcons name="send" size={26} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Floating Header
    headerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    clientBubble: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 24,
        paddingLeft: 8,
        paddingRight: 16,
        paddingVertical: 8,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray400,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: "600",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    videoCallButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    // Main Content
    mainContent: {
        flex: 1,
    },
    // Video Section
    videoSection: {
        paddingHorizontal: 16,
        paddingTop: 100,
        paddingBottom: 0,
    },
    videoContainer: {
        aspectRatio: 4 / 3,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: COLORS.textMain,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    videoCall: {
        flex: 1,
    },
    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    // Chat
    chatContainer: {
        flex: 1,
    },
    messagesScroll: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.gray400,
    },
    // Date Header
    dateHeader: {
        alignItems: "center",
        marginVertical: 16,
    },
    dateHeaderText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // Messages
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 16,
        gap: 12,
    },
    messageRowRight: {
        flexDirection: "row-reverse",
    },
    messageAvatarContainer: {
        width: 32,
        height: 32,
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    messageAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray300,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    messageAvatarText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    botAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#8B5CF6",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    messageBubbleContainer: {
        maxWidth: "80%",
        gap: 4,
    },
    messageBubble: {
        padding: 16,
        borderRadius: 16,
    },
    receivedBubble: {
        backgroundColor: COLORS.surfaceLight,
        borderTopLeftRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    sentBubble: {
        backgroundColor: COLORS.primary,
        borderTopRightRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    botBubble: {
        backgroundColor: "#F3E8FF",
        borderWidth: 1,
        borderColor: "#E9D5FF",
    },
    messageText: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 20,
    },
    sentMessageText: {
        color: COLORS.textMain,
    },
    messageTime: {
        fontSize: 10,
        color: COLORS.gray400,
        paddingLeft: 4,
    },
    messageTimeRight: {
        textAlign: "right",
        paddingRight: 4,
    },
    // Input Area
    inputArea: {
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        paddingTop: 8,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 12,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        minHeight: 48,
        paddingRight: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: 100,
    },
    micButton: {
        padding: 8,
    },
    sendButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.black,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray400,
        shadowOpacity: 0.1,
    },
});
