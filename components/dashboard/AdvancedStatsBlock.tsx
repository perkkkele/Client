import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";
import { analyticsApi } from "../../api";
import type { AdvancedAnalytics } from "../../api/analytics";

interface AdvancedStatsBlockProps {
    analytics: AdvancedAnalytics;
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AdvancedStatsBlock({ analytics }: AdvancedStatsBlockProps) {
    const { t } = useTranslation('settings');
    const weekdayLabels = t('advancedStats.weekdays', { returnObjects: true }) as string[];
    // Find peak hour
    const maxHourValue = Math.max(...analytics.peakHours);
    const peakHourIndex = analytics.peakHours.indexOf(maxHourValue);
    const peakHourLabel = `${peakHourIndex}:00 - ${peakHourIndex + 1}:00`;

    // Find busiest day
    const maxDayValue = Math.max(...analytics.weekdayDistribution);
    const busiestDayIndex = analytics.weekdayDistribution.indexOf(maxDayValue);
    const busiestDayLabel = weekdayLabels[busiestDayIndex];

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.premiumBadge}>
                    <MaterialIcons name="diamond" size={16} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>{t('advancedStats.title')}</Text>
                </View>
            </View>

            {/* Conversion Rates */}
            <View style={styles.conversionRow}>
                <View style={styles.conversionCard}>
                    <Text style={styles.conversionLabel}>{t('advancedStats.viewToConversation')}</Text>
                    <Text style={styles.conversionValue}>{analytics.conversionRates.viewToConversation}%</Text>
                    <View style={styles.conversionBar}>
                        <View style={[styles.conversionFill, { width: `${analytics.conversionRates.viewToConversation}%` }]} />
                    </View>
                </View>
                <View style={styles.conversionCard}>
                    <Text style={styles.conversionLabel}>{t('advancedStats.conversationToAppointment')}</Text>
                    <Text style={styles.conversionValue}>{analytics.conversionRates.conversationToAppointment}%</Text>
                    <View style={styles.conversionBar}>
                        <View style={[styles.conversionFill, styles.conversionFillGreen, { width: `${analytics.conversionRates.conversationToAppointment}%` }]} />
                    </View>
                </View>
            </View>

            {/* Traffic Sources */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('advancedStats.trafficOrigin')}</Text>
                <View style={styles.trafficGrid}>
                    <View style={styles.trafficItem}>
                        <View style={[styles.trafficIcon, { backgroundColor: "#EEF2FF" }]}>
                            <MaterialIcons name="phone-android" size={18} color="#6366F1" />
                        </View>
                        <Text style={styles.trafficValue}>{analytics.trafficBySource.app}</Text>
                        <Text style={styles.trafficLabel}>App</Text>
                    </View>
                    <View style={styles.trafficItem}>
                        <View style={[styles.trafficIcon, { backgroundColor: "#FEF3C7" }]}>
                            <MaterialIcons name="widgets" size={18} color="#D97706" />
                        </View>
                        <Text style={styles.trafficValue}>{analytics.trafficBySource["web-widget"]}</Text>
                        <Text style={styles.trafficLabel}>Widget</Text>
                    </View>
                    <View style={styles.trafficItem}>
                        <View style={[styles.trafficIcon, { backgroundColor: "#E0F2FE" }]}>
                            <MaterialIcons name="qr-code-2" size={18} color="#0EA5E9" />
                        </View>
                        <Text style={styles.trafficValue}>{analytics.trafficBySource["qr-code"]}</Text>
                        <Text style={styles.trafficLabel}>QR Code</Text>
                    </View>
                    <View style={styles.trafficItem}>
                        <View style={[styles.trafficIcon, { backgroundColor: "#F0FDF4" }]}>
                            <MaterialIcons name="link" size={18} color="#22C55E" />
                        </View>
                        <Text style={styles.trafficValue}>{analytics.trafficBySource["direct-link"]}</Text>
                        <Text style={styles.trafficLabel}>Link</Text>
                    </View>
                </View>
            </View>

