/**
 * Subscription Success Screen
 * 
 * Shown after successful subscription checkout.
 * Deep link: twinpro://subscription/success
 */

import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    textMain: "#111418",
    textMuted: "#617589",
    green500: "#22c55e",
    green50: "#f0fdf4",
    green700: "#15803d",
    white: "#FFFFFF",
    professional: "#3b82f6",
};

export default function SubscriptionSuccessScreen() {
    const { refreshUser } = useAuth();

    // Refresh user data to get updated subscription
    useEffect(() => {
        refreshUser?.();
    }, [refreshUser]);

    const handleViewPlans = () => {
        router.replace("/(settings)/plans-credits" as any);
    };

    const handleGoHome = () => {
        router.replace("/(tabs)/pro-dashboard" as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="workspace-premium" size={64} color={COLORS.professional} />
                    </View>
                </View>

                {/* Title and Message */}
                <Text style={styles.title}>¡Suscripción Activada!</Text>
                <Text style={styles.message}>
                    Tu plan se ha activado correctamente. Ahora tienes acceso a todas las funcionalidades incluidas.
                </Text>
                <Text style={styles.subMessage}>
                    Tu suscripción se renovará automáticamente cada mes.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleViewPlans}
                    >
                        <MaterialIcons name="credit-card" size={20} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Ver Mi Plan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.secondaryButtonText}>Ir al Dashboard</Text>
                    </TouchableOpacity>
                </View>
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
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.green50,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.green500,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
        textAlign: "center",
    },
    message: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 8,
        lineHeight: 24,
    },
    subMessage: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 40,
    },
    buttonContainer: {
        width: "100%",
        gap: 12,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    secondaryButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
});
