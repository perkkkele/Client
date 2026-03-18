import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

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

interface Topic {
    name: string;
    percentage: number;
}

export default function TwinPerformanceScreen() {
    const [activeFilter, setActiveFilter] = useState(0);
    const { t } = useTranslation('settings');

    const TOPICS: Topic[] = [
        { name: t('twinPerformance.topicPricing'), percentage: 40 },
        { name: t('twinPerformance.topicSchedule'), percentage: 25 },
        { name: t('twinPerformance.topicSupport'), percentage: 15 },
        { name: t('twinPerformance.topicOther'), percentage: 20 },
    ];

    const FILTERS = [t('twinPerformance.filterLast7'), t('twinPerformance.filterLastMonth'), t('twinPerformance.filterCustom')];

    function handleBack() {
        router.back();
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
                                <Text style={styles.chartValue}>1,248</Text>
                                <View style={styles.trendBadge}>
                                    <MaterialIcons name="trending-up" size={14} color={COLORS.green500} />
                                    <Text style={styles.trendText}>12%</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity>
                            <MaterialIcons name="more-horiz" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    {/* Chart placeholder */}
                    <View style={styles.chartPlaceholder}>
                        <View style={styles.chartLine}>
                            <View style={[styles.chartBar, { height: "40%" }]} />
                            <View style={[styles.chartBar, { height: "60%" }]} />
                            <View style={[styles.chartBar, { height: "50%" }]} />
                            <View style={[styles.chartBar, { height: "80%" }]} />
                            <View style={[styles.chartBar, { height: "70%" }]} />
                            <View style={[styles.chartBar, { height: "90%" }]} />
                            <View style={[styles.chartBar, { height: "85%" }]} />
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
                        <Text style={styles.kpiValue}>4m 12s</Text>
                        <Text style={styles.kpiTrend}>{t('twinPerformance.vsYesterday')}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <MaterialIcons name="star" size={24} color={COLORS.yellow500} />
                        <Text style={styles.kpiLabel}>{t('twinPerformance.satisfaction')}</Text>
                        <Text style={styles.kpiValue}>4.8/5</Text>
                        <Text style={styles.kpiSubtitle}>{t('twinPerformance.ratings')}</Text>
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
                                <Text style={styles.rateValue}>85%</Text>
                            </View>
                        </View>
                        <View style={styles.progressCircle}>
                            <View style={[styles.progressFill, { width: "85%" }]} />
                        </View>
                    </View>

                    <View style={styles.rateCard}>
                        <View style={styles.rateLeft}>
                            <View style={[styles.rateIcon, { backgroundColor: "rgba(249, 115, 22, 0.2)" }]}>
                                <MaterialIcons name="support-agent" size={20} color={COLORS.orange500} />
                            </View>
                            <View>
                                <Text style={styles.rateLabel}>{t('twinPerformance.escalationRate')}</Text>
                                <Text style={styles.rateValue}>15%</Text>
                            </View>
                        </View>
                        <View style={styles.progressCircle}>
                            <View style={[styles.progressFill, styles.progressOrange, { width: "15%" }]} />
                        </View>
                    </View>
                </View>

                {/* Frequent Topics */}
                <View style={styles.topicsSection}>
                    <Text style={styles.sectionTitle}>{t('twinPerformance.frequentTopics')}</Text>
                    <View style={styles.topicsCard}>
                        {TOPICS.map((topic, index) => (
                            <View key={index} style={styles.topicItem}>
                                <View style={styles.topicHeader}>
                                    <Text style={styles.topicName}>{topic.name}</Text>
                                    <Text style={styles.topicPercent}>{topic.percentage}%</Text>
                                </View>
                                <View style={styles.topicBar}>
                                    <View
                                        style={[
                                            styles.topicProgress,
                                            { width: `${topic.percentage}%`, opacity: 1 - (index * 0.2) }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

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
                        <TouchableOpacity style={styles.insightButton}>
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
    trendBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    trendText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.green500,
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
    kpiTrend: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.green500,
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
    insightHighlight: {
        fontWeight: "600",
        color: COLORS.primary,
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
