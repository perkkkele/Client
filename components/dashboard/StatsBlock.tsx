import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";
import { analyticsApi } from "../../api";

interface StatsBlockProps {
    analytics: {
        profileViews: number;
        totalConversations: number;
        totalConversationSeconds: number;
        appointmentsBooked: number;
        phoneCalls: number;
        escalations: number;
    };
}

export default function StatsBlock({ analytics }: StatsBlockProps) {
    const { t } = useTranslation('settings');
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleBadge}>
                    <MaterialIcons name="bar-chart" size={16} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>{t('statsBlock.activitySummary')}</Text>
                </View>
            </View>
            <View style={styles.statsGrid}>
                {/* Visitas al Perfil */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.blue50 }]}>
                            <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.profileViews')}</Text>
                    <Text style={styles.statValue}>{analytics.profileViews.toLocaleString()}</Text>
                </View>

                {/* Conversaciones Totales */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.purple50 }]}>
                            <MaterialIcons name="chat" size={20} color={COLORS.purple600} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.conversations')}</Text>
                    <Text style={styles.statValue}>{analytics.totalConversations.toLocaleString()}</Text>
                </View>

                {/* Duración Chats */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: "#E0F2FE" }]}>
                            <MaterialIcons name="schedule" size={20} color="#0EA5E9" />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.chatDuration')}</Text>
                    <Text style={styles.statValue}>{analyticsApi.formatDuration(analytics.totalConversationSeconds)}</Text>
                </View>

                {/* Citas Agendadas */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.orange50 }]}>
                            <MaterialIcons name="calendar-month" size={20} color={COLORS.orange600} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.appointmentsBooked')}</Text>
                    <Text style={styles.statValue}>{analytics.appointmentsBooked}</Text>
                </View>

                {/* Llamadas Recibidas */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="call" size={20} color={COLORS.green600} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.calls')}</Text>
                    <Text style={styles.statValue}>{analytics.phoneCalls}</Text>
                </View>

                {/* Escalaciones */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
                            <MaterialIcons name="support-agent" size={20} color="#D97706" />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{t('statsBlock.escalations')}</Text>
                    <Text style={styles.statValue}>{analytics.escalations}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    titleBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.blue50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.primary,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 8,
    },
    statCard: {
        width: "48%",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.green50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 2,
    },
    statBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.green600,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.textMain,
    },
});
