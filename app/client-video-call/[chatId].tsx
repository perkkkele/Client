/**
 * Client Video Call Screen
 * Full chat interface with video call - mirrors avatar-chat layout
 * Features: Video placeholder, message thread, text input, drawer history
 */

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    ActivityIndicator,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { videoCallApi, getAssetUrl, chatApi } from "../../api";
import { useIncomingCall } from "../../context/IncomingCallContext";
import HumanVideoCall from "../../components/HumanVideoCall";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_MAX_HEIGHT = SCREEN_WIDTH * 0.75; // Same as avatar-chat

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    surfaceLight: "#FFFFFF",
    textMain: "#181811",
    textMuted: "#64748B",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gold400: "#FBBF24",
    gold500: "#F59E0B",
    green500: "#22C55E",
    red500: "#EF4444",
    white: "#FFFFFF",
    black: "#000000",
};

interface Message {
    id: string;
    _id?: string;
    type: "text" | "audio" | "typing";
    content?: string;
    message?: string;
    isUser: boolean;
    isFromProfessional?: boolean;
    isFromVideoCall?: boolean;
    timestamp: string;
}

export default function ClientVideoCallScreen() {
    const params = useLocalSearchParams<{
        chatId: string;
        professionalId?: string;
        professionalName?: string;
        professionalAvatar?: string;
    }>();

    const { chatId } = params;
    const professionalName = params.professionalName || "Profesional";
    const professionalAvatar = params.professionalAvatar;
    const professionalId = params.professionalId;

    const { token, user: currentUser } = useAuth();
    const { subscribeToMessages } = useIncomingCall();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    // Video call state
    const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [callEnded, setCallEnded] = useState(false);
    const [callDuration, setCallDuration] = useState<string>("");

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;

    // Fetch video call token on mount
    useEffect(() => {
        const initVideoCall = async () => {
            if (!token || !chatId) {
                setError("No se pudo iniciar la videollamada");
                setIsLoading(false);
                return;
            }

            try {
                console.log('[ClientVideoCall] Fetching token for chat:', chatId);
                const callData = await videoCallApi.getVideoCallToken(token, chatId);
                console.log('[ClientVideoCall] Got token, connecting to:', callData.livekitUrl);

                setLivekitUrl(callData.livekitUrl);
                setLivekitToken(callData.token ?? null);
                setIsLoading(false);
            } catch (err: any) {
                console.error('[ClientVideoCall] Error getting token:', err);
                setError(err.message || "Error al conectar la videollamada");
                setIsLoading(false);
            }
        };

        initVideoCall();
    }, [token, chatId]);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!chatId || !subscribeToMessages) return;

        const unsubscribe = subscribeToMessages(chatId, (data: any) => {
            // Data comes as {chatId, message: {...}} from socket
            const newMessage = data.message || data;
            console.log('[ClientVideoCall] New message received:', data);

            // Skip messages from self (already added via optimistic update)
            if (newMessage.user === currentUser?._id) {
                console.log('[ClientVideoCall] Skipping own message (already shown)');
                return;
            }

            const formattedMessage: Message = {
                id: newMessage._id || `msg-${Date.now()}`,
                _id: newMessage._id,
                type: 'text',
                content: newMessage.message, // The actual text content
                isUser: false, // Message from other user
                isFromProfessional: newMessage.isFromProfessional,
                isFromVideoCall: newMessage.isFromVideoCall,
                timestamp: new Date(newMessage.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            };

            // Check for duplicates before adding
            setMessages(prev => {
                const exists = prev.some(m => m._id === newMessage._id);
                if (exists) {
                    console.log('[ClientVideoCall] Skipping duplicate message');
                    return prev;
                }
                return [...prev, formattedMessage];
            });
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => unsubscribe?.();
    }, [chatId, subscribeToMessages, currentUser?._id]);

    // Handle send message
    const handleSendMessage = useCallback(async () => {
        if (!inputText.trim() || !token || !chatId || isSending || callEnded) return;

        const messageText = inputText.trim();
        setInputText("");
        setIsSending(true);

        // Optimistic update
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            type: 'text',
            content: messageText,
            isUser: true,
            isFromVideoCall: true,
            timestamp: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Send message with isFromVideoCall flag
            await chatApi.sendMessage(token, chatId, messageText, { isFromVideoCall: true });
            console.log('[ClientVideoCall] Message sent');
        } catch (error) {
            console.error('[ClientVideoCall] Error sending message:', error);
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        } finally {
            setIsSending(false);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [inputText, token, chatId, isSending, callEnded]);

    // Handle call ended
    const handleDisconnect = useCallback(() => {
        console.log('[ClientVideoCall] Call ended');
        setCallEnded(true);
        setIsConnected(false);
    }, []);

    // Drawer functions
    const openDrawer = useCallback(() => {
        setIsDrawerOpen(true);
        Animated.spring(drawerAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, [drawerAnim]);

    const closeDrawer = useCallback(() => {
        Animated.spring(drawerAnim, {
            toValue: -SCREEN_WIDTH * 0.8,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start(() => setIsDrawerOpen(false));
    }, [drawerAnim]);

    // Avatar URL helper
    const avatarUrl = professionalAvatar ? getAssetUrl(professionalAvatar) : null;

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.gold500} />
                    <Text style={styles.loadingText}>Conectando videollamada...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || (!livekitUrl || !livekitToken)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color={COLORS.gold500} />
                    <Text style={styles.errorText}>{error || "Error de conexión"}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                {/* Header - matching avatar-chat style */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                        <MaterialIcons name="menu" size={28} color={COLORS.textMain} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.professionalChip}>
                        <View style={styles.avatarSmallContainer}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
                            ) : (
                                <View style={styles.avatarSmallPlaceholder}>
                                    <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                                </View>
                            )}
                            <View style={[styles.onlineIndicatorSmall, { backgroundColor: COLORS.gold500 }]} />
                        </View>
                        <View style={styles.professionalChipText}>
                            <Text style={styles.professionalChipName}>{professionalName}</Text>
                            <Text style={[styles.professionalChipRole, { color: COLORS.gold500, fontWeight: '600' }]}>
                                {callEnded ? "Llamada finalizada" : "👤 EN VIVO"}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.historyButton}>
                        <MaterialIcons name="history" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Video Container - same position/size as avatar-chat */}
                    {!callEnded && (
                        <View style={styles.videoContainer}>
                            <HumanVideoCall
                                livekitUrl={livekitUrl}
                                token={livekitToken}
                                style={styles.videoImage}
                                onConnectionChange={(connected) => {
                                    console.log('[ClientVideoCall] Connection changed:', connected);
                                    setIsConnected(connected);
                                }}
                                onDisconnect={handleDisconnect}
                            />
                            {/* Gold border for video call */}
                            <View style={styles.goldBorder} pointerEvents="none" />
                        </View>
                    )}

                    {/* Call ended indicator */}
                    {callEnded && (
                        <View style={styles.callEndedContainer}>
                            <View style={styles.callEndedBadge}>
                                <MaterialIcons name="call-end" size={20} color={COLORS.white} />
                                <Text style={styles.callEndedText}>Llamada finalizada</Text>
                            </View>
                        </View>
                    )}

                    {/* Chat Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                    >
                        {messages.length === 0 && !callEnded && (
                            <View style={styles.emptyChat}>
                                <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyChatText}>
                                    Escribe un mensaje durante la videollamada
                                </Text>
                            </View>
                        )}

                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[
                                    styles.messageRow,
                                    message.isUser ? styles.userMessageRow : styles.otherMessageRow,
                                ]}
                            >
                                {/* Professional avatar for non-user messages */}
                                {!message.isUser && (
                                    <View style={styles.messageAvatarContainer}>
                                        {avatarUrl ? (
                                            <Image
                                                source={{ uri: avatarUrl }}
                                                style={styles.messageAvatar}
                                            />
                                        ) : (
                                            <View style={styles.messageAvatarPlaceholder}>
                                                <MaterialIcons name="person" size={18} color={COLORS.white} />
                                            </View>
                                        )}
                                    </View>
                                )}
                                <View
                                    style={[
                                        styles.messageBubble,
                                        message.isUser ? styles.userBubble : styles.otherBubble,
                                    ]}
                                >
                                    <Text style={[
                                        styles.messageText,
                                        message.isUser ? styles.userMessageText : styles.otherMessageText,
                                    ]}>
                                        {message.content || message.message}
                                    </Text>
                                    <Text style={styles.messageTime}>{message.timestamp}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Input Area - matching avatar-chat style */}
                    {!callEnded && (
                        <View style={styles.inputRow}>
                            <TouchableOpacity style={styles.addButton}>
                                <MaterialIcons name="add" size={22} color={COLORS.gray400} />
                            </TouchableOpacity>

                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder="Escribe un mensaje..."
                                    placeholderTextColor={COLORS.gray400}
                                    multiline
                                    maxLength={500}
                                />
                                <TouchableOpacity style={styles.micButton}>
                                    <MaterialIcons name="mic" size={20} color={COLORS.gray400} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.voiceButton}
                                onPress={handleSendMessage}
                                disabled={isSending}
                            >
                                <MaterialIcons
                                    name={inputText.trim() ? "send" : "graphic-eq"}
                                    size={28}
                                    color={inputText.trim() ? COLORS.primary : COLORS.white}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Post-call actions: Premium review prompt */}
                    {callEnded && (
                        <View style={styles.postCallContainer}>
                            {/* Success checkmark */}
                            <View style={styles.successCircle}>
                                <MaterialIcons name="check" size={40} color={COLORS.white} />
                            </View>

                            <Text style={styles.postCallTitle}>
                                Llamada finalizada
                            </Text>

                            <Text style={styles.postCallDuration}>
                                Duración: {callDuration}
                            </Text>

                            {/* Review prompt card */}
                            <View style={styles.reviewCard}>
                                {/* Star decoration */}
                                <View style={styles.starsRow}>
                                    <MaterialIcons name="star" size={24} color={COLORS.gold400} />
                                    <MaterialIcons name="star" size={28} color={COLORS.gold500} />
                                    <MaterialIcons name="star" size={32} color={COLORS.gold500} />
                                    <MaterialIcons name="star" size={28} color={COLORS.gold500} />
                                    <MaterialIcons name="star" size={24} color={COLORS.gold400} />
                                </View>

                                <Text style={styles.reviewCardTitle}>
                                    ¿Cómo fue tu experiencia?
                                </Text>

                                <Text style={styles.reviewCardSubtitle}>
                                    Tu opinión ayuda a {professionalName} a mejorar y a otros usuarios a elegir
                                </Text>

                                <TouchableOpacity
                                    style={styles.reviewButtonPrimary}
                                    onPress={() => {
                                        if (professionalId) {
                                            router.push(`/write-review/${professionalId}` as any);
                                        }
                                    }}
                                >
                                    <MaterialIcons name="rate-review" size={22} color={COLORS.textMain} />
                                    <Text style={styles.reviewButtonPrimaryText}>Escribir reseña</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Return button - secondary style */}
                            <TouchableOpacity
                                style={styles.returnButtonSecondary}
                                onPress={() => {
                                    if (professionalId) {
                                        router.replace(`/avatar-chat/${professionalId}` as any);
                                    } else {
                                        router.back();
                                    }
                                }}
                            >
                                <MaterialIcons name="smart-toy" size={18} color={COLORS.textMuted} />
                                <Text style={styles.returnButtonSecondaryText}>Volver al asistente</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <TouchableOpacity
                    style={styles.drawerOverlay}
                    activeOpacity={1}
                    onPress={closeDrawer}
                />
            )}

            {/* Drawer */}
            <Animated.View
                style={[
                    styles.drawer,
                    { transform: [{ translateX: drawerAnim }] },
                ]}
            >
                <View style={styles.drawerHeader}>
                    <Text style={styles.drawerTitle}>Historial</Text>
                    <TouchableOpacity onPress={closeDrawer}>
                        <MaterialIcons name="close" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={styles.drawerContent}>
                    <Text style={styles.drawerEmptyText}>
                        El historial de conversaciones estará disponible aquí
                    </Text>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textMuted,
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.gold500,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.white,
        fontWeight: "600",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    menuButton: {
        padding: 8,
    },
    professionalChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray50,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.gold500,
    },
    avatarSmallContainer: {
        position: "relative",
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarSmallPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicatorSmall: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    professionalChipText: {
        marginLeft: 8,
    },
    professionalChipName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    professionalChipRole: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    historyButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    videoContainer: {
        height: VIDEO_MAX_HEIGHT,
        backgroundColor: COLORS.black,
        position: "relative",
    },
    videoImage: {
        flex: 1,
    },
    goldBorder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 3,
        borderColor: COLORS.gold500,
        pointerEvents: "none",
    },
    callEndedContainer: {
        backgroundColor: COLORS.gray100,
        paddingVertical: 24,
        alignItems: "center",
    },
    callEndedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.red500,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    callEndedText: {
        color: COLORS.white,
        fontWeight: "600",
        fontSize: 14,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 24,
    },
    emptyChat: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
    },
    emptyChatText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    messageBubble: {
        maxWidth: "75%",
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    videoCallIndicator: {
        position: "absolute",
        top: 4,
        right: 4,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    userMessageRow: {
        justifyContent: "flex-end",
    },
    otherMessageRow: {
        justifyContent: "flex-start",
    },
    messageAvatarContainer: {
        marginRight: 8,
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.gold500,
    },
    messageAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray400,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.gold500,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userMessageText: {
        color: COLORS.textMain,
    },
    otherMessageText: {
        color: COLORS.textMain,
    },
    messageTime: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        backgroundColor: COLORS.surfaceLight,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    textInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: COLORS.white,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        minHeight: 44,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
    },
    micButton: {
        padding: 10,
    },
    voiceButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.black,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    postCallActions: {
        padding: 16,
        alignItems: "center",
    },
    returnButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gold500,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    returnButtonText: {
        color: COLORS.white,
        fontWeight: "600",
        fontSize: 15,
    },
    // Premium post-call styles
    postCallContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    successCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.green500,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        shadowColor: COLORS.green500,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    postCallTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textMain,
        marginBottom: 6,
    },
    postCallDuration: {
        fontSize: 15,
        color: COLORS.textMuted,
        marginBottom: 32,
    },
    reviewCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 20,
        padding: 28,
        alignItems: "center",
        width: "100%",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 24,
    },
    starsRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 4,
        marginBottom: 16,
    },
    reviewCardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
        textAlign: "center",
        marginBottom: 8,
    },
    reviewCardSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    reviewButtonPrimary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
    },
    reviewButtonPrimaryText: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    returnButtonSecondary: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 8,
    },
    returnButtonSecondaryText: {
        fontSize: 15,
        color: COLORS.textMuted,
        fontWeight: "500",
    },
    drawerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 10,
    },
    drawer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: SCREEN_WIDTH * 0.8,
        backgroundColor: COLORS.surfaceLight,
        zIndex: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    drawerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    drawerContent: {
        flex: 1,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    drawerEmptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
    },
});
