import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context";
import { confirmPaymentSuccess } from "../api/payment";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    textMuted: "#617589",
    green500: "#22c55e",
    green50: "#f0fdf4",
    green700: "#15803d",
    white: "#FFFFFF",
};

export default function PaymentSuccessScreen() {
    const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
    const { token } = useAuth();
    const [isConfirming, setIsConfirming] = useState(true);
    const [confirmed, setConfirmed] = useState(false);

    // Confirm payment on mount
    useEffect(() => {
        async function confirmPayment() {
            if (!token || !appointmentId) {
                setIsConfirming(false);
                return;
            }

            try {
                console.log("[PaymentSuccess] Confirming payment for:", appointmentId);
                await confirmPaymentSuccess(token, appointmentId);
                console.log("[PaymentSuccess] Payment confirmed successfully");
                setConfirmed(true);
            } catch (error) {
                console.error("[PaymentSuccess] Error confirming payment:", error);
                // Don't block the user, just log the error
            } finally {
                setIsConfirming(false);
            }
        }

        confirmPayment();
    }, [token, appointmentId]);

    const handleViewAppointment = () => {
        if (appointmentId) {
            router.replace(`/appointment-details/${appointmentId}` as any);
        } else {
            router.replace("/(tabs)");
        }
    };

    const handleGoHome = () => {
        router.replace("/(tabs)");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        {isConfirming ? (
                            <ActivityIndicator size="large" color={COLORS.green700} />
                        ) : (
                            <MaterialIcons name="check" size={64} color={COLORS.green700} />
                        )}
                    </View>
                </View>

                {/* Title and Message */}
                <Text style={styles.title}>
                    {isConfirming ? "Confirmando Pago..." : "¡Pago Completado!"}
                </Text>
                <Text style={styles.message}>
                    {isConfirming
                        ? "Por favor espera mientras confirmamos tu pago."
                        : "Tu cita ha sido confirmada y el pago se ha procesado correctamente."
                    }
                </Text>
                {!isConfirming && (
                    <Text style={styles.subMessage}>
                        Recibirás una notificación como recordatorio antes de tu cita.
                    </Text>
                )}
                {!isConfirming && (
                    <Text style={styles.fiscalNote}>
                        Para solicitar factura, contacta directamente con el profesional.
                    </Text>
                )}

                {/* Buttons - Only show when not confirming */}
                {!isConfirming && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleViewAppointment}
                        >
                            <MaterialIcons name="event" size={20} color={COLORS.white} />
                            <Text style={styles.primaryButtonText}>Ver Cita</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleGoHome}
                        >
                            <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        marginBottom: 8,
    },
    fiscalNote: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 40,
        fontStyle: "italic",
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
