import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";
import * as appointmentApi from "../../api/appointment";
import { Appointment } from "../../api/appointment";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#6B7280",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green500: "#22c55e",
    green700: "#15803d",
    orange50: "#fff7ed",
    orange100: "#ffedd5",
    orange400: "#fb923c",
    orange500: "#f97316",
    orange700: "#c2410c",
    purple100: "#f3e8ff",
    purple600: "#9333ea",
    blue100: "#dbeafe",
    blue600: "#2563eb",
    red50: "#fef2f2",
    red500: "#ef4444",
    red700: "#b91c1c",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return "Hoy";
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Mañana";
    } else {
        return date.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    }
}

function getClientInitials(client: Appointment["client"] | undefined): string {
    if (!client) return "?";
    const first = client.firstname?.charAt(0) || "";
    const last = client.lastname?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
}

function getStatusStyle(status: Appointment["status"]) {
    switch (status) {
        case "confirmed":
            return { bg: COLORS.green50, text: COLORS.green700, border: COLORS.green100, indicator: COLORS.green500 };
        case "pending":
            return { bg: COLORS.orange50, text: COLORS.orange700, border: COLORS.orange100, indicator: COLORS.orange400 };
        case "cancelled":
            return { bg: COLORS.gray200, text: COLORS.gray500, border: COLORS.gray300, indicator: COLORS.gray400 };
        case "completed":
            return { bg: COLORS.blue100, text: COLORS.blue600, border: COLORS.blue100, indicator: COLORS.blue600 };
        default:
            return { bg: COLORS.gray200, text: COLORS.gray500, border: COLORS.gray300, indicator: COLORS.gray400 };
    }
}

function getStatusLabel(status: Appointment["status"]) {
    switch (status) {
        case "confirmed": return "Confirmada";
        case "pending": return "Pendiente";
        case "cancelled": return "Cancelada";
        case "completed": return "Completada";
        default: return status;
    }
}

function getPaymentStatusLabel(status: string | undefined) {
    switch (status) {
        case "paid": return "Pagada";
        case "pending": return "Pago pendiente";
        case "failed": return "Pago fallido";
        case "refunded": return "Reembolsada";
        default: return "";
    }
}

