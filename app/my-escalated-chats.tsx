import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context";
import { chatApi, getAssetUrl } from "../api";
import type { EscalatedChat } from "../api/chat";

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
};

type FilterType = "all" | "responded" | "pending";

function formatRelativeTime(dateString: string | undefined): string {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[date.getDay()];
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function MyEscalatedChatsScreen() {
    const { token } = useAuth();
    const [chats, setChats] = useState<EscalatedChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    const loadChats = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const data = await chatApi.getMyEscalatedChats(token);
            setChats(data);
        } catch (error) {
            console.error("[MyEscalatedChats] Error:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    const handleDeleteChat = (chatId: string) => {
        Alert.alert(
            'Eliminar consulta',
            '¿Quieres eliminar esta consulta escalada?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (token) {
                                await chatApi.deleteChat(token, chatId);
                                setChats(prev => prev.filter(c => c._id !== chatId));
                            }
                        } catch (err) {
                            console.error('[MyEscalatedChats] Error deleting:', err);
                        }
                    },
                },
            ]
        );
    };

    const filteredChats = chats.filter((chat) => {
        if (filter === "all") return true;
        const isResponded = chat.escalation.status === 'accepted' && chat.isLastFromProfessional;
        if (filter === "responded") return isResponded;
        if (filter === "pending") return !isResponded;
        return true;
    });

    const respondedCount = chats.filter(c => c.escalation.status === 'accepted' && c.isLastFromProfessional).length;
    const pendingCount = chats.length - respondedCount;

    const renderChatRow = ({ item }: { item: EscalatedChat }) => {
        const avatarUrl = getAssetUrl(item.professional.avatar);
        const isResponded = item.escalation.status === 'accepted' && item.isLastFromProfessional;

        return (
            <TouchableOpacity
                style={styles.chatRow}
                activeOpacity={0.95}
                onPress={() => router.push(`/escalated-chat/${item._id}` as any)}
                onLongPress={() => handleDeleteChat(item._id)}
                delayLongPress={600}
            >
                <View style={styles.chatAvatar}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.chatAvatarImage} />
                    ) : (
                        <MaterialIcons name="person" size={26} color={COLORS.gray} />
                    )}
                    <View style={[
                        styles.chatAvatarDot,
                        { backgroundColor: isResponded ? COLORS.green : COLORS.orange }
                    ]} />
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatTop}>
                        <Text style={styles.chatName} numberOfLines={1}>
                            {item.professional.name}
                        </Text>
                        <Text style={styles.chatTime}>
                            {formatRelativeTime(item.lastMessageDate)}
                        </Text>
                    </View>
                    <View style={styles.chatMiddle}>
                        <Text style={styles.chatProfession} numberOfLines={1}>
                            {item.professional.profession}
                        </Text>
                        {/* Status indicator — small dot + text, NOT a pill badge */}
                        <View style={styles.chatStatusRow}>
                            <View style={[
                                styles.chatStatusDot,
                                { backgroundColor: isResponded ? COLORS.green : COLORS.orange }
                            ]} />
                            <Text style={[
                                styles.chatStatusLabel,
                                { color: isResponded ? COLORS.green : COLORS.orange }
                            ]}>
                                {isResponded ? 'Respondido' : 'Pendiente'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                        {item.lastMessage || "Sin mensajes aún"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const filters: { key: FilterType; label: string; count?: number }[] = [
        { key: "all", label: "Todos", count: chats.length },
        { key: "responded", label: "Respondidos", count: respondedCount },
        { key: "pending", label: "Pendientes", count: pendingCount },
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <MaterialIcons name="support-agent" size={20} color={COLORS.orange} />
                    <Text style={styles.headerTitle}>Mis Consultas</Text>
                </View>
                <View style={styles.headerBack} />
            </View>

            {/* Filter pills — compact, single row */}
            <View style={styles.filterRow}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.filterPill,
                            filter === f.key && styles.filterPillActive,
                        ]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[
                            styles.filterPillText,
                            filter === f.key && styles.filterPillTextActive,
                        ]}>
                            {f.label}
                            {f.count !== undefined ? ` (${f.count})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredChats}
                    renderItem={renderChatRow}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <MaterialIcons name="support-agent" size={40} color={COLORS.gray} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {filter === "all"
                                    ? "No tienes consultas activas"
                                    : filter === "responded"
                                        ? "No hay consultas respondidas"
                                        : "No hay consultas pendientes"}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                Cuando escales una conversación con un profesional, aparecerá aquí.
                            </Text>
                        </View>
                    }
                />
            )}
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
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerBack: {
        padding: 4,
        width: 40,
        alignItems: "center",
    },
    headerCenter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.black,
    },

    // Filters — compact horizontal row (no ScrollView needed)
    filterRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    filterPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.grayLight,
    },
    filterPillActive: {
        backgroundColor: COLORS.black,
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.grayMedium,
    },
    filterPillTextActive: {
        color: COLORS.white,
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
    },

    // Chat row
    chatRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    chatAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.grayLight,
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
    chatAvatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    chatAvatarDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: COLORS.white,
        position: "absolute",
        bottom: -1,
        right: -1,
    },
    chatContent: {
        flex: 1,
        gap: 3,
    },
    chatTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    chatName: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.black,
        flex: 1,
        marginRight: 8,
    },
    chatTime: {
        fontSize: 11,
        color: COLORS.gray,
    },
    chatMiddle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatProfession: {
        fontSize: 12,
        color: COLORS.grayMedium,
        flex: 1,
    },
    // Status: dot + text (NOT a pill badge — avoids confusion with profession badge)
    chatStatusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    chatStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chatStatusLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
    chatPreview: {
        fontSize: 13,
        color: COLORS.gray,
        lineHeight: 18,
    },

    // Empty state
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.black,
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.grayMedium,
        textAlign: "center",
        lineHeight: 20,
    },
});
