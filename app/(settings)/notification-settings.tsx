import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Switch,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { notificationsApi, NotificationPreferences } from "../../api/notifications";

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
    orange500: "#f97316",
    orange50: "#fff7ed",
    blue500: "#3b82f6",
    blue50: "#eff6ff",
    purple500: "#8B5CF6",
    purple50: "#f5f3ff",
};

interface NotificationCategory {
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    critical?: boolean;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
    {
        key: "escalations",
        title: "Escalaciones",
        description: "Chats que requieren tu atención directa",
        icon: "support-agent",
        iconBg: COLORS.orange50,
        iconColor: COLORS.orange500,
        critical: true,
    },
    {
        key: "appointments",
        title: "Citas",
        description: "Reservas, cancelaciones y recordatorios",
        icon: "calendar-today",
        iconBg: COLORS.blue50,
        iconColor: COLORS.blue500,
    },
    {
        key: "reviews",
        title: "Reseñas",
        description: "Nuevas valoraciones de clientes",
        icon: "star",
        iconBg: COLORS.purple50,
        iconColor: COLORS.purple500,
    },
    {
        key: "earnings",
        title: "Ingresos",
        description: "Pagos recibidos y resúmenes",
        icon: "payments",
        iconBg: "#f0fdf4",
        iconColor: COLORS.green500,
    },
    {
        key: "billing",
        title: "Planes y Facturación",
        description: "Renovaciones, facturas y alertas de créditos",
        icon: "receipt-long",
        iconBg: "#fef2f2",
        iconColor: "#EF4444",
    },
    {
        key: "system",
        title: "Sistema",
        description: "Actualizaciones y mejoras de la plataforma",
        icon: "info",
        iconBg: COLORS.gray100,
        iconColor: COLORS.gray500,
    },
];

export default function NotificationSettingsScreen() {
    const { user, token } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        escalations: true,
        appointments: true,
        reviews: true,
        earnings: true,
        billing: true,
        system: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadPreferences = useCallback(async () => {
        if (!token || !user?._id) return;

        try {
            const prefs = await notificationsApi.getPreferences(token, user._id);
            if (prefs) {
                setPreferences(prefs);
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            setLoading(false);
        }
    }, [token, user?._id]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!token || !user?._id) return;

        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }));
        setSaving(true);

        try {
            const success = await notificationsApi.updatePreferences(token, user._id, {
                [key]: value,
            });
            if (!success) {
                // Revert on failure
                setPreferences(prev => ({ ...prev, [key]: !value }));
            }
        } catch (error) {
            console.error("Error updating preference:", error);
            setPreferences(prev => ({ ...prev, [key]: !value }));
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={styles.headerButton}>
                    {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <MaterialIcons name="notifications-active" size={20} color={COLORS.primary} />
                        <Text style={styles.infoBannerText}>
                            Configura qué notificaciones quieres recibir en tu panel profesional
                        </Text>
                    </View>

                    {/* Categories */}
                    <View style={styles.categoriesContainer}>
                        {NOTIFICATION_CATEGORIES.map((category, index) => (
                            <View
                                key={category.key}
                                style={[
                                    styles.categoryCard,
                                    index === NOTIFICATION_CATEGORIES.length - 1 && styles.categoryCardLast,
                                ]}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: category.iconBg }]}>
                                    <MaterialIcons
                                        name={category.icon as any}
                                        size={22}
                                        color={category.iconColor}
                                    />
                                </View>
                                <View style={styles.categoryContent}>
                                    <View style={styles.categoryTitleRow}>
                                        <Text style={styles.categoryTitle}>{category.title}</Text>
                                        {category.critical && (
                                            <View style={styles.criticalBadge}>
                                                <Text style={styles.criticalBadgeText}>Crítico</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.categoryDescription}>
                                        {category.description}
                                    </Text>
                                </View>
                                <Switch
                                    value={preferences[category.key]}
                                    onValueChange={(value) => handleToggle(category.key, value)}
                                    trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                                    thumbColor={COLORS.white}
                                    ios_backgroundColor={COLORS.gray300}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Footer Note */}
                    <Text style={styles.footerNote}>
                        Las notificaciones de escalaciones siempre están recomendadas ya que son críticas para tu negocio.
                    </Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.blue50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primary,
        lineHeight: 20,
    },
    categoriesContainer: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    categoryCardLast: {
        borderBottomWidth: 0,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryContent: {
        flex: 1,
    },
    categoryTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    categoryTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    criticalBadge: {
        backgroundColor: COLORS.orange50,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    criticalBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.orange500,
    },
    categoryDescription: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    footerNote: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: "center",
        marginTop: 20,
        paddingHorizontal: 20,
        lineHeight: 18,
    },
});
