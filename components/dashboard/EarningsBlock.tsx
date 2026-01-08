/**
 * EarningsBlock Component
 * 
 * Dashboard block showing earnings overview and quick access to payment settings.
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";
import { stripeConnectApi } from "../../api";
import type { ConnectBalance, ConnectStatus } from "../../api/stripeConnect";

interface EarningsBlockProps {
    token: string | null;
}

export default function EarningsBlock({ token }: EarningsBlockProps) {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<ConnectStatus | null>(null);
    const [balance, setBalance] = useState<ConnectBalance | null>(null);

    const loadData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Get connect status
            const connectStatus = await stripeConnectApi.getConnectStatus(token);
            setStatus(connectStatus);

            // If onboarded, get balance
            if (connectStatus.onboarded) {
                const balanceData = await stripeConnectApi.getBalance(token);
                setBalance(balanceData);
            }
        } catch (error) {
            console.error("[EarningsBlock] Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatCents = (cents: number) => {
        return stripeConnectApi.formatCents(cents, "EUR");
    };

    // Not connected state
    if (!status?.connected || !status?.onboarded) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.green600} />
                    </View>
                    <Text style={styles.headerTitle}>Mis Ingresos</Text>
                </View>

                <View style={styles.setupContainer}>
                    <View style={styles.setupIconContainer}>
                        <MaterialIcons name="account-balance" size={40} color={COLORS.gray400} />
                    </View>
                    <Text style={styles.setupTitle}>Configura tu cuenta de pagos</Text>
                    <Text style={styles.setupDescription}>
                        Conecta tu cuenta bancaria para recibir pagos directamente de tus clientes.
                    </Text>
                    <TouchableOpacity
                        style={styles.setupButton}
                        onPress={() => router.push("/(settings)/stripe-onboarding")}
                    >
                        <MaterialIcons name="add" size={18} color={COLORS.textMain} />
                        <Text style={styles.setupButtonText}>Configurar ahora</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Connected state
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.green600} />
                </View>
                <Text style={styles.headerTitle}>Mis Ingresos</Text>
                <View style={styles.verifiedBadge}>
                    <MaterialIcons name="check-circle" size={14} color={COLORS.green600} />
                    <Text style={styles.verifiedText}>Verificado</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.green600} />
                </View>
            ) : (
                <>
                    {/* Balance Cards */}
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>Disponible</Text>
                            <Text style={styles.balanceAmount}>
                                {formatCents(balance?.available || 0)}
                            </Text>
                        </View>
                        <View style={[styles.balanceCard, styles.balanceCardSecondary]}>
                            <Text style={styles.balanceLabelSecondary}>Pendiente</Text>
                            <Text style={styles.balanceAmountSecondary}>
                                {formatCents(balance?.pending || 0)}
                            </Text>
                        </View>
                    </View>

                    {/* Fee Info */}
                    <View style={styles.feeInfo}>
                        <MaterialIcons name="info-outline" size={14} color={COLORS.gray500} />
                        <Text style={styles.feeText}>
                            Comisión TwinPro: 10% por transacción
                        </Text>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/(settings)/my-earnings")}
                        >
                            <MaterialIcons name="trending-up" size={18} color={COLORS.textMain} />
                            <Text style={styles.actionButtonText}>Ver todo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={async () => {
                                if (token) {
                                    try {
                                        await stripeConnectApi.openStripeDashboard(token);
                                    } catch (err) {
                                        console.error("Error opening Stripe:", err);
                                    }
                                }
                            }}
                        >
                            <MaterialIcons name="open-in-new" size={18} color={COLORS.textMain} />
                            <Text style={styles.actionButtonText}>Stripe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/(settings)/stripe-onboarding")}
                        >
                            <MaterialIcons name="settings" size={18} color={COLORS.textMain} />
                            <Text style={styles.actionButtonText}>Ajustes</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: "#F0FDF4", // Light green (green-50)
        borderWidth: 1,
        borderColor: "#BBF7D0", // Soft green border (green-200)
        padding: 16,
        shadowColor: "#22C55E",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.green50,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.green600,
    },
    loadingContainer: {
        paddingVertical: 32,
        alignItems: "center",
    },
    balanceRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: COLORS.textMain,
        borderRadius: 12,
        padding: 14,
    },
    balanceCardSecondary: {
        backgroundColor: "#FFFFFF",
    },
    balanceLabel: {
        fontSize: 11,
        color: COLORS.gray400,
        marginBottom: 4,
    },
    balanceLabelSecondary: {
        fontSize: 11,
        color: COLORS.gray500,
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 22,
        fontWeight: "700",
        color: "#F9F506", // TwinPro yellow
    },
    balanceAmountSecondary: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    feeInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        marginBottom: 12,
    },
    feeText: {
        fontSize: 11,
        color: COLORS.gray500,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: COLORS.gray100,
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Setup state styles
    setupContainer: {
        alignItems: "center",
        paddingVertical: 8,
    },
    setupIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    setupTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 6,
    },
    setupDescription: {
        fontSize: 13,
        color: COLORS.gray500,
        textAlign: "center",
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    setupButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F9F506",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    setupButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textMain,
    },
});
