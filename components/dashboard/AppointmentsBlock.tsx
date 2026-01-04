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

interface AppointmentsBlockProps {
    user?: User;
    onToggleAppointments: (value: boolean) => void;
    onToggleAutoConfirm: (value: boolean) => void;
    onTogglePaymentRequired: (value: boolean) => void;
}

export default function AppointmentsBlock({
    user,
    onToggleAppointments,
    onToggleAutoConfirm,
    onTogglePaymentRequired,
}: AppointmentsBlockProps) {
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <MaterialIcons name="calendar-month" size={22} color={COLORS.orange600} />
                </View>
                <Text style={styles.headerTitle}>Gestión de Citas</Text>
            </View>

            {/* Agendar Citas Toggle */}
            <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: COLORS.orange50 }]}>
                    <MaterialIcons name="event" size={20} color={COLORS.orange600} />
                </View>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Agendar Citas</Text>
                    <Text style={styles.toggleHint}>
                        {user?.appointmentsEnabled
                            ? "Los clientes pueden reservar citas"
                            : "Activa para que los clientes reserven"
                        }
                    </Text>
                </View>
                <Switch
                    value={user?.appointmentsEnabled || false}
                    onValueChange={onToggleAppointments}
                    trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                    thumbColor="#FFFFFF"
                />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Confirmación automática Toggle */}
            <View style={[styles.toggleRow, !user?.appointmentsEnabled && styles.toggleRowDisabled]}>
                <View style={[
                    styles.toggleIcon,
                    { backgroundColor: user?.autoConfirmAppointments !== false ? COLORS.green50 : COLORS.orange50 }
                ]}>
                    <MaterialIcons
                        name={user?.autoConfirmAppointments !== false ? "check-circle" : "schedule"}
                        size={20}
                        color={user?.autoConfirmAppointments !== false ? COLORS.green600 : COLORS.orange600}
                    />
                </View>
                <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, !user?.appointmentsEnabled && styles.textDisabled]}>
                        Confirmación automática
                    </Text>
                    <Text style={[styles.toggleHint, !user?.appointmentsEnabled && styles.textDisabled]}>
                        {user?.autoConfirmAppointments !== false
                            ? "Citas se confirman al instante"
                            : "Requiere confirmación manual"
                        }
                    </Text>
                </View>
                <Switch
                    value={user?.autoConfirmAppointments !== false}
                    onValueChange={onToggleAutoConfirm}
                    trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                    thumbColor="#FFFFFF"
                    disabled={!user?.appointmentsEnabled}
                />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Cobro anticipado Toggle */}
            <View style={[styles.toggleRow, !user?.appointmentsEnabled && styles.toggleRowDisabled]}>
                <View style={[
                    styles.toggleIcon,
                    { backgroundColor: user?.requirePaymentOnBooking !== false ? COLORS.blue50 : COLORS.gray100 }
                ]}>
                    <MaterialIcons
                        name={user?.requirePaymentOnBooking !== false ? "payment" : "payments"}
                        size={20}
                        color={user?.requirePaymentOnBooking !== false ? COLORS.blue600 : COLORS.gray500}
                    />
                </View>
                <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, !user?.appointmentsEnabled && styles.textDisabled]}>
                        Cobro anticipado presencial
                    </Text>
                    <Text style={[styles.toggleHint, !user?.appointmentsEnabled && styles.textDisabled]}>
                        {user?.requirePaymentOnBooking !== false
                            ? "Cobrar al agendar citas presenciales"
                            : "Cobrar in situ (cliente paga al llegar)"
                        }
                    </Text>
                </View>
                <Switch
                    value={user?.requirePaymentOnBooking !== false}
                    onValueChange={onTogglePaymentRequired}
                    trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                    thumbColor="#FFFFFF"
                    disabled={!user?.appointmentsEnabled}
                />
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/(settings)/manage-appointments")}
                >
                    <MaterialIcons name="event-note" size={18} color={COLORS.textMain} />
                    <Text style={styles.actionButtonText}>Ver citas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/(settings)/appointment-pricing")}
                >
                    <MaterialIcons name="euro" size={18} color={COLORS.textMain} />
                    <Text style={styles.actionButtonText}>Tarifas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/(settings)/work-schedule")}
                >
                    <MaterialIcons name="schedule" size={18} color={COLORS.textMain} />
                    <Text style={styles.actionButtonText}>Horario</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: "#EFF6FF", // Light blue (blue-50)
        borderWidth: 1,
        borderColor: "#BFDBFE", // Soft blue border (blue-200)
        padding: 16,
        shadowColor: "#3B82F6",
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
        backgroundColor: COLORS.orange50,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    toggleRowDisabled: {
        opacity: 0.5,
    },
    toggleIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    toggleHint: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 1,
    },
    textDisabled: {
        color: COLORS.gray400,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 8,
    },
    actionsRow: {
        flexDirection: "row",
        marginTop: 16,
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
});
