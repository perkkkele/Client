import React from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";

interface User {
    _id?: string;
    appointmentsEnabled?: boolean;
    autoConfirmAppointments?: boolean;
    requirePaymentOnBooking?: boolean;
}

interface TwinBlockProps {
    user?: User;
    geminiActive: boolean;
    onGeminiChange: (value: boolean) => void;
    onConfigureGemini: () => void;
    onToggleAppointments: (value: boolean) => void;
    onToggleAutoConfirm: (value: boolean) => void;
    onTogglePaymentRequired: (value: boolean) => void;
}

export default function TwinBlock({
    user,
    geminiActive,
    onGeminiChange,
    onConfigureGemini,
    onToggleAppointments,
    onToggleAutoConfirm,
    onTogglePaymentRequired,
}: TwinBlockProps) {
    const handleTestGemini = () => {
        if (user?._id) {
            router.push(`/avatar-chat/${user._id}` as any);
        }
    };

    return (
        <View style={styles.twinCard}>
            <View style={styles.twinCardGlow1} />
            <View style={styles.twinCardGlow2} />
            <View style={styles.twinCardContent}>
                <View style={styles.twinHeader}>
                    <TouchableOpacity
                        style={styles.twinHeaderTouchable}
                        onPress={handleTestGemini}
                    >
                        <View style={styles.twinIconContainer}>
                            <MaterialIcons name="smart-toy" size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.twinInfo}>
                            <Text style={styles.twinTitle}>Gemelo Digital</Text>
                            <View style={styles.twinStatus}>
                                <View style={[
                                    styles.statusDot,
                                    !geminiActive && styles.statusDotInactive
                                ]} />
                                <Text style={styles.statusText}>
                                    {geminiActive ? "Activo y público" : "Inactivo"}
                                </Text>
                            </View>
                            <Text style={styles.testHint}>Toca para probar tu gemelo</Text>
                        </View>
                    </TouchableOpacity>
                    <Switch
                        value={geminiActive}
                        onValueChange={onGeminiChange}
                        trackColor={{ false: "rgba(0,0,0,0.3)", true: "#4ade80" }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(0,0,0,0.3)"
                    />
                </View>
                <TouchableOpacity style={styles.configureButton} onPress={onConfigureGemini}>
                    <View style={styles.configureButtonContent}>
                        <MaterialIcons name="tune" size={20} color={COLORS.primary} />
                        <Text style={styles.configureButtonText}>Configurar Gemelo</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Appointments Toggle */}
                <View style={styles.appointmentsDivider} />
                <View style={styles.appointmentsRow}>
                    <View style={styles.appointmentsIconBox}>
                        <MaterialIcons name="event" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.appointmentsInfo}>
                        <Text style={styles.appointmentsLabel}>Agendar Citas</Text>
                        <Text style={styles.appointmentsHint}>
                            {user?.appointmentsEnabled
                                ? "Los clientes pueden reservar citas contigo"
                                : "Activa para que los clientes reserven citas"
                            }
                        </Text>
                    </View>
                    <Switch
                        value={user?.appointmentsEnabled || false}
                        onValueChange={onToggleAppointments}
                        trackColor={{ false: "rgba(0,0,0,0.3)", true: "#4ade80" }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(0,0,0,0.3)"
                    />
                </View>

                {/* Auto-Confirm Toggle */}
                {user?.appointmentsEnabled && (
                    <View style={styles.appointmentsRow}>
                        <View style={[styles.appointmentsIconBox, {
                            backgroundColor: user?.autoConfirmAppointments !== false
                                ? COLORS.green500
                                : COLORS.orange600
                        }]}>
                            <MaterialIcons
                                name={user?.autoConfirmAppointments !== false ? "check-circle" : "schedule"}
                                size={22}
                                color="#FFFFFF"
                            />
                        </View>
                        <View style={styles.appointmentsInfo}>
                            <Text style={styles.appointmentsLabel}>Confirmación automática</Text>
                            <Text style={styles.appointmentsHint}>
                                {user?.autoConfirmAppointments !== false
                                    ? "Citas se confirman al instante"
                                    : "Requiere confirmación manual"
                                }
                            </Text>
                        </View>
                        <Switch
                            value={user?.autoConfirmAppointments !== false}
                            onValueChange={onToggleAutoConfirm}
                            trackColor={{ false: "rgba(0,0,0,0.3)", true: "#4ade80" }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="rgba(0,0,0,0.3)"
                        />
                    </View>
                )}

                {/* Payment Required Toggle */}
                {user?.appointmentsEnabled && (
                    <View style={styles.appointmentsRow}>
                        <View style={[styles.appointmentsIconBox, {
                            backgroundColor: user?.requirePaymentOnBooking !== false
                                ? COLORS.blue600
                                : COLORS.gray500
                        }]}>
                            <MaterialIcons
                                name={user?.requirePaymentOnBooking !== false ? "payment" : "payments"}
                                size={22}
                                color="#FFFFFF"
                            />
                        </View>
                        <View style={styles.appointmentsInfo}>
                            <Text style={styles.appointmentsLabel}>Cobro anticipado presencial</Text>
                            <Text style={styles.appointmentsHint}>
                                {user?.requirePaymentOnBooking !== false
                                    ? "Cobrar al agendar citas presenciales"
                                    : "Cobrar in situ (el cliente paga al llegar)"
                                }
                            </Text>
                        </View>
                        <Switch
                            value={user?.requirePaymentOnBooking !== false}
                            onValueChange={onTogglePaymentRequired}
                            trackColor={{ false: "rgba(0,0,0,0.3)", true: "#4ade80" }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="rgba(0,0,0,0.3)"
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    twinCard: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: "#1a1a2e",
        overflow: "hidden",
        position: "relative",
    },
    twinCardGlow1: {
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(19, 127, 236, 0.3)",
    },
    twinCardGlow2: {
        position: "absolute",
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(147, 51, 234, 0.2)",
    },
    twinCardContent: {
        padding: 20,
    },
    twinHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    twinHeaderTouchable: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
    },
    twinIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    twinInfo: {
        flex: 1,
    },
    twinTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 6,
    },
    twinStatus: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#4ade80",
        marginRight: 6,
    },
    statusDotInactive: {
        backgroundColor: "#9ca3af",
    },
    statusText: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
    },
    testHint: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.5)",
        fontStyle: "italic",
    },
    configureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    configureButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    configureButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.primary,
    },
    appointmentsDivider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 16,
    },
    appointmentsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    appointmentsIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    appointmentsInfo: {
        flex: 1,
    },
    appointmentsLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    appointmentsHint: {
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: 2,
    },
});
