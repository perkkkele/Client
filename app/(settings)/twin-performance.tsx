import { router } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { analyticsApi } from "../../api";
import type { AnalyticsSummary, AdvancedAnalytics } from "../../api/analytics";

const COLORS = {
    primary: "#137fec",
    backgroundDark: "#101922",
    surfaceDark: "#182430",
    borderDark: "#2a3642",
    textMain: "#FFFFFF",
    textSecondary: "#9CA3AF",
    gray400: "#9CA3AF",
    gray800: "#1f2937",
    green500: "#22c55e",
    orange500: "#f97316",
    yellow500: "#eab308",
};

export default function TwinPerformanceScreen() {
    const [activeFilter, setActiveFilter] = useState(0);
    const { t } = useTranslation('settings');
    const { user, token } = useAuth();

    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [advanced, setAdvanced] = useState<AdvancedAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const FILTERS = [t('twinPerformance.filterLast7'), t('twinPerformance.filterLastMonth'), t('twinPerformance.filterCustom')];

    const loadAnalytics = useCallback(async () => {
        if (!token || !user?._id) return;
        setLoading(true);
        try {
            const [summaryData, advancedData] = await Promise.all([
                analyticsApi.getSummary(token, user._id),
                analyticsApi.getAdvancedAnalytics(token, user._id),
            ]);
            if (summaryData) setSummary(summaryData);
            if (advancedData) setAdvanced(advancedData);
        } catch (error) {
            console.error("Error loading performance analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [token, user?._id]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    // ── Derived metrics ──
    const totalInteractions = summary
        ? summary.totalConversations + summary.phoneCalls + summary.escalations
        : 0;

    const avgDurationSeconds = useMemo(() => {
        if (!summary || summary.totalConversations === 0) return 0;
        return Math.round(summary.totalConversationSeconds / summary.totalConversations);
    }, [summary]);

    const avgDurationFormatted = useMemo(() => {
        if (avgDurationSeconds <= 0) return "0m";
        const mins = Math.floor(avgDurationSeconds / 60);
        const secs = avgDurationSeconds % 60;
        if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m`;
        return `${secs}s`;
    }, [avgDurationSeconds]);

    const escalationRate = useMemo(() => {
        if (!summary || summary.totalConversations === 0) return 0;
        return Math.round((summary.escalations / summary.totalConversations) * 100);
    }, [summary]);

    const resolutionRate = 100 - escalationRate;

    // Rating from user profile
    const userRating = (user as any)?.rating ?? 0;
    const ratingCount = (user as any)?.ratingCount ?? 0;

    // Weekly activity bars from advanced analytics
    const weekdayBars = useMemo(() => {
        if (!advanced?.weekdayDistribution) return [0, 0, 0, 0, 0, 0, 0];
        // Reorder to Mon-Sun (API returns Sun=0 first)
        const dist = advanced.weekdayDistribution;
        return [dist[1], dist[2], dist[3], dist[4], dist[5], dist[6], dist[0]];
    }, [advanced]);

    const maxBar = Math.max(...weekdayBars, 1);

    // Traffic sources
    const trafficSources = useMemo(() => {
        if (!advanced?.trafficBySource) return [];
        const sources = advanced.trafficBySource;
        const total = Object.values(sources).reduce((a, b) => a + b, 0);
        if (total === 0) return [];
        return [
            { name: "App", count: sources.app, pct: Math.round((sources.app / total) * 100) },
            { name: "Web Widget", count: sources["web-widget"], pct: Math.round((sources["web-widget"] / total) * 100) },
            { name: "QR Code", count: sources["qr-code"], pct: Math.round((sources["qr-code"] / total) * 100) },
            { name: "Direct Link", count: sources["direct-link"], pct: Math.round((sources["direct-link"] / total) * 100) },
        ].filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    }, [advanced]);

    function handleBack() {
        router.back();
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('twinPerformance.headerTitle')}</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('twinPerformance.headerTitle')}</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Filters */}
            <View style={styles.filtersSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.filterButton,
                                activeFilter === index && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveFilter(index)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === index && styles.filterTextActive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Main Chart Card */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartLabel}>{t('twinPerformance.totalInteractions')}</Text>
                            <View style={styles.chartValueRow}>
                                <Text style={styles.chartValue}>
                                    {totalInteractions.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                    {/* Weekly Activity Chart */}
                    <View style={styles.chartPlaceholder}>
                        <View style={styles.chartLine}>
                            {weekdayBars.map((val, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.chartBar,
                                        { height: `${Math.max((val / maxBar) * 100, 4)}%` }
                                    ]}
                                />
                            ))}
                        </View>
                        <View style={styles.chartLabels}>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.mon')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.tue')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.wed')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.thu')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.fri')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.sat')}</Text>
                            <Text style={styles.chartAxisLabel}>{t('twinPerformance.sun')}</Text>
                        </View>
                    </View>
                </View>

                {/* KPI Grid */}
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <MaterialIcons name="timer" size={24} color={COLORS.primary} />
                        <Text style={styles.kpiLabel}>{t('twinPerformance.avgDuration')}</Text>
                        <Text style={styles.kpiValue}>{avgDurationFormatted}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <MaterialIcons name="star" size={24} color={COLORS.yellow500} />
                        <Text style={styles.kpiLabel}>{t('twinPerformance.satisfaction')}</Text>
                        <Text style={styles.kpiValue}>
                            {userRating > 0 ? `${userRating.toFixed(1)}/5` : "—"}
                        </Text>
                        {ratingCount > 0 && (
                            <Text style={styles.kpiSubtitle}>
                                {ratingCount} {ratingCount === 1 ? "valoración" : "valoraciones"}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Resolution & Escalation */}
                <View style={styles.ratesSection}>
                    <View style={styles.rateCard}>
                        <View style={styles.rateLeft}>
                            <View style={[styles.rateIcon, { backgroundColor: "rgba(34, 197, 94, 0.2)" }]}>
                                <MaterialIcons name="smart-toy" size={20} color={COLORS.green500} />
                            </View>
                            <View>
                                <Text style={styles.rateLabel}>{t('twinPerformance.resolutionRate')}</Text>
                                <Text style={styles.rateValue}>{resolutionRate}%</Text>
                            </View>
                        </View>
                        <View style={styles.progressCircle}>
                            <View style={[styles.progressFill, { width: `${resolutionRate}%` }]} />
                        </View>
                    </View>

                    <View style={styles.rateCard}>
                        <View style={styles.rateLeft}>
                            <View style={[styles.rateIcon, { backgroundColor: "rgba(249, 115, 22, 0.2)" }]}>
                                <MaterialIcons name="support-agent" size={20} color={COLORS.orange500} />
                            </View>
                            <View>
                                <Text style={styles.rateLabel}>{t('twinPerformance.escalationRate')}</Text>
                                <Text style={styles.rateValue}>{escalationRate}%</Text>
                            </View>
                        </View>
                        <View style={styles.progressCircle}>
                            <View style={[styles.progressFill, styles.progressOrange, { width: `${escalationRate}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Traffic Sources (replaces hardcoded topics) */}
                {trafficSources.length > 0 && (
                    <View style={styles.topicsSection}>
                        <Text style={styles.sectionTitle}>{t('twinPerformance.frequentTopics')}</Text>
                        <View style={styles.topicsCard}>
                            {trafficSources.map((source, index) => (
                                <View key={index} style={styles.topicItem}>
                                    <View style={styles.topicHeader}>
                                        <Text style={styles.topicName}>{source.name}</Text>
                                        <Text style={styles.topicPercent}>{source.pct}%</Text>
                                    </View>
                                    <View style={styles.topicBar}>
                                        <View
                                            style={[
                                                styles.topicProgress,
                                                { width: `${source.pct}%`, opacity: 1 - (index * 0.15) }
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Optimization Insight */}
                <View style={styles.insightCard}>
                    <View style={styles.insightIcon}>
                        <MaterialIcons name="auto-awesome" size={20} color={COLORS.textMain} />
                    </View>
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>{t('twinPerformance.optimizationTitle')}</Text>
                        <Text style={styles.insightText}>
                            {t('twinPerformance.optimizationText')}
                        </Text>
                        <TouchableOpacity
                            style={styles.insightButton}
                            onPress={() => router.push("/onboarding/twin-knowledge")}
                        >
                            <Text style={styles.insightButtonText}>{t('twinPerformance.reviewDocs')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    filtersSection: {
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
        paddingVertical: 12,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.surfaceDark,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 40,
    },
    chartCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 20,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    chartLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    chartValueRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
        marginTop: 4,
    },
    chartValue: {
        fontSize: 30,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    chartPlaceholder: {
        marginTop: 24,
        height: 140,
    },
    chartLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 100,
        gap: 8,
    },
    chartBar: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        opacity: 0.8,
        minHeight: 4,
    },
    chartLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    chartAxisLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    kpiGrid: {
        flexDirection: "row",
        gap: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
        gap: 4,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    kpiSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    ratesSection: {
        gap: 12,
    },
    rateCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    rateLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rateIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    rateLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    rateValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    progressCircle: {
        width: 48,
        height: 8,
        backgroundColor: COLORS.gray800,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: COLORS.green500,
        borderRadius: 4,
    },
    progressOrange: {
        backgroundColor: COLORS.orange500,
    },
    topicsSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        paddingHorizontal: 4,
    },
    topicsCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 20,
        gap: 16,
    },
    topicItem: {
        gap: 8,
    },
    topicHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    topicName: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    topicPercent: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    topicBar: {
        height: 8,
        backgroundColor: COLORS.gray800,
        borderRadius: 4,
        overflow: "hidden",
    },
    topicProgress: {
        height: "100%",
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    insightCard: {
        flexDirection: "row",
        backgroundColor: "rgba(19, 127, 236, 0.1)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(19, 127, 236, 0.2)",
        padding: 20,
        gap: 16,
    },
    insightIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    insightContent: {
        flex: 1,
        gap: 4,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    insightText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    insightButton: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 12,
    },
    insightButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMain,
    },
});
