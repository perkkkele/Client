import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";

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
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

interface Appointment {
    id: string;
    time: string;
    period: string;
    clientName: string;
    clientInitials?: string;
    clientAvatar?: string;
    service: string;
    duration: string;
    status: "confirmed" | "pending" | "cancelled";
    bgColor?: string;
    textColor?: string;
}

interface DayData {
    day: string;
    date: number;
    isSelected?: boolean;
    hasAppointments?: boolean;
}

const WEEK_DAYS: DayData[] = [
    { day: "Lun", date: 11 },
    { day: "Mar", date: 12, hasAppointments: true },
    { day: "Mié", date: 13, isSelected: true, hasAppointments: true },
    { day: "Jue", date: 14, hasAppointments: true },
    { day: "Vie", date: 15, hasAppointments: true },
];

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: "1",
        time: "09:30",
        period: "AM",
        clientName: "María González",
        clientAvatar: "https://i.pravatar.cc/100?img=1",
        service: "Terapia de Pareja",
        duration: "1h",
        status: "confirmed",
    },
    {
        id: "2",
        time: "11:00",
        period: "AM",
        clientName: "Carlos Ruiz",
        clientInitials: "CR",
        service: "Consulta Inicial",
        duration: "45m",
        status: "pending",
        bgColor: COLORS.blue100,
        textColor: COLORS.blue600,
    },
    {
        id: "3",
        time: "15:30",
        period: "PM",
        clientName: "Laura Sánchez",
        clientInitials: "LS",
        service: "Seguimiento",
        duration: "30m",
        status: "cancelled",
        bgColor: COLORS.purple100,
        textColor: COLORS.purple600,
    },
];

