import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#FFD600",
    primaryContent: "#000000",
    backgroundLight: "#F2F2F7",
    surfaceLight: "#FFFFFF",
    textMain: "#000000",
    textMuted: "#6B7280",
    gray100: "#E5E7EB",
    gray200: "#D1D5DB",
    gray300: "#9CA3AF",
    gray400: "#6B7280",
    gray700: "#374151",
    red400: "#f87171",
    red50: "#fef2f2",
    red700: "#b91c1c",
    blue500: "#3b82f6",
    blue50: "#eff6ff",
};

interface TimeSlot {
    id: string;
    start: string;
    end: string;
}

interface DaySchedule {
    enabled: boolean;
    slots: TimeSlot[];
    isAbsent?: boolean;
    absenceReason?: string;
}

const DAYS = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
];

export default function WorkScheduleScreen() {
    const [timezone, setTimezone] = useState("Madrid (GMT+1)");
    const [isRecurring, setIsRecurring] = useState(true);
    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
        monday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "13:00" }, { id: "2", start: "15:00", end: "19:00" }] },
        tuesday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "18:00" }] },
        wednesday: { enabled: false, isAbsent: true, absenceReason: "Vacaciones", slots: [] },
        thursday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "18:00" }] },
        friday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "14:00" }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
    });

    function handleBack() {
        router.back();
    }

    function toggleDay(dayKey: string) {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                enabled: !prev[dayKey].enabled,
                isAbsent: false,
            }
        }));
    }

    function addSlot(dayKey: string) {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: [...prev[dayKey].slots, { id: Date.now().toString(), start: "09:00", end: "18:00" }]
            }
        }));
    }

    function removeSlot(dayKey: string, slotId: string) {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: prev[dayKey].slots.filter(s => s.id !== slotId)
            }
        }));
    }

    function updateSlot(dayKey: string, slotId: string, field: 'start' | 'end', value: string) {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: prev[dayKey].slots.map(s =>
                    s.id === slotId ? { ...s, [field]: value } : s
                )
            }
        }));
    }

    function handleSave() {
        // TODO: Save to API
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Horario Laboral</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="help-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CONFIGURACIÓN GENERAL</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.settingsRow}>
                            <View style={styles.settingsLeft}>
                                <MaterialIcons name="public" size={24} color={COLORS.textMuted} />
                                <Text style={styles.settingsLabel}>Zona Horaria</Text>
                            </View>
                            <View style={styles.settingsRight}>
                                <Text style={styles.settingsValue}>{timezone}</Text>
                                <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <View style={styles.settingsRow}>
                            <View style={styles.settingsLeftColumn}>
                                <Text style={styles.settingsLabel}>Horario recurrente</Text>
                                <Text style={styles.settingsHint}>Aplicar el mismo horario cada semana</Text>
                            </View>
                            <Switch
                                value={isRecurring}
                                onValueChange={setIsRecurring}
                                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                </View>

                {/* Absences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GESTIÓN DE AUSENCIAS</Text>
                    <TouchableOpacity style={styles.absenceCard}>
                        <View style={styles.absenceIndicator} />
                        <View style={styles.absenceIcon}>
                            <MaterialIcons name="event-busy" size={28} color={COLORS.blue500} />
                        </View>
                        <View style={styles.absenceContent}>
                            <Text style={styles.absenceTitle}>Añadir o gestionar ausencias</Text>
                            <Text style={styles.absenceHint}>Define vacaciones y días no disponibles</Text>
                        </View>
                        <View style={styles.absenceAddButton}>
                            <MaterialIcons name="add" size={24} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Weekly Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SEMANA LABORAL</Text>

                    {DAYS.map((day) => {
                        const dayData = schedule[day.key];
                        const isAbsent = dayData.isAbsent;
                        const isWeekend = day.key === "saturday" || day.key === "sunday";

                        if (isAbsent) {
                            return (
                                <View key={day.key} style={[styles.dayCard, styles.dayCardAbsent]}>
                                    <View style={styles.absentIndicator} />
                                    <View style={styles.absentOverlay} />
                                    <View style={styles.absentContent}>
                                        <View style={styles.absentHeader}>
                                            <View style={styles.absentHeaderLeft}>
                                                <Text style={styles.dayLabel}>{day.label}</Text>
                                                <View style={styles.absentBadge}>
                                                    <Text style={styles.absentBadgeText}>AUSENTE</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity>
                                                <Text style={styles.editLink}>Editar</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.absentReasonRow}>
                                            <MaterialIcons name="beach-access" size={18} color={COLORS.red400} />
                                            <Text style={styles.absentReasonText}>
                                                {dayData.absenceReason}: Todo el día
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View
                                key={day.key}
                                style={[
                                    styles.dayCard,
                                    dayData.enabled && styles.dayCardActive,
                                    !dayData.enabled && styles.dayCardDisabled
                                ]}
                            >
                                {dayData.enabled && <View style={styles.activeIndicator} />}
                                <View style={styles.dayHeader}>
                                    <Text style={[
                                        styles.dayLabel,
                                        !dayData.enabled && styles.dayLabelDisabled
                                    ]}>
                                        {day.label}
                                    </Text>
                                    <Switch
                                        value={dayData.enabled}
                                        onValueChange={() => toggleDay(day.key)}
                                        trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>

                                {dayData.enabled && (
                                    <View style={styles.slotsContainer}>
                                        {dayData.slots.map((slot) => (
                                            <View key={slot.id} style={styles.slotRow}>
                                                <View style={styles.timeInputs}>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        value={slot.start}
                                                        onChangeText={(v) => updateSlot(day.key, slot.id, 'start', v)}
                                                        placeholder="09:00"
                                                    />
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        value={slot.end}
                                                        onChangeText={(v) => updateSlot(day.key, slot.id, 'end', v)}
                                                        placeholder="18:00"
                                                    />
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.removeSlotButton}
                                                    onPress={() => removeSlot(day.key, slot.id)}
                                                >
                                                    <MaterialIcons name="remove-circle-outline" size={24} color={COLORS.gray400} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.addSlotButton}
                                            onPress={() => addSlot(day.key)}
                                        >
                                            <MaterialIcons name="add" size={16} color={COLORS.primary} />
                                            <Text style={styles.addSlotText}>Añadir franja horaria</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <MaterialIcons name="save" size={24} color={COLORS.primaryContent} />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        overflow: "hidden",
    },
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    settingsLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingsLeftColumn: {
        flex: 1,
    },
    settingsLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    settingsHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    settingsRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    settingsValue: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
    },
    absenceCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        gap: 16,
        position: "relative",
        overflow: "hidden",
    },
    absenceIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.blue500,
    },
    absenceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.blue50,
        alignItems: "center",
        justifyContent: "center",
    },
    absenceContent: {
        flex: 1,
    },
    absenceTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    absenceHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    absenceAddButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.backgroundLight,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        overflow: "hidden",
        position: "relative",
    },
    dayCardActive: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    dayCardDisabled: {
        opacity: 0.6,
    },
    dayCardAbsent: {
        borderWidth: 1,
        borderColor: "rgba(248, 113, 113, 0.3)",
    },
    activeIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.primary,
    },
    absentIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        backgroundColor: COLORS.red400,
        zIndex: 10,
    },
    absentOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.red50,
        opacity: 0.7,
    },
    absentContent: {
        position: "relative",
        zIndex: 1,
    },
    absentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    absentHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    absentBadge: {
        backgroundColor: "rgba(185, 28, 28, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    absentBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.red700,
        textTransform: "uppercase",
    },
    editLink: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.primary,
    },
    absentReasonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    absentReasonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    dayHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dayLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    dayLabelDisabled: {
        color: COLORS.textMuted,
    },
    slotsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        gap: 12,
    },
    slotRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    timeInputs: {
        flex: 1,
        flexDirection: "row",
        gap: 12,
    },
    timeInput: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        textAlign: "center",
        fontSize: 14,
        fontFamily: "monospace",
        color: COLORS.textMain,
    },
    removeSlotButton: {
        padding: 4,
    },
    addSlotButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 10,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: COLORS.gray300,
        borderRadius: 8,
    },
    addSlotText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.primary,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24,
        backgroundColor: COLORS.backgroundLight,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primaryContent,
    },
});
