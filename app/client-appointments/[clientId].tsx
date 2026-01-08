/**
 * Client Appointments History Screen
 * 
 * Shows all appointments history between a specific client and the professional.
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
import * as appointmentApi from "../../api/appointment";
import { Appointment } from "../../api/appointment";

const COLORS = {
    primary: "#4F46E5",
    primaryLight: "#EEF2FF",
    backgroundLight: "#f3f4f6",
    surfaceLight: "#FFFFFF",
    textMain: "#1F2937",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    green50: "#f0fdf4",
    green500: "#22c55e",
    green600: "#16a34a",
    green700: "#15803d",
    orange50: "#fff7ed",
    orange500: "#f97316",
    orange600: "#ea580c",
    purple50: "#faf5ff",
    purple700: "#7c3aed",
    blue50: "#eff6ff",
    blue600: "#2563eb",
    red50: "#fef2f2",
    red500: "#ef4444",
};

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getStatusStyle(status: Appointment["status"]) {
    switch (status) {
        case "confirmed":
            return { bg: COLORS.green50, text: COLORS.green700, label: "Confirmada" };
        case "pending":
            return { bg: COLORS.orange50, text: COLORS.orange600, label: "Pendiente" };
        case "cancelled":
            return { bg: COLORS.gray200, text: COLORS.gray500, label: "Cancelada" };
        case "completed":
            return { bg: COLORS.blue50, text: COLORS.blue600, label: "Completada" };
        default:
            return { bg: COLORS.gray200, text: COLORS.gray500, label: status };
    }
}

export default function ClientAppointmentsScreen() {
    const { clientId } = useLocalSearchParams<{ clientId: string }>();
    const { token } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clientInfo, setClientInfo] = useState<{
        firstname: string;
        lastname: string;
        avatar?: string;
    } | null>(null);

    const loadAppointments = useCallback(async () => {
        if (!token || !clientId) return;

        try {
            // Get all appointments for the professional
            const allAppointments = await appointmentApi.getAppointments(token, "professional");

            // Filter appointments for this specific client
            const clientAppointments = allAppointments.filter(apt =>
                apt.client?._id === clientId
            );

            // Get client info from first appointment
            if (clientAppointments.length > 0) {
                const client = clientAppointments[0].client;
                setClientInfo({
                    firstname: client.firstname,
                    lastname: client.lastname,
                    avatar: client.avatar,
                });
            }

            // Sort by date (newest first)
            clientAppointments.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setAppointments(clientAppointments);
        } catch (error: any) {
            console.error("[ClientAppointments] Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, clientId]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments();
        }, [loadAppointments])
    );

    const getClientInitials = () => {
        if (!clientInfo) return "?";
        const first = clientInfo.firstname?.charAt(0) || "";
        const last = clientInfo.lastname?.charAt(0) || "";
        return (first + last).toUpperCase() || "?";
    };

    // Stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;
    const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;
    const totalRevenue = appointments
        .filter(a => a.status === "completed" && a.paymentStatus === "paid")
        .reduce((sum, a) => sum + a.price, 0);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Historial de Citas</Text>
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
                    <Text style={styles.loadingText}>Cargando historial...</Text>
                </View>
            ) : appointments.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialIcons name="event-available" size={64} color={COLORS.gray300} />
                    </View>
                    <Text style={styles.emptyTitle}>Sin historial</Text>
                    <Text style={styles.emptySubtitle}>
                        No tienes citas anteriores con este cliente
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Client Info Card with Stats */}
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
                                    Cliente desde {formatDate(appointments[appointments.length - 1]?.createdAt || "")}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{totalAppointments}</Text>
                            <Text style={styles.statLabel}>Citas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: COLORS.green600 }]}>{completedAppointments}</Text>
                            <Text style={styles.statLabel}>Completadas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: COLORS.primary }]}>{(totalRevenue / 100).toFixed(0)}€</Text>
                            <Text style={styles.statLabel}>Ingresos</Text>
                        </View>
                    </View>

                    {/* Appointments List */}
                    <Text style={styles.sectionTitle}>Todas las citas</Text>
                    {appointments.map((appointment) => {
                        const statusStyle = getStatusStyle(appointment.status);
                        const isVideoconference = appointment.type === "videoconference";
                        const isCancelled = appointment.status === "cancelled";

                        return (
                            <TouchableOpacity
                                key={appointment._id}
                                style={[
                                    styles.appointmentCard,
                                    isCancelled && styles.appointmentCardCancelled
                                ]}
                                onPress={() => router.push(`/appointment-details/${appointment._id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.appointmentDateColumn}>
                                    <Text style={styles.appointmentDay}>
                                        {new Date(appointment.date).getDate()}
                                    </Text>
                                    <Text style={styles.appointmentMonth}>
                                        {new Date(appointment.date).toLocaleDateString("es-ES", { month: "short" })}
                                    </Text>
                                </View>
                                <View style={styles.appointmentContent}>
                                    <View style={styles.appointmentHeader}>
                                        <Text style={[styles.appointmentTime, isCancelled && styles.textCancelled]}>
                                            {appointment.time}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {statusStyle.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.appointmentDetails}>
                                        <View style={[
                                            styles.typeBadge,
                                            isVideoconference ? styles.typeBadgeVideo : styles.typeBadgePresencial
                                        ]}>
                                            <MaterialIcons
                                                name={isVideoconference ? "videocam" : "store"}
                                                size={12}
                                                color={isVideoconference ? COLORS.purple700 : COLORS.gray600}
                                            />
                                            <Text style={[
                                                styles.typeBadgeText,
                                                isVideoconference ? styles.typeBadgeTextVideo : styles.typeBadgeTextPresencial
                                            ]}>
                                                {isVideoconference ? "Video" : "Presencial"}
                                            </Text>
                                        </View>
                                        <Text style={styles.durationText}>
                                            {appointment.serviceType === "30min" ? "30 min" : "60 min"}
                                        </Text>
                                        <Text style={styles.priceText}>
                                            {(appointment.price / 100).toFixed(0)}€
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray300} />
                            </TouchableOpacity>
                        );
                    })}
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
        marginBottom: 16,
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
        borderColor: COLORS.primaryLight,
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
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 2,
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
    appointmentCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    appointmentCardCancelled: {
        opacity: 0.6,
    },
    appointmentDateColumn: {
        width: 50,
        alignItems: "center",
        marginRight: 12,
    },
    appointmentDay: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentMonth: {
        fontSize: 11,
        color: COLORS.gray500,
        textTransform: "uppercase",
    },
    appointmentContent: {
        flex: 1,
    },
    appointmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    appointmentTime: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    textCancelled: {
        textDecorationLine: "line-through",
        color: COLORS.gray400,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    appointmentDetails: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        gap: 4,
    },
    typeBadgeVideo: {
        backgroundColor: COLORS.purple50,
    },
    typeBadgePresencial: {
        backgroundColor: COLORS.gray100,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: "500",
    },
    typeBadgeTextVideo: {
        color: COLORS.purple700,
    },
    typeBadgeTextPresencial: {
        color: COLORS.gray600,
    },
    durationText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    priceText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textMain,
    },
});
