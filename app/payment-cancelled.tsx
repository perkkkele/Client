import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    textMuted: "#617589",
    red500: "#ef4444",
    red50: "#fef2f2",
    red700: "#b91c1c",
    white: "#FFFFFF",
};

export default function PaymentCancelledScreen() {
    const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();

    const handleRetryPayment = () => {
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
                {/* Error Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="close" size={64} color={COLORS.red700} />
                    </View>
                </View>

                {/* Title and Message */}
                <Text style={styles.title}>Pago Cancelado</Text>
                <Text style={styles.message}>
                    El pago no se ha completado. Tu cita sigue pendiente de pago.
                </Text>
                <Text style={styles.subMessage}>
                    Puedes reintentar el pago desde los detalles de la cita.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleRetryPayment}
                    >
                        <MaterialIcons name="refresh" size={20} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Reintentar Pago</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
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
        backgroundColor: COLORS.red50,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.red500,
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