export default function ManageAppointmentsScreen() {
    const { user } = useAuth();
    const [selectedDay, setSelectedDay] = useState(13);

    const avatarUrl = getAvatarUrl(user?.avatar);

    function handleBack() {
        router.back();
    }

    function getStatusStyle(status: Appointment["status"]) {
        switch (status) {
            case "confirmed":
                return { bg: COLORS.green50, text: COLORS.green700, border: COLORS.green100, indicator: COLORS.green500 };
            case "pending":
                return { bg: COLORS.orange50, text: COLORS.orange700, border: COLORS.orange100, indicator: COLORS.orange400 };
            case "cancelled":
                return { bg: COLORS.gray200, text: COLORS.gray500, border: COLORS.gray300, indicator: COLORS.gray400 };
        }
    }

    function getStatusLabel(status: Appointment["status"]) {
        switch (status) {
            case "confirmed": return "Confirmada";
            case "pending": return "Pendiente";
            case "cancelled": return "Cancelada";
        }
    }

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

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Calendar Section */}
                <View style={styles.calendarSection}>
                    <View style={styles.monthSelector}>
                        <TouchableOpacity>
                            <MaterialIcons name="chevron-left" size={24} color={COLORS.gray500} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.monthButton}>
                            <Text style={styles.monthText}>Septiembre 2023</Text>
                            <MaterialIcons name="arrow-drop-down" size={20} color={COLORS.textMain} />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray500} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekDays}>
                        {WEEK_DAYS.map((item) => (
                            <TouchableOpacity
                                key={item.date}
                                style={[
                                    styles.dayItem,
                                    item.isSelected && styles.dayItemSelected
                                ]}
                                onPress={() => setSelectedDay(item.date)}
                            >
                                <Text style={[
                                    styles.dayLabel,
                                    item.isSelected && styles.dayLabelSelected
                                ]}>
                                    {item.day}
                                </Text>
                                <Text style={[
                                    styles.dayNumber,
                                    item.isSelected && styles.dayNumberSelected
                                ]}>
                                    {item.date}
                                </Text>
                                {item.hasAppointments && (
                                    <View style={[
                                        styles.appointmentDot,
                                        item.isSelected && styles.appointmentDotSelected
                                    ]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => router.push("/(settings)/work-schedule")}
                    >
                        <MaterialIcons name="schedule" size={24} color={COLORS.purple600} />
                        <Text style={styles.quickActionText}>Horario Laboral</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <MaterialIcons name="event-busy" size={24} color={COLORS.orange500} />
                        <Text style={styles.quickActionText}>Ausencias</Text>
                    </TouchableOpacity>
                </View>

                {/* Appointments Section */}
                <View style={styles.appointmentsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Para hoy (3)</Text>
                        <TouchableOpacity style={styles.newAppointmentButton}>
                            <MaterialIcons name="add" size={18} color={COLORS.primary} />
                            <Text style={styles.newAppointmentText}>Nueva Cita</Text>
                        </TouchableOpacity>
                    </View>

                    {MOCK_APPOINTMENTS.map((appointment) => {
                        const statusStyle = getStatusStyle(appointment.status);
                        const isCancelled = appointment.status === "cancelled";

                        return (
                            <View
                                key={appointment.id}
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
                                            <Text style={styles.appointmentPeriod}>{appointment.period}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }
                                        ]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {getStatusLabel(appointment.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Client Info */}
                                    <View style={styles.clientInfo}>
                                        {appointment.clientAvatar ? (
                                            <Image source={{ uri: appointment.clientAvatar }} style={styles.clientAvatar} />
                                        ) : (
                                            <View style={[
                                                styles.clientAvatar,
                                                styles.clientInitialsContainer,
                                                { backgroundColor: appointment.bgColor || COLORS.gray200 }
                                            ]}>
                                                <Text style={[
                                                    styles.clientInitials,
                                                    { color: appointment.textColor || COLORS.gray500 }
                                                ]}>
                                                    {appointment.clientInitials}
                                                </Text>
                                            </View>
                                        )}
                                        <View>
                                            <Text style={[
                                                styles.clientName,
                                                isCancelled && styles.clientNameCancelled
                                            ]}>
                                                {appointment.clientName}
                                            </Text>
                                            <Text style={styles.serviceText}>
                                                {appointment.service} • {appointment.duration}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.appointmentActions}>
                                        {isCancelled ? (
                                            <TouchableOpacity style={styles.singleAction}>
                                                <MaterialIcons name="info" size={18} color={COLORS.gray500} />
                                                <Text style={styles.actionText}>Ver Motivo</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <>
                                                <TouchableOpacity style={styles.actionButton}>
                                                    <MaterialIcons name="visibility" size={20} color={COLORS.gray500} />
                                                    <Text style={styles.actionLabel}>Detalles</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                    <MaterialIcons name="edit-calendar" size={20} color={COLORS.gray500} />
                                                    <Text style={styles.actionLabel}>Reagendar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                    <MaterialIcons name="cancel" size={20} color={COLORS.gray500} />
                                                    <Text style={styles.actionLabel}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    calendarSection: {
        backgroundColor: COLORS.surfaceLight,
        paddingBottom: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginBottom: 16,
    },
    monthSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    monthButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    monthText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    weekDays: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 16,
    },
    dayItem: {
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        minWidth: 56,
    },
    dayItemSelected: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray400,
        marginBottom: 4,
    },
    dayLabelSelected: {
        color: "rgba(255,255,255,0.8)",
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    dayNumberSelected: {
        color: "#FFFFFF",
    },
    appointmentDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    appointmentDotSelected: {
        backgroundColor: "#FFFFFF",
    },
    quickActions: {
        flexDirection: "row",
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentsSection: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    newAppointmentButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(19, 127, 236, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    newAppointmentText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    appointmentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        marginBottom: 16,
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
        width: 6,
    },
    appointmentContent: {
        padding: 16,
        paddingLeft: 20,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    appointmentTime: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentTimeCancelled: {
        color: COLORS.gray500,
        textDecorationLine: "line-through",
    },
    appointmentPeriod: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray400,
        textTransform: "uppercase",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    clientInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    clientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    clientInitialsContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    clientInitials: {
        fontSize: 14,
        fontWeight: "bold",
    },
    clientName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientNameCancelled: {
        color: COLORS.gray500,
    },
    serviceText: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    appointmentActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    singleAction: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    actionText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray500,
    },
});
