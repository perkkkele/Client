import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    gray100: "#e5e7eb",
    gray200: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray700: "#374151",
    green400: "#4ade80",
    green500: "#22c55e",
    green600: "#16a34a",
    purple600: "#9333ea",
    orange600: "#ea580c",
    blue50: "#eff6ff",
    purple50: "#faf5ff",
    orange50: "#fff7ed",
    green50: "#f0fdf4",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function ProDashboardScreen() {
    const { user } = useAuth();
    const [geminiActive, setGeminiActive] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname || user?.email?.split("@")[0] || "Profesional";

    function handleBack() {
        router.back();
    }

    function handleMenuPress() {
        // TODO: Open side menu
    }

    function handleConfigureGemini() {
        // TODO: Navigate to gemini configuration
    }

    function handleEditProfile() {
        router.push("/(settings)/edit-profile");
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simulate data refresh
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Mock data for stats
    const stats = {
        profileVisits: 1240,
        profileVisitsChange: "+12%",
        chatDuration: "45h 20m",
        scheduledAppointments: 8,
        callsReceived: 42,
        callsChange: "+5%",
    };

    // Mock alerts
    const alerts = [
        {
            id: 1,
            type: "success",
            icon: "check-circle",
            title: "Cita completada",
            description: "Tu avatar ha completado una cita con Juan P. exitosamente.",
            time: "Hace 15 min",
            color: COLORS.primary,
        },
        {
            id: 2,
            type: "warning",
            icon: "receipt-long",
            title: "Factura Disponible",
            description: "Tu factura del mes de Mayo está lista para descargar.",
            time: "Hace 2 horas",
            color: "#f59e0b",
        },
        {
            id: 3,
            type: "info",
            icon: "update",
            title: "Recordatorio de Horario",
            description: "Recuerda actualizar tu disponibilidad para la próxima semana.",
            time: "Ayer",
            color: COLORS.gray400,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
                    <MaterialIcons name="menu" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Área Personal Pro</Text>
                <TouchableOpacity style={styles.profileButton} onPress={handleEditProfile}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
                    ) : (
                        <View style={styles.profileAvatarPlaceholder}>
                            <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                        </View>
                    )}
                    <View style={styles.onlineIndicator} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <View style={styles.greetingRow}>
                        <Text style={styles.greetingText}>Hola, {displayName}</Text>
                        <MaterialIcons name="waving-hand" size={24} color={COLORS.primary} />
                    </View>
                </View>

                {/* Digital Twin Card */}
                <View style={styles.twinCard}>
                    <View style={styles.twinCardContent}>
                        <View style={styles.twinHeader}>
                            <View style={styles.twinIconContainer}>
                                <MaterialIcons name="smart-toy" size={28} color="#FFFFFF" />
                            </View>
                            <View style={styles.twinInfo}>
                                <Text style={styles.twinTitle}>Gemelo Digital</Text>
                                <View style={styles.twinStatus}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>Activo y público</Text>
                                </View>
                            </View>
                            <Switch
                                value={geminiActive}
                                onValueChange={setGeminiActive}
                                trackColor={{ false: "rgba(0,0,0,0.2)", true: "rgba(255,255,255,0.3)" }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        <TouchableOpacity style={styles.configureButton} onPress={handleConfigureGemini}>
                            <View style={styles.configureButtonContent}>
                                <MaterialIcons name="tune" size={20} color={COLORS.primary} />
                                <Text style={styles.configureButtonText}>Configurar Gemelo</Text>
                            </View>
                            <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Activity Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Resumen de Actividad</Text>
                        <TouchableOpacity style={styles.sectionLink}>
                            <Text style={styles.sectionLinkText}>Configuración</Text>
                            <MaterialIcons name="settings" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, { backgroundColor: COLORS.blue50 }]}>
                                    <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.statBadge}>
                                    <MaterialIcons name="trending-up" size={14} color={COLORS.green600} />
                                    <Text style={styles.statBadgeText}>{stats.profileVisitsChange}</Text>
                                </View>
                            </View>
                            <Text style={styles.statLabel}>Visitas Perfil</Text>
                            <Text style={styles.statValue}>{stats.profileVisits.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, { backgroundColor: COLORS.purple50 }]}>
                                    <MaterialIcons name="schedule" size={20} color={COLORS.purple600} />
                                </View>
                            </View>
                            <Text style={styles.statLabel}>Duración Chats</Text>
                            <Text style={styles.statValue}>{stats.chatDuration}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, { backgroundColor: COLORS.orange50 }]}>
                                    <MaterialIcons name="calendar-month" size={20} color={COLORS.orange600} />
                                </View>
                            </View>
                            <Text style={styles.statLabel}>Citas Agendadas</Text>
                            <Text style={styles.statValue}>{stats.scheduledAppointments}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIcon, { backgroundColor: COLORS.green50 }]}>
                                    <MaterialIcons name="call" size={20} color={COLORS.green600} />
                                </View>
                                <View style={styles.statBadge}>
                                    <MaterialIcons name="trending-up" size={14} color={COLORS.green600} />
                                    <Text style={styles.statBadgeText}>{stats.callsChange}</Text>
                                </View>
                            </View>
                            <Text style={styles.statLabel}>Llamadas recibidas</Text>
                            <Text style={styles.statValue}>{stats.callsReceived}</Text>
                        </View>
                    </View>
                </View>

                {/* Important Alerts */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Alertas Importantes</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionLinkText}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.alertsList}>
                        {alerts.map((alert) => (
                            <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.color }]}>
                                <MaterialIcons name={alert.icon as any} size={20} color={alert.color} />
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <Text style={styles.alertDescription}>{alert.description}</Text>
                                    <Text style={styles.alertTime}>{alert.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <MaterialIcons name="edit-calendar" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    menuButton: {
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
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        overflow: "hidden",
    },
    profileAvatar: {
        width: "100%",
        height: "100%",
    },
    profileAvatarPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicator: {
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
    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    // Greeting
    greetingSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16,
    },
    greetingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    greetingText: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Twin Card
    twinCard: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    twinCardContent: {
        padding: 20,
    },
    twinHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    twinIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    twinInfo: {
        flex: 1,
    },
    twinTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    twinStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green400,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
    },
    configureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
    },
    configureButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    configureButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    // Section
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    sectionLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    sectionLinkText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        width: "48%",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        backgroundColor: COLORS.green50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statBadgeText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.green600,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Alerts
    alertsList: {
        gap: 12,
    },
    alertCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    alertDescription: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 4,
        lineHeight: 18,
    },
    alertTime: {
        fontSize: 10,
        color: COLORS.gray400,
        marginTop: 8,
    },
    // FAB
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.textMain,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
