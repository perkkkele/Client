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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getChat, proReply } from "../../api/chat";
import { getMessages, ChatMessage } from "../../api/chatMessage";
import { createVideoCall } from "../../api/videoCall";

const COLORS = {
    primary: "#137fec",
    backgroundDark: "#101922",
    surfaceDark: "#182430",
    borderDark: "#2a3642",
    textMain: "#FFFFFF",
    textSecondary: "#9CA3AF",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    green400: "#4ade80",
    green500: "#22c55e",
    orange400: "#fb923c",
    purple400: "#c084fc",
    indigo400: "#818cf8",
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
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { user, token } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [clientName, setClientName] = useState("Cliente");
    const [isEscalated, setIsEscalated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState("");
    const [startingCall, setStartingCall] = useState(false);

    const loadChatData = useCallback(async () => {
        if (!token || !chatId) return;

        try {
            // Load chat info
            const chat = await getChat(token, chatId);
            const client = chat.participant_one as any;
            if (client) {
                const name = client.firstname && client.lastname
                    ? `${client.firstname} ${client.lastname}`
                    : client.firstname || client.email?.split('@')[0] || 'Cliente';
                setClientName(name);
            }
            setIsEscalated(!!(chat as any).escalatedAt);

            // Load messages
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

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || !token || !chatId || sending) return;

        const messageText = inputText.trim();
        setInputText("");
        setSending(true);

        try {
            await proReply(token, chatId, messageText);

            // Optimistically add message to UI
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
            setInputText(messageText); // Restore text
        } finally {
            setSending(false);
        }
    };

    function handleBack() {
        router.back();
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
                            router.push(`/video-call/${chatId}` as any);
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

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{clientName}</Text>
                    {isEscalated && (
                        <View style={styles.escalatedBadge}>
                            <MaterialIcons name="warning" size={12} color={COLORS.orange400} />
                            <Text style={styles.escalatedBadgeText}>Escalado</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleStartVideoCall}
                    disabled={startingCall}
                >
                    {startingCall ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <MaterialIcons name="videocam" size={24} color={COLORS.primary} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Messages */}
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
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {groupedMessages.map((group, groupIndex) => (
                            <View key={groupIndex}>
                                <View style={styles.dateHeader}>
                                    <Text style={styles.dateHeaderText}>
                                        {formatDateHeader(group.date)}
                                    </Text>
                                </View>
                                {group.messages.map((msg) => (
                                    <View
                                        key={msg._id}
                                        style={[
                                            styles.messageBubble,
                                            msg.isFromProfessional
                                                ? styles.proMessage
                                                : msg.isFromBot
                                                    ? styles.botMessage
                                                    : styles.clientMessage
                                        ]}
                                    >
                                        {!msg.isFromProfessional && (
                                            <View style={styles.messageLabel}>
                                                <MaterialIcons
                                                    name={msg.isFromBot ? "smart-toy" : "person"}
                                                    size={12}
                                                    color={msg.isFromBot ? COLORS.purple400 : COLORS.indigo400}
                                                />
                                                <Text style={[
                                                    styles.messageLabelText,
                                                    { color: msg.isFromBot ? COLORS.purple400 : COLORS.indigo400 }
                                                ]}>
                                                    {msg.isFromBot ? "Gemelo Digital" : clientName}
                                                </Text>
                                            </View>
                                        )}
                                        <Text style={[
                                            styles.messageText,
                                            msg.isFromProfessional && styles.proMessageText
                                        ]}>
                                            {msg.message}
                                        </Text>
                                        <Text style={[
                                            styles.messageTime,
                                            msg.isFromProfessional && styles.proMessageTime
                                        ]}>
                                            {formatTime(msg.createdAt)}
                                            {msg.isFromProfessional && " • Tú"}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Escribe tu respuesta..."
                            placeholderTextColor={COLORS.gray500}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={2000}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!inputText.trim() || sending) && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <MaterialIcons name="send" size={22} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    headerButton: {
        padding: 8,
        width: 44,
        alignItems: "center",
    },
    headerInfo: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    escalatedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: "rgba(251, 146, 60, 0.15)",
    },
    escalatedBadgeText: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.orange400,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    dateHeader: {
        alignItems: "center",
        marginVertical: 16,
    },
    dateHeaderText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        backgroundColor: COLORS.surfaceDark,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    messageBubble: {
        maxWidth: "85%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    clientMessage: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.surfaceDark,
        borderTopLeftRadius: 4,
    },
    botMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#2a2540",
        borderTopLeftRadius: 4,
    },
    proMessage: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primary,
        borderTopRightRadius: 4,
    },
    messageLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 4,
    },
    messageLabelText: {
        fontSize: 11,
        fontWeight: "500",
    },
    messageText: {
        fontSize: 15,
        color: COLORS.textMain,
        lineHeight: 20,
    },
    proMessageText: {
        color: "#FFFFFF",
    },
    messageTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    proMessageTime: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 12,
        backgroundColor: COLORS.surfaceDark,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderDark,
        gap: 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: COLORS.textMain,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray500,
    },
});
