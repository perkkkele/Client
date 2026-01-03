import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";
import { analyticsApi } from "../../api";

interface StatsBlockProps {
    analytics: {
        profileViews: number;
        totalConversationSeconds: number;
        appointmentsBooked: number;
        phoneCalls: number;
    };
}

export default function StatsBlock({ analytics }: StatsBlockProps) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Resumen de Actividad</Text>
                <TouchableOpacity style={styles.sectionLink}>
                    <Text style={styles.sectionLinkText}>Configuración</Text>
                    <MaterialIcons name="settings" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.blue50 }]}>
                            <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.statBadge}>
                            <MaterialIcons name="trending-up" size={14} color={COLORS.green600} />
                            <Text style={styles.statBadgeText}>+12%</Text>
                        </View>
                    </View>
                    <Text style={styles.statLabel}>Visitas Perfil</Text>
                    <Text style={styles.statValue}>{analytics.profileViews.toLocaleString()}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.purple50 }]}>
                            <MaterialIcons name="schedule" size={20} color={COLORS.purple600} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>Duración Chats</Text>
                    <Text style={styles.statValue}>{analyticsApi.formatDuration(analytics.totalConversationSeconds)}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.orange50 }]}>
                            <MaterialIcons name="calendar-month" size={20} color={COLORS.orange600} />
                        </View>
                    </View>
                    <Text style={styles.statLabel}>Citas Agendadas</Text>
                    <Text style={styles.statValue}>{analytics.appointmentsBooked}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="call" size={20} color={COLORS.green600} />
                        </View>
                        <View style={styles.statBadge}>
                            <MaterialIcons name="trending-up" size={14} color={COLORS.green600} />
                            <Text style={styles.statBadgeText}>+5%</Text>
                        </View>
                    </View>
                    <Text style={styles.statLabel}>Llamadas recibidas</Text>
                    <Text style={styles.statValue}>{analytics.phoneCalls}</Text>
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
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    sectionLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    sectionLinkText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "500",
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
