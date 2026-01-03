import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getProChats, ProChat } from "../../api/chat";

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
    orange500: "#f97316",
    red400: "#f87171",
    red500: "#ef4444",
    purple400: "#c084fc",
    indigo400: "#818cf8",
    pink400: "#f472b6",
    rose400: "#fb7185",
    blue400: "#60a5fa",
    teal400: "#2dd4bf",
};

// Helper to get avatar color based on index
const getAvatarColor = (index: number) => {
    const colors = [
        COLORS.purple400,
        COLORS.blue400,
        COLORS.pink400,
        COLORS.teal400,
        COLORS.orange400,
        COLORS.green400,
        COLORS.indigo400,
        COLORS.rose400,
    ];
    return colors[index % colors.length];
};

// Helper to format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][date.getDay()];
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export default function ProChatsScreen() {
    const { user, token } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [chats, setChats] = useState<ProChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterEscalated, setFilterEscalated] = useState(false);

    const loadChats = useCallback(async () => {
        if (!token || !user?._id) return;

        try {
            const data = await getProChats(token, user._id);
            setChats(data);
        } catch (error) {
            console.error("Error loading pro chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user?._id]);

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadChats();
    }, [loadChats]);

    function handleBack() {
        router.back();
    }

    // Filter and search chats
    const filteredChats = chats
        .filter(chat => {
            if (filterEscalated && !chat.isEscalated) return false;
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                chat.client.name.toLowerCase().includes(query) ||
                (chat.lastMessage?.toLowerCase().includes(query))
            );
        });

    const escalatedCount = chats.filter(c => c.isEscalated).length;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Chats Pro</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <MaterialIcons name="chat" size={18} color={COLORS.primary} />
                    <Text style={styles.statValue}>{chats.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={[styles.statItem, filterEscalated && styles.statItemActive]}
                    onPress={() => setFilterEscalated(!filterEscalated)}
                >
                    <MaterialIcons name="warning" size={18} color={COLORS.orange400} />
                    <Text style={[styles.statValue, { color: COLORS.orange400 }]}>{escalatedCount}</Text>
                    <Text style={styles.statLabel}>Escalados</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por cliente..."
                        placeholderTextColor={COLORS.gray500}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Chats List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando chats...</Text>
                </View>
            ) : filteredChats.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={64} color={COLORS.gray500} />
                    <Text style={styles.emptyTitle}>
                        {chats.length === 0
                            ? "Sin conversaciones"
                            : "No hay resultados"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {chats.length === 0
                            ? "Las conversaciones con tu gemelo digital aparecerán aquí"
                            : filterEscalated
                                ? "No hay chats escalados"
                                : "Prueba con otra búsqueda"}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    {filteredChats.map((chat, index) => (
                        <TouchableOpacity
                            key={chat._id}
                            style={[
                                styles.chatCard,
                                chat.isEscalated && styles.chatCardEscalated
                            ]}
                            onPress={() => {
                                router.push(`/pro-chat/${chat._id}` as any);
                            }}
                        >
                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}>
                                <Text style={styles.avatarText}>{chat.client.initials}</Text>
                                {chat.isEscalated && (
                                    <View style={styles.escalatedBadge}>
                                        <MaterialIcons name="warning" size={10} color="#FFFFFF" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.chatContent}>
                                <View style={styles.chatHeader}>
                                    <Text style={styles.chatName}>{chat.client.name}</Text>
                                    <Text style={styles.chatTime}>
                                        {formatDate(chat.lastMessageDate)}
                                    </Text>
                                </View>
                                <Text style={styles.chatPreview} numberOfLines={1}>
                                    {chat.lastMessage || "Sin mensajes"}
                                </Text>
                                <View style={styles.chatFooter}>
                                    {chat.isEscalated ? (
                                        <View style={styles.escalatedTag}>
                                            <MaterialIcons name="priority-high" size={12} color={COLORS.orange400} />
                                            <Text style={styles.escalatedTagText}>Requiere atención</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.normalTag}>
                                            <MaterialIcons name="smart-toy" size={12} color={COLORS.green400} />
                                            <Text style={styles.normalTagText}>Gestionado por IA</Text>
                                        </View>
                                    )}
                                    {chat.unreadCount > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        flex: 1,
        textAlign: "center",
    },
    statsBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
        backgroundColor: COLORS.surfaceDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statItemActive: {
        backgroundColor: "rgba(251, 146, 60, 0.1)",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.borderDark,
        marginHorizontal: 24,
    },
    searchSection: {
        backgroundColor: COLORS.backgroundDark,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    chatCardEscalated: {
        backgroundColor: "rgba(251, 146, 60, 0.05)",
        borderLeftWidth: 3,
        borderLeftColor: COLORS.orange400,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        position: "relative",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    escalatedBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.orange500,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.backgroundDark,
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    chatName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    chatTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    chatPreview: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    chatFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    escalatedTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: "rgba(251, 146, 60, 0.15)",
    },
    escalatedTagText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.orange400,
    },
    normalTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: "rgba(74, 222, 128, 0.1)",
    },
    normalTagText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.green400,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textMain,
    },
});
