import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
import { userApi } from "../../api";
import { useAlert } from "../../components/TwinProAlert";

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
    red500: "#ef4444",
    red50: "#fef2f2",
};

interface ClientNotificationPreferences {
    appointments: boolean;
    reminders: boolean;
    payments: boolean;
    escalation_response: boolean;
}

interface NotificationCategory {
    key: keyof ClientNotificationPreferences;
    title: string;
    description: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    critical?: boolean;
    warningOnDisable?: string;
}



export default function ClientNotificationSettingsScreen() {
    const { user, token, updateUserProfile } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('settings');

    const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
        {
            key: "appointments",
            title: t('clientNotificationSettings.categories.appointments'),
            description: t('clientNotificationSettings.categories.appointmentsDesc'),
            icon: "calendar-today",
            iconBg: COLORS.blue50,
            iconColor: COLORS.blue500,
        },
        {
            key: "reminders",
            title: t('clientNotificationSettings.categories.reminders'),
            description: t('clientNotificationSettings.categories.remindersDesc'),
            icon: "alarm",
            iconBg: COLORS.orange50,
            iconColor: COLORS.orange500,
            critical: true,
            warningOnDisable: t('clientNotificationSettings.categories.remindersWarning'),
        },
        {
            key: "payments",
            title: t('clientNotificationSettings.categories.payments'),
            description: t('clientNotificationSettings.categories.paymentsDesc'),
            icon: "payment",
            iconBg: COLORS.green50,
            iconColor: COLORS.green500,
        },
        {
            key: "escalation_response",
            title: t('clientNotificationSettings.categories.escalation'),
            description: t('clientNotificationSettings.categories.escalationDesc'),
            icon: "support-agent",
            iconBg: COLORS.orange50,
            iconColor: COLORS.orange500,
        },
    ];
    const [preferences, setPreferences] = useState<ClientNotificationPreferences>({
        appointments: true,
        reminders: true,
        payments: true,
        escalation_response: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadPreferences = useCallback(async () => {
        if (!user?._id) return;

        try {
            // Load from user object, ensuring all properties have values
            const userPrefs = user.clientNotificationPreferences;
            setPreferences({
                appointments: userPrefs?.appointments ?? true,
                reminders: userPrefs?.reminders ?? true,
                payments: userPrefs?.payments ?? true,
                escalation_response: userPrefs?.escalation_response ?? true,
            });
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    const handleToggle = async (key: keyof ClientNotificationPreferences, value: boolean) => {
        if (!token || !user?._id) return;

        // If disabling reminders, show warning
        const category = NOTIFICATION_CATEGORIES.find(c => c.key === key);
        if (!value && category?.warningOnDisable) {
            showAlert({
                type: 'warning',
                title: t('clientNotificationSettings.warningTitle'),
                message: '',
                buttons: [
                    {
                        text: t('clientNotificationSettings.keepActive'),
                        style: "cancel",
                    },
                    {
                        text: t('clientNotificationSettings.deactivate'),
                        style: "destructive",
                        onPress: () => performToggle(key, value),
                    },
                ]
            });
            return;
        }

        performToggle(key, value);
    };

    const performToggle = async (key: keyof ClientNotificationPreferences, value: boolean) => {
        if (!token || !user?._id) return;

        // Optimistic update
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        setSaving(true);

        try {
            // Update user profile with new preferences
            const updatedUser = await userApi.updateProfile(token, {
                clientNotificationPreferences: newPrefs,
            });

            if (updatedUser) {
                await updateUserProfile(updatedUser);
            }
        } catch (error) {
            console.error("Error updating preference:", error);
            // Revert on failure
            setPreferences(prev => ({ ...prev, [key]: !value }));
            showAlert({ type: 'error', title: 'Error', message: t('clientNotificationSettings.errorUpdate') });
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
                <Text style={styles.headerTitle}>{t('clientNotificationSettings.headerTitle')}</Text>
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
                            {t('clientNotificationSettings.infoBanner')}
                        </Text>
                    </View>

                    {/* Always Active Banner */}
                    <View style={styles.alwaysActiveBanner}>
                        <MaterialIcons name="videocam" size={18} color={COLORS.green500} />
                        <Text style={styles.alwaysActiveText}>
                            {t('clientNotificationSettings.alwaysActive')}
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
                                                <Text style={styles.criticalBadgeText}>{t('clientNotificationSettings.important')}</Text>
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
                        {t('clientNotificationSettings.footerNote')}
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
        marginBottom: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primary,
        lineHeight: 20,
    },
    alwaysActiveBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: COLORS.green50,
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    alwaysActiveText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.green500,
        fontWeight: "500",
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
