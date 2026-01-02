import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";
import { Appointment, getAppointments, cancelAppointment } from "../../api/appointment";
import { createCheckoutSession } from "../../api/payment";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    textMuted: "#617589",
    gray100: "#e5e7eb",
    gray200: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green700: "#15803d",
    yellow50: "#fefce8",
    yellow100: "#fef08a",
    yellow700: "#a16207",
    red50: "#fef2f2",
    red100: "#fee2e2",
    red600: "#dc2626",
    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue700: "#1d4ed8",
    white: "#FFFFFF",
};

const MONTHS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    return `${day} ${month}`;
}

function getStatusConfig(
    status: string,
    paymentStatus?: string,
    appointmentType?: string,
    requirePaymentOnBooking?: boolean
) {
    // Determine if this is an in-situ payment case (presencial + professional allows in-situ)
    const isInSituPayment = appointmentType === 'presencial' && requirePaymentOnBooking === false;

    // Only show "Pago pendiente" if payment is actually required before appointment
    // For in-situ payments, show the actual appointment status instead
    if (paymentStatus === 'pending' && (status === 'pending' || status === 'confirmed') && !isInSituPayment) {
        return {
            label: "Pago pendiente",
            icon: "payment",
            bgColor: COLORS.yellow50,
            textColor: COLORS.yellow700,
            borderColor: COLORS.yellow100,
        };
    }

    switch (status) {
        case "confirmed":
            return {
                label: "Confirmada",
                icon: "check-circle",
                bgColor: COLORS.green50,
                textColor: COLORS.green700,
                borderColor: COLORS.green100,
            };
        case "pending":
            return {
                label: "Pendiente",
                icon: "schedule",
                bgColor: COLORS.yellow50,
                textColor: COLORS.yellow700,
                borderColor: COLORS.yellow100,
            };
        case "cancelled":
            return {
                label: "Cancelada",
                icon: "cancel",
                bgColor: COLORS.red50,
                textColor: COLORS.red600,
                borderColor: COLORS.red100,
            };
        case "completed":
            return {
                label: "Completada",
                icon: "task-alt",
                bgColor: COLORS.green50,
                textColor: COLORS.green700,
                borderColor: COLORS.green100,
            };
        default:
            return {
                label: status,
                icon: "info",
                bgColor: COLORS.gray100,
                textColor: COLORS.gray500,
                borderColor: COLORS.gray200,
            };
    }
}

