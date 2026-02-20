/**
 * Plans & Credits Screen
 * 
 * Subscription management for professional users.
 * Shows current plan, usage stats, and upgrade options.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,    RefreshControl,
    Modal,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../context/AuthContext";
import { subscriptionApi } from "../../api";
import type { SubscriptionStatus, SubscriptionPlan } from "../../api/subscription";
import { useAlert } from "../../components/TwinProAlert";

const COLORS = {
    primary: "#137fec",
    background: "#f6f7f9",
    white: "#ffffff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray800: "#1f2937",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    starter: "#6b7280",
    professional: "#3b82f6",
    premium: "#8b5cf6",
};

const PLAN_COLORS: Record<string, string> = {
    starter: COLORS.starter,
    professional: COLORS.professional,
    premium: COLORS.premium,
};

const PLAN_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    starter: "rocket-launch",
    professional: "workspace-premium",
    premium: "diamond",
};

export default function PlansCreditsScreen() {
    const { token, refreshUser } = useAuth();
  const { showAlert } = useAlert();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [extraMinuteCost, setExtraMinuteCost] = useState(30);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    // Professional verification modal
    const [verificationModalVisible, setVerificationModalVisible] = useState(false);
    const [verificationData, setVerificationData] = useState({
        declarationAccepted: false,
        licenseNumber: "",
        additionalInfo: "",
    });
    const [verificationLoading, setVerificationLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!token) {
            console.log('[PlansCredits] No token, skipping load');
            setLoading(false);
            return;
        }
        try {
            console.log('[PlansCredits] Loading subscription data...');

            // Load plans first (doesn't require auth)
            try {
                const plansData = await subscriptionApi.getPlans();
                console.log('[PlansCredits] Plans loaded:', plansData.plans?.length || 0);
                setPlans(plansData.plans);
                setExtraMinuteCost(plansData.extraMinuteCost);
            } catch (plansError) {
                console.error('[PlansCredits] Error loading plans:', plansError);
            }

            // Load status (requires auth)
            try {
                const statusData = await subscriptionApi.getSubscriptionStatus(token);
                console.log('[PlansCredits] Status loaded:', statusData?.plan);
                setStatus(statusData);
            } catch (statusError) {
                console.error('[PlansCredits] Error loading status:', statusError);
            }
        } catch (error) {
            console.error('[PlansCredits] Error loading subscription data:', error);
        } finally {
            console.log('[PlansCredits] Load complete');
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleSubscribe = async (planId: string) => {
        if (!token || planId === "starter") return;

        // Don't allow subscribing to current plan
        if (status?.plan === planId) {
            showAlert({ type: 'info', title: 'Info', message: 'Ya tienes este plan activo' });
            return;
        }

        setCheckoutLoading(planId);
        try {
            // Check if user already has a paid subscription - use upgrade instead
            const hasActiveSubscription = status?.plan &&
                status.plan !== 'starter' &&
                status.status === 'active';

            if (hasActiveSubscription) {
                // Upgrade/downgrade existing subscription
                const result = await subscriptionApi.upgradeSubscription(
                    token,
                    planId as "professional" | "premium"
                );

                await loadData();
                if (refreshUser) await refreshUser();

                showAlert({ type: 'success', title: result.isUpgrade ? "¡Plan mejorado!" : "Plan cambiado", message: result.isUpgrade
                        ? `Has actualizado de ${result.previousPlan} a ${result.newPlan}. El cambio se aplica inmediatamente.`
                        : `Has cambiado de ${result.previousPlan} a ${result.newPlan}. El ajuste se reflejará en tu próxima factura.` })
            } else {
                // New subscription - use checkout
                const session = await subscriptionApi.createCheckoutSession(
                    token,
                    planId as "professional" | "premium"
                );

                if (session.url) {
                    const result = await WebBrowser.openBrowserAsync(session.url);
                    if (result.type === "cancel" || result.type === "dismiss") {
                        await loadData();
                        if (refreshUser) await refreshUser();
                    }
                }
            }
        } catch (error: any) {
            // If upgrade fails because no subscription, fall back to checkout
            if (error.message === 'USE_CHECKOUT') {
                try {
                    const session = await subscriptionApi.createCheckoutSession(
                        token,
                        planId as "professional" | "premium"
                    );
                    if (session.url) {
                        await WebBrowser.openBrowserAsync(session.url);
                        await loadData();
                        if (refreshUser) await refreshUser();
                    }
                } catch (checkoutError: any) {
                    showAlert({ type: 'error', title: 'Error', message: checkoutError.message || "Error al procesar la suscripción" });
                }
            } else {
                showAlert({ type: 'error', title: 'Error', message: error.message || "Error al procesar la suscripción" });
            }
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handleCancelSubscription = () => {
        showAlert({
    type: 'info',
    title: 'Cancelar suscripción',
    message: 'Si cancelas, mantendrás acceso a tu plan actual hasta el final del período facturado. Después volverás al plan Starter.',
    buttons: [
                { text: "No, mantener", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        if (!token) return;
                        try {
                            const result = await subscriptionApi.cancelSubscription(token);
                            await loadData();
                            if (refreshUser) await refreshUser();

                            const cancelDate = result.cancelAt
                                ? new Date(result.cancelAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })
                                : 'el final del período';

                            showAlert({ type: 'info', title: 'Suscripción cancelada', message: `Tu plan se mantendrá activo hasta ${cancelDate}. Después volverás automáticamente al plan Starter.` });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: "Error", message: error.message })
                        }
                    },
                },
            ]
});
    };

    const handleSubmitVerification = async () => {
        if (!token) return;
        if (!verificationData.declarationAccepted) {
            showAlert({ type: 'error', title: 'Error', message: 'Debes aceptar la declaración jurada' });
            return;
        }

        setVerificationLoading(true);
        try {
            await subscriptionApi.submitProfessionalVerification(token, verificationData);
            setVerificationModalVisible(false);
            await loadData();
            if (refreshUser) await refreshUser();
            showAlert({ type: 'warning', title: '¡Verificación completada!', message: 'Has obtenido el badge de Profesional Verificado.' });
        } catch (error: any) {
            showAlert({ type: 'error', title: "Error", message: error.message })
        } finally {
            setVerificationLoading(false);
        }
    };

    const formatPrice = (cents: number) => {
        if (cents === 0) return "Gratis";
        return `${(cents / 100).toFixed(0)}€/mes`;
    };

    const renderUsageBar = () => {
        if (!status) return null;
        const percentage = Math.min(100, (status.minutesUsed / status.minutesIncluded) * 100);
        const isOverLimit = status.minutesUsed > status.minutesIncluded;

        return (
            <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                    <Text style={styles.usageTitle}>Uso de minutos</Text>
                    <Text style={styles.usageCount}>
                        {status.minutesUsed} / {status.minutesIncluded} min
                    </Text>
                </View>
                <View style={styles.usageBarContainer}>
                    <View
                        style={[
                            styles.usageBar,
                            { width: `${percentage}%` },
                            isOverLimit && styles.usageBarOverLimit,
                        ]}
                    />
                </View>
                {isOverLimit && (
                    <View style={styles.extraUsageContainer}>
                        <MaterialIcons name="info" size={16} color={COLORS.warning} />
                        <Text style={styles.extraUsageText}>
                            {status.extraMinutesUsed} min extra ({(extraMinuteCost / 100).toFixed(2)}€/min)
                        </Text>
                    </View>
                )}
                {status.currentPeriodEnd && (
                    <Text style={styles.resetText}>
                        Se reinicia el {new Date(status.currentPeriodEnd).toLocaleDateString("es-ES")}
                    </Text>
                )}
            </View>
        );
    };

    const renderCurrentPlan = () => {
        if (!status) return null;
        const planColor = PLAN_COLORS[status.plan] || COLORS.gray500;
        const planIcon = PLAN_ICONS[status.plan] || "star";

        return (
            <View style={[styles.currentPlanCard, { borderColor: planColor }]}>
                <View style={styles.currentPlanHeader}>
                    <View style={[styles.currentPlanIcon, { backgroundColor: planColor }]}>
                        <MaterialIcons name={planIcon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.currentPlanInfo}>
                        <Text style={styles.currentPlanLabel}>Tu plan actual</Text>
                        <Text style={[styles.currentPlanName, { color: planColor }]}>
                            {status.planName}
                        </Text>
                    </View>
                    {status.status === "active" && (
                        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + "20" }]}>
                            <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>Activo</Text>
                        </View>
                    )}
                </View>

                {/* Badges */}
                <View style={styles.badgesContainer}>
                    {status.verification.identityVerified && (
                        <View style={[styles.badge, { backgroundColor: "#10b98120" }]}>
                            <MaterialIcons name="verified-user" size={16} color="#10b981" />
                            <Text style={[styles.badgeText, { color: "#10b981" }]}>Identidad Verificada</Text>
                        </View>
                    )}
                    {status.verification.professionalVerified && (
                        <View style={[styles.badge, { backgroundColor: "#3b82f620" }]}>
                            <MaterialIcons name="workspace-premium" size={16} color="#3b82f6" />
                            <Text style={[styles.badgeText, { color: "#3b82f6" }]}>Profesional Verificado</Text>
                        </View>
                    )}
                </View>

                {/* Professional Verification CTA */}
                {status.plan !== "starter" && !status.verification.professionalVerified && (
                    <TouchableOpacity style={styles.verificationCta} onPress={() => setVerificationModalVisible(true)}>
                        <MaterialIcons name="verified" size={20} color={COLORS.professional} />
                        <Text style={styles.verificationCtaText}>Verificar mi profesión</Text>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                )}

                {status.plan !== "starter" && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
                        <Text style={styles.cancelButtonText}>Cancelar suscripción</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderPlanCard = (plan: SubscriptionPlan) => {
        const isCurrentPlan = status?.plan === plan.id;
        const planColor = PLAN_COLORS[plan.id] || COLORS.gray500;
        const planIcon = PLAN_ICONS[plan.id] || "star";

        const featuresList = [
            { key: "directoryListing", label: "Aparecer en directorio", icon: "public" },
            { key: "catalogAvatar", label: "Avatar del catálogo", icon: "face" },
            { key: "customAvatar", label: "Avatar personalizado", icon: "auto-fix-high" },
            { key: "escalation", label: "Escalado a profesional", icon: "support-agent" },
            { key: "appointments", label: "Agendar citas", icon: "event" },
            { key: "videoAppointments", label: "Video-citas", icon: "videocam" },
            { key: "integratedPayments", label: "Cobros integrados", icon: "payments" },
            { key: "widget", label: "Widget web", icon: "widgets" },
            { key: "qrCode", label: "Código QR personalizado", icon: "qr-code-2" },
            { key: "analytics", label: "Analíticas", icon: "analytics" },
            { key: "calendarSync", label: "Sincronización calendario", icon: "calendar-month" },
            { key: "searchPriority", label: "Prioridad en buscador", icon: "trending-up" },
        ];

        return (
            <View
                key={plan.id}
                style={[
                    styles.planCard,
                    isCurrentPlan && styles.planCardCurrent,
                    { borderColor: isCurrentPlan ? planColor : COLORS.gray200 },
                ]}
            >
                <View style={styles.planHeader}>
                    <View style={[styles.planIcon, { backgroundColor: planColor + "20" }]}>
                        <MaterialIcons name={planIcon} size={28} color={planColor} />
                    </View>
                    <View style={styles.planTitleContainer}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={[styles.planPrice, { color: planColor }]}>{formatPrice(plan.price)}</Text>
                    </View>
                    {isCurrentPlan && (
                        <View style={[styles.currentBadge, { backgroundColor: planColor }]}>
                            <Text style={styles.currentBadgeText}>Actual</Text>
                        </View>
                    )}
                </View>

                <View style={styles.minutesRow}>
                    <MaterialIcons name="timer" size={18} color={COLORS.gray600} />
                    <Text style={styles.minutesText}>{plan.minutesIncluded} min/mes incluidos</Text>
                </View>

                <View style={styles.featuresList}>
                    {featuresList.map((feature) => {
                        const hasFeature = plan.features[feature.key as keyof typeof plan.features];
                        return (
                            <View key={feature.key} style={styles.featureItem}>
                                <MaterialIcons
                                    name={hasFeature ? "check-circle" : "cancel"}
                                    size={18}
                                    color={hasFeature ? COLORS.success : COLORS.gray300}
                                />
                                <Text style={[styles.featureText, !hasFeature && styles.featureTextDisabled]}>
                                    {feature.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {!isCurrentPlan && plan.id !== "starter" && (
                    <TouchableOpacity
                        style={[styles.subscribeButton, { backgroundColor: planColor }]}
                        onPress={() => handleSubscribe(plan.id)}
                        disabled={checkoutLoading !== null}
                    >
                        {checkoutLoading === plan.id ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>
                                {status?.plan && status.plan !== 'starter' && status.status === 'active'
                                    ? `Cambiar a ${plan.name}`
                                    : `Suscribirse a ${plan.name}`
                                }
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.gray800} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Planes y Créditos</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {renderCurrentPlan()}
                {renderUsageBar()}

                <Text style={styles.sectionTitle}>Planes disponibles</Text>
                {plans.map(renderPlanCard)}

                <View style={styles.extraInfoCard}>
                    <MaterialIcons name="info-outline" size={20} color={COLORS.gray500} />
                    <Text style={styles.extraInfoText}>
                        Los minutos adicionales se cobran a {(extraMinuteCost / 100).toFixed(2)}€/min
                    </Text>
                </View>
            </ScrollView>

            {/* Professional Verification Modal */}
            <Modal
                visible={verificationModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setVerificationModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Verificación Profesional</Text>
                        <TouchableOpacity onPress={() => setVerificationModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={COLORS.gray600} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalDescription}>
                            Completa este formulario para obtener el badge de Profesional Verificado.
                        </Text>

                        <TouchableOpacity
                            style={styles.declarationRow}
                            onPress={() => setVerificationData((prev) => ({ ...prev, declarationAccepted: !prev.declarationAccepted }))}
                        >
                            <MaterialIcons
                                name={verificationData.declarationAccepted ? "check-box" : "check-box-outline-blank"}
                                size={24}
                                color={verificationData.declarationAccepted ? COLORS.success : COLORS.gray400}
                            />
                            <Text style={styles.declarationText}>
                                Declaro que ejerzo esta actividad profesional de forma real y legal
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Nº de colegiado / Licencia (opcional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej: 12345-M"
                            value={verificationData.licenseNumber}
                            onChangeText={(text) => setVerificationData((prev) => ({ ...prev, licenseNumber: text }))}
                        />

                        <Text style={styles.inputLabel}>Información adicional (opcional)</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Cualquier información relevante..."
                            value={verificationData.additionalInfo}
                            onChangeText={(text) => setVerificationData((prev) => ({ ...prev, additionalInfo: text }))}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, !verificationData.declarationAccepted && styles.submitButtonDisabled]}
                            onPress={handleSubmitVerification}
                            disabled={!verificationData.declarationAccepted || verificationLoading}
                        >
                            {verificationLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Enviar verificación</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
    },
    backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray800 },
    headerPlaceholder: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    currentPlanCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
    currentPlanHeader: { flexDirection: "row", alignItems: "center" },
    currentPlanIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    currentPlanInfo: { flex: 1, marginLeft: 12 },
    currentPlanLabel: { fontSize: 12, color: COLORS.gray500 },
    currentPlanName: { fontSize: 20, fontWeight: "700" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 12, fontWeight: "600" },
    badgesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    verificationCta: {
        flexDirection: "row", alignItems: "center", backgroundColor: COLORS.gray100,
        padding: 12, borderRadius: 10, marginTop: 12, gap: 8,
    },
    verificationCtaText: { flex: 1, fontSize: 14, fontWeight: "500", color: COLORS.gray800 },
    cancelButton: { marginTop: 12, paddingVertical: 8 },
    cancelButtonText: { fontSize: 14, color: COLORS.error, textAlign: "center" },
    usageCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 24 },
    usageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    usageTitle: { fontSize: 16, fontWeight: "600", color: COLORS.gray800 },
    usageCount: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
    usageBarContainer: { height: 8, backgroundColor: COLORS.gray200, borderRadius: 4, overflow: "hidden" },
    usageBar: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },
    usageBarOverLimit: { backgroundColor: COLORS.warning },
    extraUsageContainer: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 },
    extraUsageText: { fontSize: 12, color: COLORS.warning },
    resetText: { fontSize: 12, color: COLORS.gray500, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray800, marginBottom: 16 },
    planCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
    planCardCurrent: { backgroundColor: COLORS.gray50 },
    planHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    planIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    planTitleContainer: { flex: 1, marginLeft: 12 },
    planName: { fontSize: 18, fontWeight: "700", color: COLORS.gray800 },
    planPrice: { fontSize: 16, fontWeight: "600" },
    currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    currentBadgeText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
    minutesRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
    minutesText: { fontSize: 14, color: COLORS.gray600 },
    featuresList: { gap: 8 },
    featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
    featureText: { fontSize: 14, color: COLORS.gray800 },
    featureTextDisabled: { color: COLORS.gray400 },
    subscribeButton: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    subscribeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    extraInfoCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.gray100, padding: 12, borderRadius: 10, gap: 8 },
    extraInfoText: { flex: 1, fontSize: 13, color: COLORS.gray600 },
    modalContainer: { flex: 1, backgroundColor: COLORS.white },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
    modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray800 },
    modalContent: { flex: 1, padding: 16 },
    modalDescription: { fontSize: 14, color: COLORS.gray600, lineHeight: 20, marginBottom: 24 },
    declarationRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24, padding: 12, backgroundColor: COLORS.gray100, borderRadius: 10 },
    declarationText: { flex: 1, fontSize: 14, color: COLORS.gray800, lineHeight: 20 },
    inputLabel: { fontSize: 14, fontWeight: "600", color: COLORS.gray800, marginBottom: 8 },
    textInput: { backgroundColor: COLORS.gray100, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16 },
    textArea: { minHeight: 100 },
    submitButton: { backgroundColor: COLORS.professional, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
    submitButtonDisabled: { backgroundColor: COLORS.gray300 },
    submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
