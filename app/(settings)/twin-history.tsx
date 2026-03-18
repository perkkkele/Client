import { router } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
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
import { getAvatarChats, AvatarConversation } from "../../api/chat";

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
    purple400: "#c084fc",
    indigo400: "#818cf8",
    pink400: "#f472b6",
    rose400: "#fb7185",
    blue400: "#60a5fa",
    teal400: "#2dd4bf",
};

const LOCALE_MAP: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
};

const PAGE_SIZE = 20;

// Helper to get gradient color based on index
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

// Helper to filter by date range
const filterByDateRange = (conversations: AvatarConversation[], filterIndex: number) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return conversations.filter(conv => {
        const convDate = new Date(conv.lastMessageDate);

        switch (filterIndex) {
            case 0:
                return convDate >= today;
            case 1:
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return convDate >= weekAgo;
            case 2:
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return convDate >= monthAgo;
            default:
                return true;
        }
    });
};

export default function TwinHistoryScreen() {
    const { user, token } = useAuth();
    const { t, i18n } = useTranslation('settings');
    const locale = LOCALE_MAP[i18n.language] || 'es-ES';

    const FILTERS = [t('twinHistory.filterToday'), t('twinHistory.filterLast7'), t('twinHistory.filterLastMonth'), t('twinHistory.filterAll')];

    // Helper to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('twinHistory.now');
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return t('twinHistory.yesterday');
        if (diffDays < 7) {
            const dayNames = t('twinHistory.dayNames', { returnObjects: true }) as string[];
            return dayNames[date.getDay()];
        }
        return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
    };

    const [activeFilter, setActiveFilter] = useState(3); // "All" by default
    const [searchQuery, setSearchQuery] = useState("");
    const [conversations, setConversations] = useState<AvatarConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const nextCursorRef = useRef<string | undefined>(undefined);

    const loadConversations = useCallback(async (isRefresh = false) => {
        if (!token || !user?._id) return;

        try {
            if (isRefresh) {
                nextCursorRef.current = undefined;
            }

            const result = await getAvatarChats(token, user._id, {
                limit: PAGE_SIZE,
                cursor: isRefresh ? undefined : undefined,
            });

            setConversations(result.conversations);
            setHasMore(result.hasMore);
            nextCursorRef.current = result.nextCursor;
        } catch (error) {
            console.error("Error loading avatar conversations:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user?._id]);

    const loadMore = useCallback(async () => {
        if (!token || !user?._id || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const result = await getAvatarChats(token, user._id, {
                limit: PAGE_SIZE,
                cursor: nextCursorRef.current,
            });

            setConversations(prev => [...prev, ...result.conversations]);
            setHasMore(result.hasMore);
            nextCursorRef.current = result.nextCursor;
        } catch (error) {
            console.error("Error loading more conversations:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [token, user?._id, hasMore, loadingMore]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadConversations(true);
    }, [loadConversations]);

    function handleBack() {
        router.back();
    }

    // Filter and search conversations (applied client-side over loaded data)
    const filteredConversations = filterByDateRange(conversations, activeFilter)
        .filter(conv => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                conv.client.name.toLowerCase().includes(query) ||
                conv.preview.toLowerCase().includes(query)
            );
        });

    const renderConversationItem = useCallback(({ item, index }: { item: AvatarConversation; index: number }) => (
        <TouchableOpacity
            key={item._id}
            style={styles.conversationCard}
            onPress={() => {
                console.log("View conversation:", item._id);
            }}
        >
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}>
                <Text style={styles.avatarText}>{item.client.initials}</Text>
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{item.client.name}</Text>
                    <Text style={styles.conversationTime}>
                        {formatDate(item.lastMessageDate)}
                    </Text>
                </View>
                <Text style={styles.conversationPreview} numberOfLines={2}>
                    {item.preview}
                </Text>
                <View style={styles.conversationFooter}>
                    <View style={[
                        styles.statusBadge,
                        item.status === "resolved" ? styles.statusResolved : styles.statusEscalated
                    ]}>
                        <MaterialIcons
                            name={item.status === "resolved" ? "smart-toy" : "warning"}
                            size={12}
                            color={item.status === "resolved" ? COLORS.green400 : COLORS.orange400}
                        />
                        <Text style={[
                            styles.statusText,
                            { color: item.status === "resolved" ? COLORS.green400 : COLORS.orange400 }
                        ]}>
                            {item.status === "resolved" ? t('twinHistory.resolvedByAI') : t('twinHistory.escalated')}
                        </Text>
                    </View>
                    <Text style={styles.messageCount}>
                        {t('twinHistory.messages', { count: item.messageCount })}
                    </Text>
                </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
        </TouchableOpacity>
    ), []);

    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>{t('twinHistory.loadingMore')}</Text>
            </View>
        );
    }, [loadingMore]);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('twinHistory.headerTitle')}</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Search and Filters */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('twinHistory.searchPlaceholder')}
                        placeholderTextColor={COLORS.gray500}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.filtersRow}>
                    {FILTERS.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.filterButton,
                                activeFilter === index && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveFilter(index)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === index && styles.filterTextActive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Conversations List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>{t('twinHistory.loading')}</Text>
                </View>
            ) : filteredConversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={64} color={COLORS.gray500} />
                    <Text style={styles.emptyTitle}>
                        {conversations.length === 0
                            ? t('twinHistory.emptyTitle')
                            : t('twinHistory.noResults')}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {conversations.length === 0
                            ? t('twinHistory.emptySubtitle')
                            : t('twinHistory.noResultsHint')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item._id}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
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
    searchSection: {
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
        paddingBottom: 12,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 12,
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
    filtersRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.surfaceDark,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    filterTextActive: {
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
    loadingMoreContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        gap: 8,
    },
    loadingMoreText: {
        fontSize: 12,
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
    conversationCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    conversationTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    conversationPreview: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 8,
    },
    conversationFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    statusResolved: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgba(34, 197, 94, 0.2)",
    },
    statusEscalated: {
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderColor: "rgba(249, 115, 22, 0.2)",
    },
    statusText: {
        fontSize: 10,
        fontWeight: "500",
    },
    messageCount: {
        fontSize: 11,
        color: COLORS.gray500,
    },
});
