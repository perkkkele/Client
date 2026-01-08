/**
 * Client Chat History Screen
 * 
 * Shows all chat threads between a specific client and the professional's digital twin.
 */

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";
import * as chatApi from "../../api/chat";

const COLORS = {
    primary: "#4F46E5",
    primaryLight: "#EEF2FF",
    backgroundLight: "#f3f4f6",
    surfaceLight: "#FFFFFF",
    textMain: "#1F2937",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    purple50: "#faf5ff",
    purple600: "#9333ea",
    purple700: "#7c3aed",
    green50: "#f0fdf4",
    green500: "#22c55e",
};

interface ChatThread {
    _id: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        sender: string;
    };
    participants: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function ClientChatHistoryScreen() {
    const { clientId } = useLocalSearchParams<{ clientId: string }>();
    const { token, user } = useAuth();
    const [chats, setChats] = useState<ChatThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clientInfo, setClientInfo] = useState<{
        firstname: string;
        lastname: string;
        avatar?: string;
    } | null>(null);

    const loadChats = useCallback(async () => {
        if (!token || !clientId) return;

        try {
            // Get all chats for the professional
            const allChats = await chatApi.getChats(token);

            // Filter chats that include this specific client
            const clientChats = (allChats as any[]).filter((chat: any) =>
                chat.participants?.some((p: any) => p._id === clientId)
            );

            // Get client info from first chat
            if (clientChats.length > 0) {
                const client = clientChats[0].participants.find(p => p._id === clientId);
                if (client) {
                    setClientInfo({
                        firstname: client.firstname,
                        lastname: client.lastname,
                        avatar: client.avatar,
                    });
                }
            }

            // Sort by most recent
            clientChats.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            setChats(clientChats);
        } catch (error: any) {
            console.error("[ClientChatHistory] Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, clientId]);

    useFocusEffect(
        useCallback(() => {
            loadChats();
        }, [loadChats])
    );

    const handleOpenChat = (chatId: string) => {
        router.push(`/pro-chat/${chatId}` as any);
    };

    const getClientInitials = () => {
        if (!clientInfo) return "?";
        const first = clientInfo.firstname?.charAt(0) || "";
        const last = clientInfo.lastname?.charAt(0) || "";
        return (first + last).toUpperCase() || "?";
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Historial de Chats</Text>
                    {clientInfo && (
                        <Text style={styles.headerSubtitle}>
                            con {clientInfo.firstname} {clientInfo.lastname}
                        </Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando conversaciones...</Text>
                </View>
            ) : chats.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialIcons name="chat-bubble-outline" size={64} color={COLORS.gray300} />
                    </View>
                    <Text style={styles.emptyTitle}>Sin conversaciones</Text>
                    <Text style={styles.emptySubtitle}>
                        Este cliente aún no ha conversado con tu gemelo digital
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Client Info Card */}
                    {clientInfo && (
                        <View style={styles.clientCard}>
                            {clientInfo.avatar ? (
                                <Image
                                    source={{ uri: getAssetUrl(clientInfo.avatar) || undefined }}
                                    style={styles.clientAvatar}
                                />
                            ) : (
                                <View style={[styles.clientAvatar, styles.clientInitialsContainer]}>
                                    <Text style={styles.clientInitials}>{getClientInitials()}</Text>
                                </View>
                            )}
                            <View style={styles.clientCardInfo}>
                                <Text style={styles.clientName}>
                                    {clientInfo.firstname} {clientInfo.lastname}
                                </Text>
                                <Text style={styles.clientStats}>
                                    {chats.length} conversación{chats.length > 1 ? "es" : ""} con tu gemelo digital
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Chat Threads */}
                    <Text style={styles.sectionTitle}>Conversaciones</Text>
                    {chats.map((chat) => (
                        <TouchableOpacity
                            key={chat._id}
                            style={styles.chatCard}
                            onPress={() => handleOpenChat(chat._id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.chatIconContainer}>
                                <MaterialIcons name="smart-toy" size={24} color={COLORS.purple600} />
                            </View>
                            <View style={styles.chatContent}>
                                <View style={styles.chatHeader}>
                                    <Text style={styles.chatTitle}>Chat con Gemelo Digital</Text>
                                    <Text style={styles.chatTime}>
                                        {formatRelativeTime(chat.updatedAt)}
                                    </Text>
                                </View>
                                {chat.lastMessage ? (
                                    <Text style={styles.chatPreview} numberOfLines={2}>
                                        {chat.lastMessage.content}
                                    </Text>
                                ) : (
                                    <Text style={styles.chatPreviewEmpty}>Sin mensajes</Text>
                                )}
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray300} />
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerContent: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    clientCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    clientAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.purple50,
    },
    clientInitialsContainer: {
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    clientInitials: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    clientCardInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientStats: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    chatIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.purple50,
        alignItems: "center",
        justifyContent: "center",
    },
    chatContent: {
        flex: 1,
        marginLeft: 12,
    },
    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    chatTime: {
        fontSize: 11,
        color: COLORS.gray400,
    },
    chatPreview: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 4,
        lineHeight: 18,
    },
    chatPreviewEmpty: {
        fontSize: 13,
        color: COLORS.gray400,
        fontStyle: "italic",
        marginTop: 4,
    },
});
