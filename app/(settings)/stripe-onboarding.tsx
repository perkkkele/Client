/**
 * Stripe Onboarding Screen
 * 
 * Allows professionals to connect their Stripe account to receive direct payments.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context";
import { stripeConnectApi } from "../../api";

// Colores del tema TwinPro
const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    textDark: "#181811",
    white: "#ffffff",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    stripe: "#635bff",
};

interface ConnectStatus {
    connected: boolean;
    onboarded: boolean;
    detailsSubmitted?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    requirements?: {
        currentlyDue: string[];
        pastDue: string[];
    };
}

export default function StripeOnboardingScreen() {
    const { token, user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<ConnectStatus | null>(null);

    const loadStatus = useCallback(async () => {
        if (!token) return;

        try {
            const connectStatus = await stripeConnectApi.getConnectStatus(token);
            setStatus(connectStatus);
        } catch (error) {
            console.error("Error loading connect status:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadStatus();
        refreshUser?.();
    }, [loadStatus, refreshUser]);

    const handleStartOnboarding = async () => {
        if (!token) return;

        setActionLoading(true);
        try {
            const opened = await stripeConnectApi.openOnboarding(token);
            if (!opened) {
                Alert.alert(
                    "Error",
                    "No se pudo abrir la página de Stripe. Inténtalo de nuevo."
                );
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error iniciando el proceso");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenDashboard = async () => {
        if (!token) return;

        setActionLoading(true);
        try {
            const opened = await stripeConnectApi.openStripeDashboard(token);
            if (!opened) {
                Alert.alert(
                    "Error",
                    "No se pudo abrir el dashboard de Stripe."
                );
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error abriendo dashboard");
        } finally {
            setActionLoading(false);
        }
    };

    const renderStatus = () => {
        if (!status?.connected) {
            return (
                <View style={styles.statusCard}>
                    <View style={[styles.statusIcon, { backgroundColor: COLORS.gray100 }]}>
                        <MaterialIcons name="account-balance" size={32} color={COLORS.gray500} />
                    </View>
                    <Text style={styles.statusTitle}>Sin cuenta conectada</Text>
                    <Text style={styles.statusDescription}>
                        Conecta tu cuenta bancaria para empezar a recibir pagos directamente de tus clientes.
                    </Text>
                </View>
            );
        }

        if (!status.onboarded) {
            return (
                <View style={styles.statusCard}>
                    <View style={[styles.statusIcon, { backgroundColor: "#fef3c7" }]}>
                        <MaterialIcons name="pending" size={32} color={COLORS.warning} />
                    </View>
                    <Text style={styles.statusTitle}>Verificación pendiente</Text>
                    <Text style={styles.statusDescription}>
                        Tu cuenta está creada pero necesitas completar la verificación para poder recibir pagos.
                    </Text>
                    {status.requirements?.currentlyDue && status.requirements.currentlyDue.length > 0 && (
                        <View style={styles.requirementsList}>
                            <Text style={styles.requirementsTitle}>Información requerida:</Text>
                            {status.requirements.currentlyDue.slice(0, 3).map((req, index) => (
                                <Text key={index} style={styles.requirementItem}>
                                    • {formatRequirement(req)}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: "#d1fae5" }]}>
                    <MaterialIcons name="check-circle" size={32} color={COLORS.success} />
                </View>
                <Text style={styles.statusTitle}>¡Cuenta verificada!</Text>
                <Text style={styles.statusDescription}>
                    Tu cuenta está lista para recibir pagos. Los ingresos se transferirán automáticamente a tu cuenta bancaria.
                </Text>
                <View style={styles.statusDetails}>
                    <View style={styles.statusRow}>
                        <MaterialIcons
                            name={status.chargesEnabled ? "check" : "close"}
                            size={18}
                            color={status.chargesEnabled ? COLORS.success : COLORS.error}
                        />
                        <Text style={styles.statusRowText}>Puede recibir pagos</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <MaterialIcons
                            name={status.payoutsEnabled ? "check" : "close"}
                            size={18}
                            color={status.payoutsEnabled ? COLORS.success : COLORS.error}
                        />
                        <Text style={styles.statusRowText}>Puede recibir transferencias</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Configurar Pagos</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.stripe} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurar Pagos</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Status Card */}
                {renderStatus()}

                {/* Benefits Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Beneficios</Text>

                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <MaterialIcons name="flash-on" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Pagos directos</Text>
                            <Text style={styles.benefitDescription}>
                                Recibe el dinero directamente en tu cuenta bancaria
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <MaterialIcons name="security" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Seguridad garantizada</Text>
                            <Text style={styles.benefitDescription}>
                                Stripe procesa millones de transacciones de forma segura
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <MaterialIcons name="schedule" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Transferencias rápidas</Text>
                            <Text style={styles.benefitDescription}>
                                El dinero llega a tu cuenta en 2-7 días hábiles
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Fee Info */}
                <View style={styles.feeCard}>
                    <MaterialIcons name="info-outline" size={20} color={COLORS.gray600} />
                    <Text style={styles.feeText}>
                        TwinPro retiene una comisión del 10% por cada pago procesado.
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {!status?.connected || !status?.onboarded ? (
                        <TouchableOpacity
                            style={[styles.primaryButton, actionLoading && styles.buttonDisabled]}
                            onPress={handleStartOnboarding}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color={COLORS.textDark} />
                            ) : (
                                <>
                                    <MaterialIcons name="account-balance" size={22} color={COLORS.textDark} />
                                    <Text style={styles.primaryButtonText}>
                                        {status?.connected ? "Continuar verificación" : "Conectar cuenta bancaria"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push("/(settings)/my-earnings")}
                            >
                                <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.textDark} />
                                <Text style={styles.primaryButtonText}>Ver mis ingresos</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, actionLoading && styles.buttonDisabled]}
                                onPress={handleOpenDashboard}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.stripe} />
                                ) : (
                                    <>
                                        <MaterialIcons name="open-in-new" size={20} color={COLORS.stripe} />
                                        <Text style={styles.secondaryButtonText}>Abrir dashboard de Stripe</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Powered by Stripe */}
                <View style={styles.poweredBy}>
                    <Text style={styles.poweredByText}>Pagos procesados por</Text>
                    <Text style={[styles.poweredByText, { color: COLORS.stripe, fontWeight: "bold" }]}>
                        Stripe
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function formatRequirement(req: string): string {
    const map: Record<string, string> = {
        "individual.verification.document": "Documento de identidad",
        "individual.first_name": "Nombre",
        "individual.last_name": "Apellido",
        "individual.dob": "Fecha de nacimiento",
        "individual.address": "Dirección",
        "external_account": "Cuenta bancaria",
        "business_profile.url": "Sitio web o perfil",
        "tos_acceptance": "Aceptar términos",
    };
    return map[req] || req.replace(/_/g, " ");
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
        color: COLORS.textDark,
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textDark,
        marginBottom: 8,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 20,
    },
    statusDetails: {
        marginTop: 16,
        width: "100%",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 4,
    },
    statusRowText: {
        fontSize: 14,
        color: COLORS.gray600,
    },
    requirementsList: {
        marginTop: 16,
        width: "100%",
        backgroundColor: COLORS.gray100,
        borderRadius: 8,
        padding: 12,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.gray600,
        marginBottom: 8,
    },
    requirementItem: {
        fontSize: 13,
        color: COLORS.gray500,
        paddingVertical: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textDark,
        marginBottom: 16,
    },
    benefitItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.backgroundDark,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textDark,
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    feeCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 24,
    },
    feeText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray600,
        lineHeight: 18,
    },
    actionsContainer: {
        gap: 12,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        height: 56,
        paddingHorizontal: 24,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textDark,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.white,
        borderRadius: 28,
        height: 48,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.stripe,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    poweredBy: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        marginTop: 24,
    },
    poweredByText: {
        fontSize: 12,
        color: COLORS.gray400,
    },
});
