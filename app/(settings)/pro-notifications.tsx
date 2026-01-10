import { router } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { notificationsApi, Notification } from "../../api/notifications";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    white: "#FFFFFF",
    green500: "#22c55e",
    green50: "#f0fdf4",
    orange500: "#f97316",
    orange50: "#fff7ed",
    blue500: "#3b82f6",
    blue50: "#eff6ff",
    purple500: "#8B5CF6",
    purple50: "#f5f3ff",
    red500: "#EF4444",
    red50: "#fef2f2",
};

const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
        case "escalation":
            return { icon: "support-agent", bg: COLORS.orange50, color: COLORS.orange500 };
        case "appointment":
            return { icon: "calendar-today", bg: COLORS.blue50, color: COLORS.blue500 };
        case "review":
            return { icon: "star", bg: COLORS.purple50, color: COLORS.purple500 };
        case "earnings":
            return { icon: "payments", bg: COLORS.green50, color: COLORS.green500 };
        case "billing":
            return { icon: "receipt-long", bg: COLORS.red50, color: COLORS.red500 };
        case "system":
        default:
            return { icon: "info", bg: COLORS.gray100, color: COLORS.gray500 };
    }
};

const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

export default function ProNotificationsScreen() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const loadNotifications = useCallback(async () => {
        if (!token || !user?._id) return;

        try {
            const result = await notificationsApi.getNotifications(token, user._id);
            if (result) {
                setNotifications(result.notifications);
            }
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [token, user?._id]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleBack = () => {
        router.back();
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    const markAsRead = async (id: string) => {
        if (!token) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );

        await notificationsApi.markAsRead(token, id);
    };

    const markAllAsRead = async () => {
        if (!token || !user?._id) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        await notificationsApi.markAllAsRead(token, user._id);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
                        <MaterialIcons name="done-all" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerButton} />
                )}
            </View>

            {/* Unread Counter */}
            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <MaterialIcons name="notifications-active" size={18} color={COLORS.primary} />
                    <Text style={styles.unreadBannerText}>
                        {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
                    </Text>
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="notifications-none" size={64} color={COLORS.gray300} />
                            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                            <Text style={styles.emptySubtitle}>
                                Las notificaciones de tu actividad aparecerán aquí
                            </Text>
                        </View>
                    ) : (
                        notifications.map((notification) => {
                            const iconStyle = getNotificationIcon(notification.type);
                            return (
                                <TouchableOpacity
                                    key={notification._id}
                                    style={[
                                        styles.notificationCard,
                                        !notification.isRead && styles.notificationCardUnread,
                                    ]}
                                    onPress={() => markAsRead(notification._id)}
                                    activeOpacity={0.7}
                                >
                                    {!notification.isRead && <View style={styles.unreadDot} />}

                                    <View style={[styles.notificationIcon, { backgroundColor: iconStyle.bg }]}>
                                        <MaterialIcons
                                            name={iconStyle.icon as any}
                                            size={22}
                                            color={iconStyle.color}
                                        />
                                    </View>

                                    <View style={styles.notificationContent}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.isRead && styles.notificationTitleUnread
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        <Text style={styles.notificationMessage} numberOfLines={2}>
                                            {notification.message}
                                        </Text>
                                        <Text style={styles.notificationTime}>
                                            {formatTimestamp(notification.createdAt)}
                                        </Text>
                                    </View>

                                    <MaterialIcons name="chevron-right" size={20} color={COLORS.gray300} />
                                </TouchableOpacity>
                            );
                        })
                    )}
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
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    unreadBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        backgroundColor: COLORS.blue50,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    unreadBannerText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    notificationCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    notificationCardUnread: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    unreadDot: {
        position: "absolute",
        top: 16,
        left: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    notificationContent: {
        flex: 1,
        gap: 4,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    notificationTitleUnread: {
        fontWeight: "700",
    },
    notificationMessage: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.gray400,
        marginTop: 2,
    },
});