export default function MyAppointmentsScreen() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const { token } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Determine which view to show based on tab parameter
    const showUpcoming = tab !== 'history';
    const showHistory = tab === 'history';
    const headerTitle = showHistory ? "Historial de Citas" : "Próximas Citas";

    const loadAppointments = useCallback(async (showRefresh = false) => {
        console.log("[MyAppointments] Loading appointments, token:", token ? "present" : "missing");
        if (!token) return;

        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            console.log("[MyAppointments] Calling getAppointments with role=client");
            const data = await getAppointments(token, "client");
            console.log("[MyAppointments] Received appointments:", data.length, data);
            // Sort by date, most recent first for past, soonest first for upcoming
            const sorted = data.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setAppointments(sorted);
        } catch (error) {
            console.error("[MyAppointments] Error loading appointments:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments();
        }, [loadAppointments])
    );

    const handleViewDetails = (appointmentId: string) => {
        router.push(`/appointment-details/${appointmentId}` as any);
    };

    const handleCancel = (appointment: Appointment) => {
        Alert.alert(
            "Cancelar Cita",
            `¿Estás seguro de que deseas cancelar tu cita con ${appointment.professional.publicName || appointment.professional.firstname}?`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        if (!token) return;
                        setCancellingId(appointment._id);
                        try {
                            await cancelAppointment(token, appointment._id);
                            await loadAppointments();
                            Alert.alert("Éxito", "La cita ha sido cancelada");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "No se pudo cancelar la cita");
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handlePayNow = async (appointmentId: string) => {
        if (!token) return;

        try {
            const session = await createCheckoutSession(token, appointmentId);
            const canOpen = await Linking.canOpenURL(session.url);
            if (canOpen) {
                await Linking.openURL(session.url);
            } else {
                Alert.alert("Error", "No se pudo abrir el enlace de pago");
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            Alert.alert("Error", error.message || "No se pudo iniciar el pago");
        }
    };

    // Separate appointments into upcoming and past
    const now = new Date();
    const upcomingAppointments = appointments
        .filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate >= now && apt.status !== 'cancelled';
        })
        .sort((a, b) => {
            // Soonest first (ascending by date)
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

    const pastAppointments = appointments
        .filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate < now || apt.status === 'cancelled';
        })
        .sort((a, b) => {
            // Most recent first (descending by date)
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB.getTime() - dateA.getTime();
        });

    const renderAppointmentCard = (appointment: Appointment) => {
        const avatarUrl = getAvatarUrl(appointment.professional.avatar);
        const displayName = appointment.professional.publicName ||
            `${appointment.professional.firstname} ${appointment.professional.lastname}`.trim();

        // Determine if this is an in-situ payment case
        const isInSituPayment = appointment.type === 'presencial' &&
            appointment.professional.requirePaymentOnBooking === false;

        const statusConfig = getStatusConfig(
            appointment.status,
            appointment.paymentStatus,
            appointment.type,
            appointment.professional.requirePaymentOnBooking
        );

        const isActive = appointment.status === "pending" || appointment.status === "confirmed";
        // Show pay button for: online pending OR presencial with requirePayment=true pending
        const showPayButton = appointment.paymentStatus === 'pending' && isActive && !isInSituPayment;
        // Show optional early pay for in-situ appointments that haven't paid yet
        const showOptionalPayButton = isInSituPayment && appointment.paymentStatus === 'pending' && isActive;
        const isCancelling = cancellingId === appointment._id;

        return (
            <TouchableOpacity
                key={appointment._id}
                style={styles.appointmentCard}
                onPress={() => handleViewDetails(appointment._id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.professionalInfo}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                            </View>
                        )}
                        <View style={styles.professionalDetails}>
                            <Text style={styles.professionalName} numberOfLines={1}>{displayName}</Text>
                            <Text style={styles.profession} numberOfLines={1}>
                                {appointment.professional.profession || "Profesional"}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}>
                        <MaterialIcons name={statusConfig.icon as any} size={14} color={statusConfig.textColor} />
                        <Text style={[styles.statusText, { color: statusConfig.textColor }]}>{statusConfig.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.dateTimeRow}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="calendar-today" size={16} color={COLORS.primary} />
                            <Text style={styles.infoText}>{formatDate(appointment.date)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="schedule" size={16} color={COLORS.primary} />
                            <Text style={styles.infoText}>{appointment.time}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialIcons
                                name={appointment.type === "videoconference" ? "videocam" : "location-on"}
                                size={16}
                                color={COLORS.primary}
                            />
                            <Text style={styles.infoText}>
                                {appointment.type === "videoconference" ? "Online" : "Presencial"}
                            </Text>
                        </View>
                    </View>

                    {/* In-situ payment indicator */}
                    {isInSituPayment && appointment.paymentStatus === 'pending' && isActive && (
                        <View style={styles.inSituBadge}>
                            <MaterialIcons name="store" size={14} color={COLORS.blue700} />
                            <Text style={styles.inSituText}>Pago presencial • {(appointment.price / 100).toFixed(0)}€</Text>
                        </View>
                    )}

                    {/* Action buttons for active appointments */}
                    {isActive && (
                        <View style={styles.cardActions}>
                            {showPayButton && (
                                <TouchableOpacity
                                    style={styles.payButton}
                                    onPress={() => handlePayNow(appointment._id)}
                                >
                                    <MaterialIcons name="payment" size={16} color={COLORS.white} />
                                    <Text style={styles.payButtonText}>Pagar</Text>
                                </TouchableOpacity>
                            )}
                            {showOptionalPayButton && (
                                <TouchableOpacity
                                    style={styles.optionalPayButton}
                                    onPress={() => handlePayNow(appointment._id)}
                                >
                                    <MaterialIcons name="payment" size={16} color={COLORS.primary} />
                                    <Text style={styles.optionalPayButtonText}>Pagar ahora</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                                onPress={() => handleCancel(appointment)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color={COLORS.red600} />
                                ) : (
                                    <>
                                        <MaterialIcons name="cancel" size={16} color={COLORS.red600} />
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : appointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="event-busy" size={64} color={COLORS.gray400} />
                    <Text style={styles.emptyTitle}>No tienes citas</Text>
                    <Text style={styles.emptySubtitle}>
                        Explora nuestro directorio para encontrar profesionales y agendar tu primera cita
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push("/(tabs)/category-results?category=todos" as any)}
                    >
                        <Text style={styles.exploreButtonText}>Explorar Profesionales</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => loadAppointments(true)}
                            colors={[COLORS.primary]}
                        />
                    }
                >
                    {/* Upcoming Appointments */}
                    {showUpcoming && upcomingAppointments.length > 0 && (
                        <View style={styles.section}>
                            {upcomingAppointments.map(renderAppointmentCard)}
                        </View>
                    )}

                    {/* Show empty state for upcoming if no appointments */}
                    {showUpcoming && upcomingAppointments.length === 0 && (
                        <View style={styles.emptySection}>
                            <MaterialIcons name="event-available" size={48} color={COLORS.gray400} />
                            <Text style={styles.emptySectionText}>No tienes citas próximas</Text>
                        </View>
                    )}

                    {/* Past/Cancelled Appointments */}
                    {showHistory && pastAppointments.length > 0 && (
                        <View style={styles.section}>
                            {pastAppointments.map(renderAppointmentCard)}
                        </View>
                    )}

                    {/* Show empty state for history if no appointments */}
                    {showHistory && pastAppointments.length === 0 && (
                        <View style={styles.emptySection}>
                            <MaterialIcons name="history" size={48} color={COLORS.gray400} />
                            <Text style={styles.emptySectionText}>No tienes historial de citas</Text>
                        </View>
                    )}

                    <View style={{ height: 32 }} />
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        backgroundColor: COLORS.surfaceLight,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    exploreButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 24,
    },
    exploreButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    appointmentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    professionalInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    professionalDetails: {
        flex: 1,
    },
    professionalName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    profession: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 12,
    },
    dateTimeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textMain,
        fontWeight: "500",
    },
    cardActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    payButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
    },
    payButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.white,
    },
    cancelButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        backgroundColor: COLORS.red50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.red100,
    },
    cancelButtonDisabled: {
        opacity: 0.6,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.red600,
    },
    emptySection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
    },
    emptySectionText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 12,
    },
    inSituBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.blue50,
        borderRadius: 8,
        marginTop: 10,
    },
    inSituText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.blue700,
    },
    optionalPayButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    optionalPayButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
});
