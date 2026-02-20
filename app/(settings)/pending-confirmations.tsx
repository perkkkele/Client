/**
 * Pending Confirmations Screen
 * 
 * Shows appointments that require professional confirmation.
 */

import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";
import * as appointmentApi from "../../api/appointment";
import { Appointment } from "../../api/appointment";
import { useAlert } from "../../components/TwinProAlert";

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
    green50: "#f0fdf4",
    green500: "#22c55e",
    green600: "#16a34a",
    green700: "#15803d",
    orange50: "#fff7ed",
    orange100: "#ffedd5",
    orange500: "#f97316",
    orange600: "#ea580c",
    red50: "#fef2f2",
    red500: "#ef4444",
    red600: "#dc2626",
    purple50: "#faf5ff",
    purple700: "#7c3aed",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

function formatDateTime(dateStr: string, timeStr: string): string {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    return `${day} a las ${timeStr}`;
}

function getClientInitials(client: Appointment["client"] | undefined): string {
    if (!client) return "?";
    const first = client.firstname?.charAt(0) || "";
    const last = client.lastname?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
}

export default function PendingConfirmationsScreen() {
    const { token } = useAuth();
  const { showAlert } = useAlert();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadPendingAppointments = useCallback(async () => {
        if (!token) return;

        try {
            const data = await appointmentApi.getAppointments(token, "professional");
            const pending = data
                .filter(apt => apt.status === "pending")
                .sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
            setAppointments(pending);
        } catch (error: any) {
            console.error("[PendingConfirmations] Error:", error);
            showAlert({ type: 'error', title: 'Error', message: 'No se pudieron cargar las citas pendientes' });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadPendingAppointments();
        }, [loadPendingAppointments])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadPendingAppointments();
    };

    const handleConfirm = async (appointmentId: string) => {
        if (!token) return;

        setActionLoading(appointmentId);
        try {
            await appointmentApi.confirmAppointment(token, appointmentId);
            setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
            showAlert({ type: 'success', title: 'Éxito', message: 'Cita confirmada correctamente. El cliente ha sido notificado.' });
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message || "No se pudo confirmar la cita" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (appointmentId: string) => {
        if (!token) return;

        showAlert({
    type: 'warning',
    title: 'Rechazar Cita',
    message: '¿Estás seguro de que quieres rechazar esta cita? El cliente será notificado.',
    buttons: [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Rechazar",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(appointmentId);
                        try {
                            await appointmentApi.cancelAppointment(token, appointmentId);
                            setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
                            showAlert({ type: 'info', title: 'Cita rechazada', message: 'El cliente ha sido notificado.' });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message || "No se pudo rechazar la cita" });
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
});
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Solicitudes Pendientes</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
                <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                    Estas citas requieren tu confirmación. Al confirmar, el cliente será notificado.
                </Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando solicitudes...</Text>
                </View>
            ) : appointments.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <MaterialIcons name="check-circle" size={64} color={COLORS.green500} />
                    </View>
                    <Text style={styles.emptyTitle}>¡Todo al día!</Text>
                    <Text style={styles.emptySubtitle}>
                        No tienes citas pendientes de confirmación
                    </Text>
                    <TouchableOpacity
                        style={styles.backToAppointments}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backToAppointmentsText}>Volver a mis citas</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    {appointments.map((appointment) => {
                        if (!appointment?.client) return null;
                        const isVideoconference = appointment.type === "videoconference";
                        const isActionLoading = actionLoading === appointment._id;

                        return (
                            <View key={appointment._id} style={styles.appointmentCard}>
                                {/* Orange pending indicator */}
                                <View style={styles.pendingIndicator} />

                                <View style={styles.cardContent}>
                                    {/* Date/Time Header */}
                                    <View style={styles.dateTimeHeader}>
                                        <MaterialIcons name="event" size={18} color={COLORS.orange600} />
                                        <Text style={styles.dateTimeText}>
                                            {formatDateTime(appointment.date, appointment.time)}
                                        </Text>
                                    </View>

                                    {/* Client Row */}
                                    <View style={styles.clientRow}>
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
                                        <View style={styles.clientInfo}>
                                            <Text style={styles.clientName}>
                                                {appointment.client.firstname} {appointment.client.lastname}
                                            </Text>
                                            <Text style={styles.clientEmail}>{appointment.client.email}</Text>
                                        </View>
                                    </View>

                                    {/* Service Details */}
                                    <View style={styles.serviceDetails}>
                                        <View style={[
                                            styles.typeBadge,
                                            isVideoconference ? styles.typeBadgeVideo : styles.typeBadgePresencial
                                        ]}>
                                            <MaterialIcons
                                                name={isVideoconference ? "videocam" : "store"}
                                                size={14}
                                                color={isVideoconference ? COLORS.purple700 : COLORS.gray600}
                                            />
                                            <Text style={[
                                                styles.typeBadgeText,
                                                isVideoconference ? styles.typeBadgeTextVideo : styles.typeBadgeTextPresencial
                                            ]}>
                                                {isVideoconference ? "Videollamada" : "Cita presencial"}
                                            </Text>
                                        </View>
                                        <Text style={styles.durationText}>
                                            {appointment.serviceType === "30min" ? "30 min" : "60 min"}
                                        </Text>
                                        <Text style={styles.priceText}>
                                            {(appointment.price / 100).toFixed(0)}€
                                        </Text>
                                    </View>

                                    {/* Notes */}
                                    {appointment.notes && (
                                        <View style={styles.notesContainer}>
                                            <MaterialIcons name="notes" size={16} color={COLORS.gray400} />
                                            <Text style={styles.notesText}>{appointment.notes}</Text>
                                        </View>
                                    )}

                                    {/* Actions */}
                                    {isActionLoading ? (
                                        <View style={styles.loadingActions}>
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                        </View>
                                    ) : (
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={styles.confirmButton}
                                                onPress={() => handleConfirm(appointment._id)}
                                            >
                                                <MaterialIcons name="check" size={18} color="#fff" />
                                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.rejectButton}
                                                onPress={() => handleReject(appointment._id)}
                                            >
                                                <MaterialIcons name="close" size={18} color={COLORS.red600} />
                                                <Text style={styles.rejectButtonText}>Rechazar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
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
        justifyContent: "space-between",
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
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.primary,
        lineHeight: 18,
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
        backgroundColor: COLORS.green50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 8,
    },
    backToAppointments: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },
    backToAppointmentsText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    appointmentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.orange100,
        shadowColor: COLORS.orange500,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    pendingIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.orange500,
    },
    cardContent: {
        padding: 16,
        paddingLeft: 20,
    },
    dateTimeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    dateTimeText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.orange600,
        textTransform: "capitalize",
    },
    clientRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.gray100,
    },
    clientInitialsContainer: {
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    clientInitials: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    clientInfo: {
        flex: 1,
        marginLeft: 12,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientEmail: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 2,
    },
    serviceDetails: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    typeBadgeVideo: {
        backgroundColor: COLORS.purple50,
    },
    typeBadgePresencial: {
        backgroundColor: COLORS.gray100,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: "500",
    },
    typeBadgeTextVideo: {
        color: COLORS.purple700,
    },
    typeBadgeTextPresencial: {
        color: COLORS.gray600,
    },
    durationText: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    priceText: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    notesContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.gray100,
        padding: 10,
        borderRadius: 8,
        gap: 8,
        marginBottom: 12,
    },
    notesText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray600,
        lineHeight: 18,
    },
    loadingActions: {
        paddingVertical: 16,
        alignItems: "center",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.green600,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    rejectButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.red50,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        gap: 6,
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.red600,
    },
});
