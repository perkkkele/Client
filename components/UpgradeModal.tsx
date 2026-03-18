/**
 * UpgradeModal Component
 * 
 * Displays a modal prompting the user to upgrade their plan
 * when they try to access a locked feature.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const COLORS = {
    primary: "#f9f506",
    backgroundOverlay: "rgba(0, 0, 0, 0.5)",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#64748B",
    gray200: "#E2E8F0",
    professional: "#3b82f6",
    premium: "#8b5cf6",
};

export type RequiredPlan = "professional" | "premium";

interface UpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    featureName: string;
    requiredPlan: RequiredPlan;
}

const PLAN_INFO = {
    professional: {
        name: "Professional",
        price: "99€/mes",
        color: COLORS.professional,
        icon: "workspace-premium" as const,
    },
    premium: {
        name: "Premium",
        price: "199€/mes",
        color: COLORS.premium,
        icon: "diamond" as const,
    },
};

export default function UpgradeModal({
    visible,
    onClose,
    featureName,
    requiredPlan,
}: UpgradeModalProps) {
    const { t } = useTranslation('settings');
    const planInfo = PLAN_INFO[requiredPlan];

    const handleViewPlans = () => {
        onClose();
        router.push("/(settings)/plans-credits");
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: planInfo.color + "15" }]}>
                        <MaterialIcons name="lock" size={32} color={planInfo.color} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('upgradeModal.title')}</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {t('upgradeModal.description', { featureName, planName: planInfo.name })}
                    </Text>

                    {/* Plan Badge */}
                    <View style={[styles.planBadge, { backgroundColor: planInfo.color + "15" }]}>
                        <MaterialIcons name={planInfo.icon} size={20} color={planInfo.color} />
                        <Text style={[styles.planBadgeText, { color: planInfo.color }]}>
                            {planInfo.name} - {planInfo.price}
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.upgradeButton, { backgroundColor: planInfo.color }]}
                            onPress={handleViewPlans}
                        >
                            <MaterialIcons name="upgrade" size={20} color="#FFFFFF" />
                            <Text style={styles.upgradeButtonText}>{t('upgradeModal.viewPlans')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>{t('upgradeModal.notNow')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.backgroundOverlay,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    container: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 20,
    },
    featureName: {
        fontWeight: "600",
        color: COLORS.textMain,
    },
    planName: {
        fontWeight: "bold",
    },
    planBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 20,
    },
    planBadgeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    buttonContainer: {
        width: "100%",
        gap: 10,
    },
    upgradeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    upgradeButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    closeButton: {
        alignItems: "center",
        paddingVertical: 12,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
});
