import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";

interface Alert {
    id: string;
    type: "success" | "warning" | "info";
    icon: string;
    title: string;
    description: string;
    time: string;
}

interface AlertsBlockProps {
    alerts?: Alert[];
}

const DEFAULT_ALERTS: Alert[] = [
    {
        id: "1",
        type: "success",
        icon: "check-circle",
        title: "Cita completada",
        description: "Tu avatar ha completado una cita con Juan P. exitosamente.",
        time: "Hace 15 min",
    },
    {
        id: "2",
        type: "warning",
        icon: "receipt-long",
        title: "Factura Disponible",
        description: "Tu factura del mes de Mayo está lista para descargar.",
        time: "Hace 2 horas",
    },
    {
        id: "3",
        type: "info",
        icon: "update",
        title: "Recordatorio de Horario",
        description: "Recuerda actualizar tu disponibilidad para la próxima semana.",
        time: "Ayer",
    },
];

const getAlertColor = (type: string) => {
    switch (type) {
        case "success":
            return COLORS.primary;
        case "warning":
            return "#f59e0b";
        case "info":
        default:
            return COLORS.gray300;
    }
};

const getIconColor = (type: string) => {
    switch (type) {
        case "success":
            return COLORS.primary;
        case "warning":
            return "#f59e0b";
        case "info":
        default:
            return COLORS.gray400;
    }
};

export default function AlertsBlock({ alerts = DEFAULT_ALERTS }: AlertsBlockProps) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Alertas Importantes</Text>
                <TouchableOpacity>
                    <Text style={styles.sectionLinkText}>Ver todo</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.alertsList}>
                {alerts.map((alert) => (
                    <View
                        key={alert.id}
                        style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}
                    >
                        <MaterialIcons
                            name={alert.icon as any}
                            size={20}
                            color={getIconColor(alert.type)}
                        />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>{alert.title}</Text>
                            <Text style={styles.alertDescription}>{alert.description}</Text>
                            <Text style={styles.alertTime}>{alert.time}</Text>
                        </View>
                    </View>
                ))}
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
    sectionLinkText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "500",
    },
    alertsList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    alertCard: {
        flexDirection: "row",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        gap: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    alertDescription: {
        fontSize: 13,
        color: COLORS.gray600,
        lineHeight: 18,
        marginBottom: 6,
    },
    alertTime: {
        fontSize: 12,
        color: COLORS.gray400,
    },
});