            {/* Peak Hours & Days */}
            <View style={styles.insightsRow}>
                <View style={styles.insightCard}>
                    <MaterialIcons name="access-time" size={24} color="#8B5CF6" />
                    <Text style={styles.insightValue}>{peakHourLabel}</Text>
                    <Text style={styles.insightLabel}>{t('advancedStats.peakHour')}</Text>
                </View>
                <View style={styles.insightCard}>
                    <MaterialIcons name="today" size={24} color="#0EA5E9" />
                    <Text style={styles.insightValue}>{busiestDayLabel}</Text>
                    <Text style={styles.insightLabel}>{t('advancedStats.busiestDay')}</Text>
                </View>
            </View>

            {/* Weekly Activity Chart */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('advancedStats.weeklyActivity')}</Text>
                <View style={styles.weekChart}>
                    {analytics.weekdayDistribution.map((value, index) => {
                        const maxVal = Math.max(...analytics.weekdayDistribution, 1);
                        const heightPercent = (value / maxVal) * 100;
                        return (
                            <View key={index} style={styles.weekBarContainer}>
                                <View style={styles.weekBarWrapper}>
                                    <View style={[styles.weekBar, { height: `${Math.max(heightPercent, 5)}%` }]} />
                                </View>
                                <Text style={styles.weekLabel}>{weekdayLabels[index]}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.statsRow}>
                <View style={styles.miniStatCard}>
                    <MaterialIcons name="timer" size={20} color={COLORS.purple600} />
                    <Text style={styles.miniStatValue}>
                        {analyticsApi.formatDuration(analytics.averageConversationDuration)}
                    </Text>
                    <Text style={styles.miniStatLabel}>{t('advancedStats.averageDuration')}</Text>
                </View>
                <View style={styles.miniStatCard}>
                    <MaterialIcons name="person-add" size={20} color={COLORS.green600} />
                    <Text style={styles.miniStatValue}>{analytics.visitors.unique}</Text>
                    <Text style={styles.miniStatLabel}>{t('advancedStats.newUsers')}</Text>
                </View>
                <View style={styles.miniStatCard}>
                    <MaterialIcons name="replay" size={20} color={COLORS.blue600} />
                    <Text style={styles.miniStatValue}>{analytics.visitors.returning}</Text>
                    <Text style={styles.miniStatLabel}>{t('advancedStats.returning')}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    premiumBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F3FF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#8B5CF6",
    },
    conversionRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    conversionCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    conversionLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        marginBottom: 4,
    },
    conversionValue: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    conversionBar: {
        height: 6,
        backgroundColor: COLORS.gray200,
        borderRadius: 3,
        overflow: "hidden",
    },
    conversionFill: {
        height: "100%",
        backgroundColor: "#8B5CF6",
        borderRadius: 3,
    },
    conversionFillGreen: {
        backgroundColor: "#22C55E",
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 16,
    },
    trafficGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    trafficItem: {
        alignItems: "center",
        flex: 1,
    },
    trafficIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    trafficValue: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    trafficLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 2,
    },
    insightsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    insightCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    insightValue: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
        marginTop: 8,
    },
    insightLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    weekChart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 100,
    },
    weekBarContainer: {
        flex: 1,
        alignItems: "center",
    },
    weekBarWrapper: {
        height: 80,
        width: 24,
        justifyContent: "flex-end",
        marginBottom: 8,
    },
    weekBar: {
        width: "100%",
        backgroundColor: "#8B5CF6",
        borderRadius: 4,
    },
    weekLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        fontWeight: "500",
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
    },
    miniStatCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    miniStatValue: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textMain,
        marginTop: 6,
    },
    miniStatLabel: {
        fontSize: 10,
        color: COLORS.gray500,
        marginTop: 2,
        textAlign: "center",
    },
});