export default function ManageAppointmentsScreen() {
    const { user, token } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"appointments" | "calendar">("appointments");

    const calendarConnected = user?.connectedCalendar?.connected || false;
    const calendarProvider = user?.connectedCalendar?.provider || null;

    const avatarUrl = getAvatarUrl(user?.avatar);

    const loadAppointments = useCallback(async () => {
        if (!token) return;

        try {
            const data = await appointmentApi.getAppointments(token, "professional");
            // Sort by date and time (upcoming first)
            const sorted = data.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setAppointments(sorted);
        } catch (error: any) {
            console.error("[ManageAppointments] Error loading:", error);
            Alert.alert("Error", "No se pudieron cargar las citas");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments();
        }, [loadAppointments])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadAppointments();
    };

    const handleConfirm = async (appointmentId: string) => {
        if (!token) return;

        Alert.alert(
            "Confirmar Cita",
            "¿Estás seguro de que quieres confirmar esta cita?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        setActionLoading(appointmentId);
                        try {
                            await appointmentApi.confirmAppointment(token, appointmentId);
                            // Update local state
                            setAppointments(prev =>
                                prev.map(apt =>
                                    apt._id === appointmentId
                                        ? { ...apt, status: "confirmed", confirmedAt: new Date().toISOString() }
                                        : apt
                                )
                            );
                            Alert.alert("Éxito", "Cita confirmada correctamente");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "No se pudo confirmar la cita");
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = async (appointmentId: string) => {
        if (!token) return;

        Alert.alert(
            "Cancelar Cita",
            "¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(appointmentId);
                        try {
                            await appointmentApi.cancelAppointment(token, appointmentId);
                            setAppointments(prev =>
                                prev.map(apt =>
                                    apt._id === appointmentId
                                        ? { ...apt, status: "cancelled", cancelledAt: new Date().toISOString() }
                                        : apt
                                )
                            );
                            Alert.alert("Cita cancelada", "La cita ha sido cancelada");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "No se pudo cancelar la cita");
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleViewDetails = (appointmentId: string) => {
        router.push(`/appointment-details/${appointmentId}` as any);
    };

    function handleBack() {
        router.back();
    }

    // Group appointments by date
    const groupedAppointments = appointments.reduce((acc, apt) => {
        const dateKey = apt.date;
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(apt);
        return acc;
    }, {} as Record<string, Appointment[]>);

    const pendingCount = appointments.filter(a => a.status === "pending").length;
    const todayCount = appointments.filter(a => {
        const today = new Date().toISOString().split("T")[0];
        return a.date === today && a.status !== "cancelled";
    }).length;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Citas</Text>
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                            <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                        </View>
                    )}
                    <View style={styles.onlineDot} />
                </View>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.orange50 }]}>
                        <MaterialIcons name="pending-actions" size={24} color={COLORS.orange500} />
                    </View>
                    <View>
                        <Text style={styles.statNumber}>{pendingCount}</Text>
                        <Text style={styles.statLabel}>Pendientes</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.green50 }]}>
                        <MaterialIcons name="today" size={24} color={COLORS.green500} />
                    </View>
                    <View>
                        <Text style={styles.statNumber}>{todayCount}</Text>
                        <Text style={styles.statLabel}>Hoy</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.blue100 }]}>
                        <MaterialIcons name="event" size={24} color={COLORS.blue600} />
                    </View>
                    <View>
                        <Text style={styles.statNumber}>{appointments.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "appointments" && styles.tabActive]}
                    onPress={() => setActiveTab("appointments")}
                >
                    <MaterialIcons
                        name="event-note"
                        size={20}
                        color={activeTab === "appointments" ? COLORS.primary : COLORS.gray400}
                    />
                    <Text style={[styles.tabText, activeTab === "appointments" && styles.tabTextActive]}>
                        Citas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "calendar" && styles.tabActive]}
                    onPress={() => setActiveTab("calendar")}
                >
                    <MaterialIcons
                        name="calendar-month"
                        size={20}
                        color={activeTab === "calendar" ? COLORS.primary : COLORS.gray400}
                    />
                    <Text style={[styles.tabText, activeTab === "calendar" && styles.tabTextActive]}>
                        Calendario
                    </Text>
                    {calendarConnected && (
                        <View style={styles.syncBadge}>
                            <MaterialIcons name="check" size={10} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Calendar WebView - Always mounted to preserve session */}
            {calendarConnected && (
                <View style={[
                    styles.calendarContainer,
                    activeTab !== "calendar" && {
                        position: "absolute",
                        left: -9999,
                        opacity: 0,
                        zIndex: -1,
                    }
                ]}>
                    <WebView
                        key={`calendar-webview-${calendarProvider}`}
                        source={{
                            uri: calendarProvider === "outlook"
                                ? "https://outlook.live.com/calendar/0/view/day"
                                : "https://calendar.google.com/calendar/u/0/r"
                        }}
                        style={styles.calendarWebView}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        scalesPageToFit={true}
                        // Session persistence
                        sharedCookiesEnabled={true}
                        thirdPartyCookiesEnabled={true}
                        incognito={false}
                        cacheEnabled={true}
                        cacheMode="LOAD_DEFAULT"
                        renderLoading={() => (
                            <View style={styles.webViewLoading}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Cargando calendario...</Text>
                            </View>
                        )}
                    />
                </View>
            )}

            {/* Calendar not connected message */}
            {activeTab === "calendar" && !calendarConnected && (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="sync-disabled" size={64} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>Calendario no conectado</Text>
                    <Text style={styles.emptySubtitle}>
                        Conecta tu Google Calendar o Outlook desde "Mi horario laboral" para ver tu calendario aquí
                    </Text>
                </View>
            )}

            {/* Appointments Tab Content */}
            {activeTab === "appointments" && isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando citas...</Text>
                </View>
            ) : activeTab === "appointments" && appointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="event-available" size={64} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>No tienes citas</Text>
                    <Text style={styles.emptySubtitle}>
                        Cuando los clientes reserven contigo, aparecerán aquí
                    </Text>
                </View>
            ) : activeTab === "appointments" ? (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
                        <View key={date} style={styles.dateSection}>
                            <Text style={styles.dateHeader}>{formatDate(date)}</Text>

                            {(dateAppointments || []).map((appointment) => {
                                // Skip appointments with missing client data
                                if (!appointment || !appointment.client) return null;

                                const statusStyle = getStatusStyle(appointment.status);
                                const isCancelled = appointment.status === "cancelled";
                                const isPending = appointment.status === "pending";
                                const isActionLoading = actionLoading === appointment._id;

                                return (
                                    <View
                                        key={appointment._id}
                                        style={[
                                            styles.appointmentCard,
                                            isCancelled && styles.appointmentCardCancelled
                                        ]}
                                    >
                                        <View style={[styles.statusIndicator, { backgroundColor: statusStyle.indicator }]} />
                                        <View style={styles.appointmentContent}>
                                            {/* Time and Status */}
                                            <View style={styles.appointmentHeader}>
                                                <View>
                                                    <Text style={[
                                                        styles.appointmentTime,
                                                        isCancelled && styles.appointmentTimeCancelled
                                                    ]}>
                                                        {appointment.time}
                                                    </Text>
                                                    <Text style={styles.appointmentDuration}>
                                                        {appointment.serviceType === "30min" ? "30 min" : "60 min"} • {appointment.type === "videoconference" ? "Online" : "Presencial"}
                                                    </Text>
                                                </View>
                                                <View style={{ alignItems: "flex-end" }}>
                                                    <View style={[
                                                        styles.statusBadge,
                                                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }
                                                    ]}>
                                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                            {getStatusLabel(appointment.status)}
                                                        </Text>
                                                    </View>
                                                    {appointment.paymentStatus && (
                                                        <Text style={[
                                                            styles.paymentStatus,
                                                            { color: appointment.paymentStatus === "paid" ? COLORS.green700 : COLORS.orange700 }
                                                        ]}>
                                                            {getPaymentStatusLabel(appointment.paymentStatus)}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Client Info */}
                                            <View style={styles.clientInfo}>
                                                {appointment.client.avatar ? (
                                                    <Image
                                                        source={{ uri: getAvatarUrl(appointment.client.avatar) || undefined }}
                                                        style={styles.clientAvatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.clientAvatar, styles.clientInitialsContainer]}>
                                                        <Text style={styles.clientInitials}>
                                                            {getClientInitials(appointment.client)}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[
                                                        styles.clientName,
                                                        isCancelled && styles.clientNameCancelled
                                                    ]}>
                                                        {appointment.client.firstname} {appointment.client.lastname}
                                                    </Text>
                                                    <Text style={styles.clientEmail}>{appointment.client.email}</Text>
                                                </View>
                                                <Text style={styles.priceText}>
                                                    {(appointment.price / 100).toFixed(0)}€
                                                </Text>
                                            </View>

                                            {/* Actions */}
                                            <View style={styles.appointmentActions}>
                                                {isActionLoading ? (
                                                    <View style={styles.loadingAction}>
                                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                                    </View>
                                                ) : isCancelled ? (
                                                    <TouchableOpacity
                                                        style={styles.singleAction}
                                                        onPress={() => handleViewDetails(appointment._id)}
                                                    >
                                                        <MaterialIcons name="info" size={18} color={COLORS.gray500} />
                                                        <Text style={styles.actionText}>Ver Detalles</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.actionButton}
                                                            onPress={() => handleViewDetails(appointment._id)}
                                                        >
                                                            <MaterialIcons name="visibility" size={20} color={COLORS.gray500} />
                                                            <Text style={styles.actionLabel}>Detalles</Text>
                                                        </TouchableOpacity>

                                                        {isPending && (
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.confirmButton]}
                                                                onPress={() => handleConfirm(appointment._id)}
                                                            >
                                                                <MaterialIcons name="check-circle" size={20} color={COLORS.green500} />
                                                                <Text style={[styles.actionLabel, { color: COLORS.green700 }]}>Confirmar</Text>
                                                            </TouchableOpacity>
                                                        )}

                                                        <TouchableOpacity
                                                            style={styles.actionButton}
                                                            onPress={() => handleCancel(appointment._id)}
                                                        >
                                                            <MaterialIcons name="cancel" size={20} color={COLORS.red500} />
                                                            <Text style={[styles.actionLabel, { color: COLORS.red700 }]}>Cancelar</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            ) : null}
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    avatarContainer: {
        position: "relative",
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    onlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
    },
    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    statCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        padding: 12,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        fontWeight: "500",
    },
    scrollView: {
        flex: 1,
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
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 8,
    },
    dateSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    dateHeader: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    appointmentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    appointmentCardCancelled: {
        backgroundColor: COLORS.gray100,
        opacity: 0.75,
    },
    statusIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 5,
    },
    appointmentContent: {
        padding: 16,
        paddingLeft: 18,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    appointmentTime: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentTimeCancelled: {
        color: COLORS.gray500,
        textDecorationLine: "line-through",
    },
    appointmentDuration: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "bold",
    },
    paymentStatus: {
        fontSize: 10,
        fontWeight: "600",
        marginTop: 4,
    },
    clientInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    clientAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    clientInitialsContainer: {
        backgroundColor: COLORS.blue100,
        alignItems: "center",
        justifyContent: "center",
    },
    clientInitials: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.blue600,
    },
    clientName: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientNameCancelled: {
        color: COLORS.gray500,
    },
    clientEmail: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    priceText: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 12,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.gray100,
    },
    confirmButton: {
        backgroundColor: COLORS.green50,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.gray500,
    },
    singleAction: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    loadingAction: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
    },
    // Tab bar styles
    tabBar: {
        flexDirection: "row",
        backgroundColor: COLORS.surfaceLight,
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: COLORS.backgroundLight,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray400,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: "600",
    },
    syncBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#0F9D58",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 2,
    },
    // Calendar styles - Google Calendar inspired
    calendarContainer: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    calendar: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    calendarLoadingOverlay: {
        padding: 12,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
    },
    // Events list styles - Google Calendar inspired
    eventsList: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 32,
    },
    eventsHeader: {
        fontSize: 14,
        fontWeight: "500",
        color: "#5F6368",
        marginBottom: 12,
        textTransform: "capitalize",
        letterSpacing: 0.25,
    },
    eventItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        alignItems: "flex-start",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    eventTwinpro: {
        borderLeftWidth: 4,
        borderLeftColor: "#0F9D58", // Google Green
    },
    eventGoogle: {
        borderLeftWidth: 4,
        borderLeftColor: "#4285F4", // Google Blue
    },
    eventDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
        marginTop: 2,
    },
    eventContent: {
        flex: 1,
    },
    eventTime: {
        fontSize: 12,
        fontWeight: "500",
        color: "#1A73E8",
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: "#202124",
        marginBottom: 4,
        lineHeight: 20,
    },
    eventLocation: {
        fontSize: 13,
        color: "#5F6368",
        marginBottom: 4,
    },
    eventSource: {
        fontSize: 11,
        color: "#9AA0A6",
        fontWeight: "500",
    },
    noEvents: {
        alignItems: "center",
        padding: 32,
        backgroundColor: "#fff",
        borderRadius: 8,
    },
    noEventsText: {
        fontSize: 14,
        color: "#5F6368",
        marginTop: 12,
    },
    // Custom calendar styles - Google Calendar inspired
    calendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E8EAED",
    },
    calendarArrow: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F9FA",
    },
    calendarMonth: {
        fontSize: 20,
        fontWeight: "500",
        color: "#3C4043",
        letterSpacing: 0.25,
    },
    dayNamesRow: {
        flexDirection: "row",
        paddingVertical: 12,
        backgroundColor: "#F8F9FA",
    },
    dayName: {
        flex: 1,
        textAlign: "center",
        fontSize: 11,
        fontWeight: "500",
        color: "#70757A",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    dayCell: {
        width: "14.28%",
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
    },
    dayCellSelected: {
        backgroundColor: "#1A73E8",
        borderRadius: 999,
    },
    dayCellToday: {
        backgroundColor: "#E8F0FE",
        borderRadius: 999,
    },
    dayText: {
        fontSize: 14,
        fontWeight: "400",
        color: "#3C4043",
    },
    dayTextSelected: {
        color: "#fff",
        fontWeight: "500",
    },
    dayTextToday: {
        color: "#1A73E8",
        fontWeight: "600",
    },
    eventDotsRow: {
        flexDirection: "row",
        gap: 3,
        marginTop: 3,
        height: 6,
    },
    eventDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    // Legacy styles (kept for compatibility)
    calendarWebView: {
        flex: 1,
    },
    webViewLoading: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
    },
});
