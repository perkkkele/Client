import { router } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getProChats, ProChat } from "../../api/chat";
import { getAssetUrl } from "../../api";

const COLORS = {
    primary: "#f9f506",
    primaryDark: "#EAB308",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    white: "#FFFFFF",
    green400: "#4ade80",
    green500: "#22c55e",
    orange400: "#fb923c",
    orange500: "#f97316",
    purple400: "#c084fc",
    indigo400: "#818cf8",
    pink400: "#f472b6",
    blue400: "#60a5fa",
    teal400: "#2dd4bf",
    rose400: "#fb7185",
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

// Group chats by client
interface ClientGroup {
    clientId: string;
    clientName: string;
    clientInitials: string;
    clientAvatar?: string;
    clientEmail?: string;
    chats: ProChat[];
    hasEscalated: boolean;
    escalatedCount: number;
    totalUnread: number;
    lastMessageDate: string;
}

export default function ProChatsScreen() {
    const { user, token } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [chats, setChats] = useState<ProChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterEscalated, setFilterEscalated] = useState(false);
    const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

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

    // Group chats by client
    const clientGroups = useMemo(() => {
        const groups: Map<string, ClientGroup> = new Map();

        chats.forEach(chat => {
            const clientId = chat.client._id;
            if (!groups.has(clientId)) {
                groups.set(clientId, {
                    clientId,
                    clientName: chat.client.name,
                    clientInitials: chat.client.initials,
                    clientAvatar: chat.client.avatar,
                    clientEmail: chat.client.email,
                    chats: [],
                    hasEscalated: false,
                    escalatedCount: 0,
                    totalUnread: 0,
                    lastMessageDate: chat.lastMessageDate,
                });
            }

            const group = groups.get(clientId)!;
            group.chats.push(chat);
            if (chat.isEscalated) {
                group.hasEscalated = true;
                group.escalatedCount++;
            }
            group.totalUnread += chat.unreadCount || 0;
            if (new Date(chat.lastMessageDate) > new Date(group.lastMessageDate)) {
                group.lastMessageDate = chat.lastMessageDate;
            }
        });

        // Sort chats within each group (newest first)
        groups.forEach(group => {
            group.chats.sort((a, b) =>
                new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
            );
        });

        // Convert to array and sort (escalated first, then by date)
        return Array.from(groups.values()).sort((a, b) => {
            if (a.hasEscalated && !b.hasEscalated) return -1;
            if (!a.hasEscalated && b.hasEscalated) return 1;
            return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
        });
    }, [chats]);

    // Auto-expand clients with escalated chats
    useEffect(() => {
        const escalatedClientIds = clientGroups
            .filter(g => g.hasEscalated)
            .map(g => g.clientId);
        if (escalatedClientIds.length > 0) {
            setExpandedClients(prev => {
                const newSet = new Set(prev);
                escalatedClientIds.forEach(id => newSet.add(id));
                return newSet;
            });
        }
    }, [clientGroups]);

    // Filter groups
    const filteredGroups = useMemo(() => {
        return clientGroups.filter(group => {
            if (filterEscalated && !group.hasEscalated) return false;
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return group.clientName.toLowerCase().includes(query) ||
                group.clientEmail?.toLowerCase().includes(query);
        });
    }, [clientGroups, filterEscalated, searchQuery]);

    const toggleClient = (clientId: string) => {
        setExpandedClients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(clientId)) {
                newSet.delete(clientId);
            } else {
                newSet.add(clientId);
            }
            return newSet;
        });
    };

    function handleBack() {
        router.back();
    }

    const totalClients = clientGroups.length;
    const escalatedClients = clientGroups.filter(g => g.hasEscalated).length;

    const getAvatarUrl = (avatar: string | undefined) => {
        return getAssetUrl(avatar);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Conversaciones del Gemelo</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <MaterialIcons name="people" size={18} color={COLORS.primaryDark} />
                    <Text style={styles.statValue}>{totalClients}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={[styles.statItem, filterEscalated && styles.statItemActive]}
                    onPress={() => setFilterEscalated(!filterEscalated)}
                >
                    <MaterialIcons name="support-agent" size={18} color={COLORS.orange500} />
                    <Text style={[styles.statValue, { color: COLORS.orange500 }]}>{escalatedClients}</Text>
                    <Text style={styles.statLabel}>Escalados</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cliente..."
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryDark} />
                    <Text style={styles.loadingText}>Cargando conversaciones...</Text>
                </View>
            ) : filteredGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={64} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>
                        {chats.length === 0 ? "Sin conversaciones" : "No hay resultados"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {chats.length === 0
                            ? "Las conversaciones con tu gemelo digital aparecerán aquí"
                            : filterEscalated
                                ? "No hay clientes con chats escalados"
                                : "Prueba con otra búsqueda"}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primaryDark}
                        />
                    }
                >
                    <Text style={styles.sectionTitle}>CLIENTES</Text>

                    {filteredGroups.map((group, groupIndex) => {
                        const isExpanded = expandedClients.has(group.clientId);
                        const avatarUrl = getAvatarUrl(group.clientAvatar);

                        return (
                            <View key={group.clientId} style={styles.clientCard}>
                                {/* Client Header */}
                                <TouchableOpacity
                                    style={[
                                        styles.clientHeader,
                                        group.hasEscalated && styles.clientHeaderEscalated
                                    ]}
                                    onPress={() => toggleClient(group.clientId)}
                                    activeOpacity={0.7}
                                >
                                    {/* Avatar */}
                                    {avatarUrl ? (
                                        <Image
                                            source={{ uri: avatarUrl }}
                                            style={styles.clientAvatar}
                                        />
                                    ) : (
                                        <View style={[styles.clientAvatarPlaceholder, { backgroundColor: getAvatarColor(groupIndex) }]}>
                                            <Text style={styles.clientAvatarText}>{group.clientInitials}</Text>
                                        </View>
                                    )}

                                    {/* Info */}
                                    <View style={styles.clientInfo}>
                                        <View style={styles.clientNameRow}>
                                            <Text style={styles.clientName}>{group.clientName}</Text>
                                            {group.hasEscalated && (
                                                <View style={styles.escalatedBadge}>
                                                    <MaterialIcons name="person" size={12} color={COLORS.white} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.clientMeta}>
                                            {group.chats.length} hilo{group.chats.length !== 1 ? 's' : ''}
                                            {group.escalatedCount > 0 && ` · ${group.escalatedCount} escalado${group.escalatedCount !== 1 ? 's' : ''}`}
                                        </Text>
                                    </View>

                                    {/* Right side */}
                                    <View style={styles.clientRight}>
                                        {group.totalUnread > 0 && (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadText}>{group.totalUnread}</Text>
                                            </View>
                                        )}
                                        <MaterialIcons
                                            name={isExpanded ? "expand-less" : "expand-more"}
                                            size={24}
                                            color={COLORS.gray400}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Expanded Threads */}
                                {isExpanded && (
                                    <View style={styles.threadsContainer}>
                                        {group.chats.map((chat, chatIndex) => (
                                            <TouchableOpacity
                                                key={chat._id}
                                                style={[
                                                    styles.threadRow,
                                                    chatIndex === group.chats.length - 1 && styles.threadRowLast,
                                                    chat.isEscalated && styles.threadRowEscalated
                                                ]}
                                                onPress={() => router.push(`/pro-chat/${chat._id}` as any)}
                                            >
                                                {/* Escalated indicator bar */}
                                                {chat.isEscalated && <View style={styles.escalatedBar} />}

                                                <View style={[styles.threadIconContainer, chat.isEscalated && styles.threadIconEscalated]}>
                                                    {chat.isEscalated ? (
                                                        <MaterialIcons name="support-agent" size={16} color={COLORS.white} />
                                                    ) : (
                                                        <MaterialIcons name="chat-bubble-outline" size={16} color={COLORS.gray400} />
                                                    )}
                                                </View>
                                                <View style={styles.threadContent}>
                                                    <View style={styles.threadHeader}>
                                                        <Text style={[styles.threadPreview, chat.isEscalated && styles.threadPreviewEscalated]} numberOfLines={1}>
                                                            {chat.lastMessage || "Sin mensajes"}
                                                        </Text>
                                                        {chat.isEscalated && (
                                                            <View style={styles.escalatedPill}>
                                                                <Text style={styles.escalatedPillText}>Requiere atención</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View style={styles.threadMeta}>
                                                        <Text style={styles.threadDate}>
                                                            {formatDate(chat.lastMessageDate)}
                                                        </Text>
                                                        {chat.isEscalated && chat.escalatedReason && (
                                                            <Text style={styles.escalatedReason} numberOfLines={1}>
                                                                → {chat.escalatedReason}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                                <MaterialIcons name="chevron-right" size={20} color={chat.isEscalated ? COLORS.orange500 : COLORS.gray300} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
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
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 17,
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
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statItemActive: {
        backgroundColor: "rgba(249, 115, 22, 0.1)",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.gray200,
        marginHorizontal: 24,
    },
    searchSection: {
        backgroundColor: COLORS.surfaceLight,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 12,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textMuted,
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
        color: COLORS.textMuted,
        textAlign: "center",
    },
    // Client Card
    clientCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    clientHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    clientHeaderEscalated: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.orange500,
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    clientAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    clientAvatarText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    clientInfo: {
        flex: 1,
    },
    clientNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    clientName: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    escalatedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.orange500,
        alignItems: "center",
        justifyContent: "center",
    },
    clientMeta: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    clientRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.primaryDark,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    // Threads
    threadsContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        backgroundColor: COLORS.gray100,
    },
    threadRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surfaceLight,
        marginHorizontal: 8,
        marginTop: 1,
        borderRadius: 8,
        gap: 10,
    },
    threadRowLast: {
        marginBottom: 8,
    },
    threadRowEscalated: {
        backgroundColor: "rgba(249, 115, 22, 0.05)",
    },
    threadIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    threadContent: {
        flex: 1,
    },
    threadPreview: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    threadMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    threadDate: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    escalatedTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: "rgba(249, 115, 22, 0.15)",
    },
    escalatedTagText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.orange500,
    },
    escalatedReason: {
        fontSize: 11,
        color: COLORS.orange500,
        fontStyle: "italic",
    },
    // Enhanced escalated thread styles
    escalatedBar: {
        position: "absolute",
        left: 0,
        top: 4,
        bottom: 4,
        width: 3,
        backgroundColor: COLORS.orange500,
        borderRadius: 2,
    },
    threadIconEscalated: {
        backgroundColor: COLORS.orange500,
    },
    threadHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    threadPreviewEscalated: {
        flex: 1,
        fontWeight: "500",
    },
    escalatedPill: {
        backgroundColor: COLORS.orange500,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    escalatedPillText: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.white,
    },
});
