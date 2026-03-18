/**
 * My Earnings Screen
 * 
 * Shows the professional's earnings, balance, and payout history.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Platform,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context";
import { stripeConnectApi } from "../../api";
import type { ConnectBalance, Payout } from "../../api/stripeConnect";
import { useTranslation } from 'react-i18next';

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

export default function MyEarningsScreen() {
    const { token, user, refreshUser } = useAuth();
    const { t } = useTranslation('settings');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState<ConnectBalance | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

    const loadData = useCallback(async () => {
        if (!token) return;

        try {
            setError(null);

            // First check connect status
            const status = await stripeConnectApi.getConnectStatus(token);
            setIsOnboarded(status.onboarded);

            // If onboarded, load balance and payouts
            if (status.onboarded) {
                const [balanceData, payoutsData] = await Promise.all([
                    stripeConnectApi.getBalance(token),
                    stripeConnectApi.getPayouts(token, 20),
                ]);

                setBalance(balanceData);
                setPayouts(payoutsData);

                // Also refresh user data to update local cache
                if (refreshUser) refreshUser();
            }
        } catch (err: any) {
            console.error("Error loading earnings:", err);
            setError(err.message || t('myEarningsScreen.errorLoading'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, refreshUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const handleOpenDashboard = async () => {
        if (!token) return;
        try {
            await stripeConnectApi.openStripeDashboard(token);
        } catch (err) {
            console.error("Error opening dashboard:", err);
        }
    };

    const formatPrice = (cents: number) => {
        return stripeConnectApi.formatCents(cents, "EUR");
    };

    const getPayoutStatusInfo = (status: string) => {
        switch (status) {
            case "paid":
                return { label: t('myEarningsScreen.statusCompleted'), color: COLORS.success, icon: "check-circle" as const };
            case "pending":
                return { label: t('myEarningsScreen.statusPending'), color: COLORS.warning, icon: "schedule" as const };
            case "in_transit":
                return { label: t('myEarningsScreen.statusInTransit'), color: COLORS.stripe, icon: "local-shipping" as const };
            case "failed":
                return { label: t('myEarningsScreen.statusFailed'), color: COLORS.error, icon: "error" as const };
            default:
                return { label: status, color: COLORS.gray500, icon: "help" as const };
        }
    };

    const renderPayout = ({ item }: { item: Payout }) => {
        const statusInfo = getPayoutStatusInfo(item.status);
        const date = new Date(item.arrivalDate);

        return (
            <View style={styles.payoutItem}>
                <View style={styles.payoutLeft}>
                    <MaterialIcons name={statusInfo.icon} size={24} color={statusInfo.color} />
                    <View style={styles.payoutInfo}>
                        <Text style={styles.payoutAmount}>{formatPrice(item.amount)}</Text>
                        <Text style={styles.payoutDate}>
                            {date.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            })}
                        </Text>
                    </View>
                </View>
                <View style={[styles.payoutStatus, { backgroundColor: `${statusInfo.color}15` }]}>
                    <Text style={[styles.payoutStatusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
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
                    <Text style={styles.headerTitle}>{t('myEarningsScreen.headerTitle')}</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // If not connected to Stripe
    if (!isOnboarded) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('myEarningsScreen.headerTitle')}</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyState}>
                    <MaterialIcons name="account-balance-wallet" size={64} color={COLORS.gray400} />
                    <Text style={styles.emptyTitle}>{t('myEarningsScreen.setupTitle')}</Text>
                    <Text style={styles.emptyDescription}>
                        {t('myEarningsScreen.setupDesc')}
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push("/(settings)/stripe-onboarding")}
                    >
                        <Text style={styles.primaryButtonText}>{t('myEarningsScreen.setupNow')}</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>{t('myEarningsScreen.headerTitle')}</Text>
                <TouchableOpacity style={styles.headerAction} onPress={handleOpenDashboard}>
                    <MaterialIcons name="open-in-new" size={22} color={COLORS.stripe} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {error ? (
                    <View style={styles.errorCard}>
                        <MaterialIcons name="error-outline" size={24} color={COLORS.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : (
                    <>
                        {/* Balance Cards */}
                        <View style={styles.balanceContainer}>
                            <View style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>{t('myEarningsScreen.available')}</Text>
                                <Text style={styles.balanceAmount}>
                                    {formatPrice(balance?.available || 0)}
                                </Text>
                                <Text style={styles.balanceHint}>{t('myEarningsScreen.readyToTransfer')}</Text>
                            </View>

                            <View style={[styles.balanceCard, styles.balanceCardSecondary]}>
                                <Text style={styles.balanceLabelSecondary}>{t('myEarningsScreen.pending')}</Text>
                                <Text style={styles.balanceAmountSecondary}>
                                    {formatPrice(balance?.pending || 0)}
                                </Text>
                                <Text style={styles.balanceHintSecondary}>{t('myEarningsScreen.inProcess')}</Text>
                            </View>
                        </View>

                        {/* Info Card */}
                        <View style={styles.infoCard}>
                            <MaterialIcons name="info-outline" size={18} color={COLORS.gray500} />
                            <Text style={styles.infoText}>
                                {t('myEarningsScreen.transferInfo')}
                            </Text>
                        </View>

                        {/* Payouts Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('myEarningsScreen.transfers')}</Text>

                            {payouts.length === 0 ? (
                                <View style={styles.emptyPayouts}>
                                    <MaterialIcons name="account-balance" size={40} color={COLORS.gray400} />
                                    <Text style={styles.emptyPayoutsText}>
                                        {t('myEarningsScreen.noTransfers')}
                                    </Text>
                                    <Text style={styles.emptyPayoutsHint}>
                                        {t('myEarningsScreen.noTransfersHint')}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.payoutsList}>
                                    {payouts.map((payout) => (
                                        <View key={payout.id}>
                                            {renderPayout({ item: payout })}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
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
    headerAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
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
    balanceContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        borderRadius: 16,
        padding: 20,
    },
    balanceCardSecondary: {
        backgroundColor: COLORS.white,
    },
    balanceLabel: {
        fontSize: 13,
        color: COLORS.gray400,
        marginBottom: 8,
    },
    balanceLabelSecondary: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.primary,
        marginBottom: 4,
    },
    balanceAmountSecondary: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textDark,
        marginBottom: 4,
    },
    balanceHint: {
        fontSize: 12,
        color: COLORS.gray400,
    },
    balanceHintSecondary: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray600,
        lineHeight: 18,
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
    payoutsList: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: "hidden",
    },
    payoutItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    payoutLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    payoutInfo: {
        gap: 2,
    },
    payoutAmount: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textDark,
    },
    payoutDate: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    payoutStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    payoutStatusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    emptyPayouts: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
    },
    emptyPayoutsText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textDark,
        marginTop: 12,
    },
    emptyPayoutsHint: {
        fontSize: 13,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textDark,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textDark,
    },
    errorCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.error,
    },
});
