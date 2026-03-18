import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context";
import { useTranslation } from 'react-i18next';

const COLORS = {
    primary: "#FFED00",
    backgroundLight: "#F5F5F7",
    textMain: "#1C1C1E",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    white: "#FFFFFF",
    error: "#EF4444",
};

const SUPPORT_EMAIL = "soporte@twinpro.app";

export default function AccountSuspendedScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const params = useLocalSearchParams<{ reason?: string }>();
    const { t } = useTranslation('auth');

    const handleContactSupport = () => {
        const subject = encodeURIComponent(t('accountSuspended.emailSubject'));
        const body = encodeURIComponent(t('accountSuspended.emailBody'));
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Warning Icon */}
                <View style={styles.iconContainer}>
                    <MaterialIcons name="block" size={80} color={COLORS.error} />
                </View>

                {/* Title */}
                <Text style={styles.title}>{t('accountSuspended.title')}</Text>

                {/* Description */}
                <Text style={styles.description}>
                    {t('accountSuspended.description')}
                </Text>

                {params.reason && (
                    <View style={styles.reasonContainer}>
                        <Text style={styles.reasonLabel}>{t('accountSuspended.reasonLabel')}</Text>
                        <Text style={styles.reasonText}>{params.reason}</Text>
                    </View>
                )}

                <Text style={styles.infoText}>
                    {t('accountSuspended.infoText')}
                </Text>

                {/* Contact Support Button */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleContactSupport}
                >
                    <MaterialIcons name="email" size={20} color={COLORS.textMain} />
                    <Text style={styles.primaryButtonText}>{t('accountSuspended.contactSupport')}</Text>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.secondaryButtonText}>{t('accountSuspended.logout')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textMain,
        marginBottom: 16,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 16,
    },
    reasonContainer: {
        backgroundColor: "#FEF3C7",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        width: "100%",
    },
    reasonLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#92400E",
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        color: "#92400E",
    },
    infoText: {
        fontSize: 14,
        color: COLORS.gray400,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: "100%",
        gap: 8,
        marginBottom: 16,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    secondaryButton: {
        paddingVertical: 12,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: COLORS.gray400,
    },
});
