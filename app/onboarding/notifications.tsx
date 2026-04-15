import { router } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context";
import { registerForPushNotifications, registerPushTokenWithServer } from "../../services/notifications";

const COLORS = {
    primary: "#FFF200",
    primaryDark: "#DBCF00",
    backgroundLight: "#F5F5F5",
    cardLight: "#FFFFFF",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray100: "#F3F4F6",
    gray800: "#1F2937",
};

export default function NotificationsScreen() {
    const { t } = useTranslation('onboarding');
    const { token } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    function handleSkip() {
        router.push("/onboarding/complete-profile");
    }

    async function handleContinue() {
        if (notificationsEnabled) {
            try {
                const pushToken = await registerForPushNotifications();
                if (pushToken && token) {
                    await registerPushTokenWithServer(token, pushToken);
                }
            } catch (error) {
                console.error("[Onboarding] Error requesting notification permissions:", error);
            }
        }
        // Always navigate forward regardless of permission result
        router.push("/onboarding/complete-profile");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
            {/* Skip button */}
            <View style={styles.topBar}>
                <View style={{ width: 48 }} />
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipText}>{t('notificationsScreen.skip')}</Text>
                </TouchableOpacity>
            </View>

            {/* Main content */}
            <View style={styles.mainContent}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.glowEffect} />

                    {/* Central notification icon */}
                    <View style={styles.centralIcon}>
                        <MaterialIcons name="notifications-active" size={48} color={COLORS.primary} />
                    </View>

                    {/* Floating icons */}
                    <View style={[styles.floatingIcon, styles.floatingTopRight]}>
                        <MaterialIcons name="medical-services" size={20} color="#3B82F6" />
                    </View>
                    <View style={[styles.floatingIcon, styles.floatingBottomLeft]}>
                        <MaterialIcons name="support-agent" size={28} color="#22C55E" />
                    </View>

                    {/* Notification badge */}
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>2</Text>
                    </View>
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>{t('notificationsScreen.title')}</Text>
                    <Text style={styles.description}>
                        {t('notificationsScreen.description')}
                    </Text>
                </View>

                {/* Toggle card */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleContent}>
                        <View style={styles.toggleIconContainer}>
                            <MaterialIcons name="notifications" size={24} color={COLORS.primaryDark} />
                        </View>
                        <View style={styles.toggleText}>
                            <Text style={styles.toggleTitle}>{t('notificationsScreen.toggleTitle')}</Text>
                            <Text style={styles.toggleSubtitle}>{t('notificationsScreen.toggleSubtitle')}</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: "#D1D5DB", true: COLORS.primary }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#D1D5DB"
                    />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                >
                    <Text style={styles.continueButtonText}>{t('notificationsScreen.continueButton')}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.footerNote}>
                    {t('notificationsScreen.footerNote')}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    skipText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
    mainContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    illustrationContainer: {
        width: 160,
        height: 160,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
    },
    glowEffect: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255, 242, 0, 0.2)",
    },
    centralIcon: {
        width: 96,
        height: 96,
        borderRadius: 24,
        backgroundColor: COLORS.cardLight,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    floatingIcon: {
        position: "absolute",
        backgroundColor: COLORS.cardLight,
        borderRadius: 20,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    floatingTopRight: {
        top: -16,
        right: 8,
    },
    floatingBottomLeft: {
        bottom: -8,
        left: -16,
    },
    notificationBadge: {
        position: "absolute",
        top: 0,
        left: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.backgroundLight,
    },
    notificationBadgeText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    textContent: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    toggleCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.cardLight,
        padding: 16,
        borderRadius: 20,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    toggleContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    toggleIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 242, 0, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    toggleText: {
        gap: 2,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    toggleSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 20,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: "#000000",
        fontSize: 17,
        fontWeight: "bold",
    },
    footerNote: {
        marginTop: 16,
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: "center",
    },
});
