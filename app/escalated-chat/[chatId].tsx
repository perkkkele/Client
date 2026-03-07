import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { chatApi, chatMessageApi, getAssetUrl } from "../../api";
import type { ChatMessage } from "../../api/chatMessage";

const COLORS = {
    primary: "#137fec",
    black: "#111418",
    white: "#FFFFFF",
    background: "#f6f7f8",
    gray: "#9CA3AF",
    grayLight: "#f1f5f9",
    grayMedium: "#64748B",
    green: "#16A34A",
    greenBg: "#DCFCE7",
    orange: "#EA580C",
    orangeBg: "#FFF7ED",
    proBubble: "#EFF6FF",
    proBorder: "#3B82F6",
    userBubble: "#111418",
    botBubble: "#f1f5f9",
};

export default function EscalatedChatDetailScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { token, user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatData, setChatData] = useState<any>(null);
    const [professionalName, setProfessionalName] = useState("Profesional");
    const [professionalAvatar, setProfessionalAvatar] = useState<string | null>(null);
    const [profession, setProfession] = useState("");
    const [escalationStatus, setEscalationStatus] = useState<string>("pending");
    const flatListRef = useRef<FlatList>(null);

    const loadData = useCallback(async () => {
        if (!token || !chatId) return;

        try {
            setLoading(true);

            // Load chat details and messages in parallel
            const [chat, msgs] = await Promise.all([
                chatApi.getChat(token, chatId),
                chatMessageApi.getMessages(token, chatId),
            ]);

            setChatData(chat);

            // Deduplicate: avatar-chat voice pipeline sometimes saves the same
            // user message twice (voice transcription + text save).
            const sorted = msgs.reverse(); // oldest first
            const deduplicated = sorted.filter((msg: ChatMessage, i: number) => {
                if (i === 0) return true;
                const prev = sorted[i - 1];
                if (
                    msg.message === prev.message &&
                    msg.user === prev.user &&
                    msg.isFromBot === prev.isFromBot &&
                    msg.isFromProfessional === prev.isFromProfessional &&
                    Math.abs(new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 5000
                ) {
                    return false;
                }
                return true;
            });
            setMessages(deduplicated);

            // Determine the professional (participant_two for client chats)
            const pro = typeof chat.participant_two === 'object' ? chat.participant_two : null;
            if (pro) {
                setProfessionalName(
                    (pro as any).publicName ||
                    `${(pro as any).firstname || ''} ${(pro as any).lastname || ''}`.trim() ||
                    'Profesional'
                );
                setProfessionalAvatar(getAssetUrl((pro as any).avatar) || null);
                setProfession((pro as any).profession || '');
            }

            // Get escalation status
            setEscalationStatus((chat as any).escalation?.status || 'pending');
        } catch (error) {
            console.error('[EscalatedChatDetail] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [token, chatId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const hasProResponse = messages.some(m => m.isFromProfessional);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUserMessage = item.user === user?._id ||
            (typeof item.user === 'object' && (item.user as any)?._id === user?._id);
        const isFromPro = item.isFromProfessional === true;
        const isFromBot = item.isFromBot === true && !isFromPro;

        if (isUserMessage && !isFromBot && !isFromPro) {
            // User's own message
            return (
                <View style={styles.messageRowRight}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userBubbleText}>{item.message}</Text>
                        <Text style={styles.messageTime}>
                            {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            );
        }

        if (isFromPro) {
            // Professional's response — highlighted
            return (
                <View style={styles.messageRowLeft}>
                    <View style={styles.proIndicator}>
                        <MaterialIcons name="verified-user" size={14} color={COLORS.proBorder} />
                    </View>
                    <View style={styles.proBubble}>
                        <View style={styles.proBubbleHeader}>
                            <Text style={styles.proLabel}>
                                {professionalName}
                            </Text>
                            <View style={styles.proLabelBadge}>
                                <Text style={styles.proLabelBadgeText}>PRO</Text>
                            </View>
                        </View>
                        <Text style={styles.proBubbleText}>{item.message}</Text>
                        <Text style={styles.messageTimePro}>
                            {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            );
        }

        // Bot/twin message
        return (
            <View style={styles.messageRowLeft}>
                <View style={styles.botIndicator}>
                    <MaterialIcons name="smart-toy" size={14} color={COLORS.gray} />
                </View>
                <View style={styles.botBubble}>
                    <Text style={styles.botBubbleText}>{item.message}</Text>
                    <Text style={styles.messageTimeBot}>
                        {new Date(item.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        {professionalAvatar ? (
                            <Image source={{ uri: professionalAvatar }} style={styles.headerAvatarImage} />
                        ) : (
                            <MaterialIcons name="person" size={22} color={COLORS.gray} />
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerName} numberOfLines={1}>{professionalName}</Text>
                        {profession ? (
                            <Text style={styles.headerProfession} numberOfLines={1}>{profession}</Text>
                        ) : null}
                    </View>
                </View>

                <View style={[
                    styles.headerStatusPill,
                    { backgroundColor: hasProResponse ? COLORS.greenBg : COLORS.orangeBg }
                ]}>
                    <View style={[
                        styles.headerStatusDot,
                        { backgroundColor: hasProResponse ? COLORS.green : COLORS.orange }
                    ]} />
                    <Text style={[
                        styles.headerStatusText,
                        { color: hasProResponse ? COLORS.green : COLORS.orange }
                    ]}>
                        {hasProResponse ? 'Respondido' : 'Pendiente'}
                    </Text>
                </View>
            </View>

            {/* Escalation info banner */}
            <View style={styles.infoBanner}>
                <MaterialIcons name="support-agent" size={16} color={COLORS.primary} />
                <Text style={styles.infoBannerText}>
                    {hasProResponse
                        ? 'El profesional ha respondido a tu consulta'
                        : 'Tu consulta ha sido enviada al profesional. Recibirás una notificación cuando responda.'}
                </Text>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.messagesContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <MaterialIcons name="chat-bubble-outline" size={40} color={COLORS.grayLight} />
                            <Text style={styles.emptyMessagesText}>No hay mensajes</Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        gap: 8,
    },
    headerBack: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.grayLight,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    headerAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    headerText: {
        flex: 1,
    },
    headerName: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.black,
    },
    headerProfession: {
        fontSize: 12,
        color: COLORS.grayMedium,
        marginTop: 1,
    },
    headerStatusPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    headerStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    headerStatusText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },

    // Info banner
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#eff6ff",
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.primary,
        lineHeight: 16,
    },

    // Messages
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        gap: 8,
    },
    messageRowRight: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 4,
    },
    messageRowLeft: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-end",
        gap: 6,
        marginBottom: 4,
    },

    // User bubble
    userBubble: {
        maxWidth: "75%",
        backgroundColor: COLORS.userBubble,
        borderRadius: 18,
        borderBottomRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    userBubbleText: {
        fontSize: 14,
        color: COLORS.white,
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        color: "rgba(255,255,255,0.6)",
        marginTop: 4,
        textAlign: "right",
    },

    // Professional bubble — highlighted
    proBubble: {
        maxWidth: "78%",
        backgroundColor: COLORS.proBubble,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.2)",
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    proBubbleHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    proLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.proBorder,
    },
    proLabelBadge: {
        backgroundColor: COLORS.proBorder,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    proLabelBadgeText: {
        fontSize: 8,
        fontWeight: "800",
        color: COLORS.white,
    },
    proBubbleText: {
        fontSize: 14,
        color: COLORS.black,
        lineHeight: 20,
    },
    messageTimePro: {
        fontSize: 10,
        color: COLORS.proBorder,
        marginTop: 4,
        textAlign: "right",
        opacity: 0.6,
    },
    proIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.proBubble,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },

    // Bot bubble
    botBubble: {
        maxWidth: "75%",
        backgroundColor: COLORS.botBubble,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    botBubbleText: {
        fontSize: 14,
        color: COLORS.black,
        lineHeight: 20,
    },
    messageTimeBot: {
        fontSize: 10,
        color: COLORS.gray,
        marginTop: 4,
        textAlign: "right",
    },
    botIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.grayLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },

    // Empty
    emptyMessages: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 8,
    },
    emptyMessagesText: {
        fontSize: 14,
        color: COLORS.gray,
    },
});
