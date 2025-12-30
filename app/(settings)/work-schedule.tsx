import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    blue50: "#eff6ff",
    blue500: "#3b82f6",
    blue600: "#2563eb",
    green50: "#f0fdf4",
    green500: "#22c55e",
    green600: "#16a34a",
    orange50: "#fff7ed",
    orange600: "#ea580c",
    red50: "#fef2f2",
    red400: "#f87171",
    red600: "#dc2626",
    red700: "#b91c1c",
    white: "#FFFFFF",
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
    { key: "monday", label: "Lunes", short: "L" },
    { key: "tuesday", label: "Martes", short: "M" },
    { key: "wednesday", label: "Miércoles", short: "X" },
    { key: "thursday", label: "Jueves", short: "J" },
    { key: "friday", label: "Viernes", short: "V" },
    { key: "saturday", label: "Sábado", short: "S" },
    { key: "sunday", label: "Domingo", short: "D" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function WorkScheduleScreen() {
    const { token, user, refreshUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isRecurring, setIsRecurring] = useState(true);

    // Time picker modal state
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [editingSlot, setEditingSlot] = useState<{
        dayKey: string;
        slotId: string;
        field: "start" | "end";
        currentValue: string;
    } | null>(null);
    const [selectedHour, setSelectedHour] = useState("09");
    const [selectedMinute, setSelectedMinute] = useState("00");

    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
        monday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "13:00" }, { id: "2", start: "15:00", end: "19:00" }] },
        tuesday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "18:00" }] },
        wednesday: { enabled: true, slots: [{ id: "1", start: "09:00", end: "18:00" }] },
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
                slots: !prev[dayKey].enabled && prev[dayKey].slots.length === 0
                    ? [{ id: Date.now().toString(), start: "09:00", end: "18:00" }]
                    : prev[dayKey].slots,
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

    function openTimePicker(dayKey: string, slotId: string, field: "start" | "end", currentValue: string) {
        const [hour, minute] = currentValue.split(":");
        setSelectedHour(hour || "09");
        setSelectedMinute(minute || "00");
        setEditingSlot({ dayKey, slotId, field, currentValue });
        setTimePickerVisible(true);
    }

    function confirmTimePicker() {
        if (editingSlot) {
            const newTime = `${selectedHour}:${selectedMinute}`;
            setSchedule(prev => ({
                ...prev,
                [editingSlot.dayKey]: {
                    ...prev[editingSlot.dayKey],
                    slots: prev[editingSlot.dayKey].slots.map(s =>
                        s.id === editingSlot.slotId ? { ...s, [editingSlot.field]: newTime } : s
                    )
                }
            }));
        }
        setTimePickerVisible(false);
        setEditingSlot(null);
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            // TODO: Save schedule to backend
            // await userApi.updateUser(token, { schedule: ... });
            if (refreshUser) {
                await refreshUser();
            }
            Alert.alert("Éxito", "Horario actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar el horario");
        } finally {
            setIsSaving(false);
        }
    }

    // Count active days
    const activeDays = Object.values(schedule).filter(d => d.enabled).length;
    const totalSlots = Object.values(schedule).reduce((acc, d) => acc + (d.enabled ? d.slots.length : 0), 0);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Horario Laboral</Text>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? "..." : "Guardar"}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: COLORS.blue50 }]}>
                            <MaterialIcons name="calendar-today" size={20} color={COLORS.blue600} />
                        </View>
                        <View>
                            <Text style={styles.summaryValue}>{activeDays} días</Text>
                            <Text style={styles.summaryLabel}>Activos</Text>
                        </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="schedule" size={20} color={COLORS.green600} />
                        </View>
                        <View>
                            <Text style={styles.summaryValue}>{totalSlots} franjas</Text>
                            <Text style={styles.summaryLabel}>Horarias</Text>
                        </View>
                    </View>
                </View>

                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
                    <View style={styles.card}>
                        <View style={styles.settingsRow}>
                            <View style={styles.settingsLeft}>
                                <View style={[styles.settingsIcon, { backgroundColor: COLORS.orange50 }]}>
                                    <MaterialIcons name="repeat" size={20} color={COLORS.orange600} />
                                </View>
                                <View style={styles.settingsText}>
                                    <Text style={styles.settingsLabel}>Horario recurrente</Text>
                                    <Text style={styles.settingsHint}>Aplicar el mismo horario cada semana</Text>
                                </View>
                            </View>
                            <Switch
                                value={isRecurring}
                                onValueChange={setIsRecurring}
                                trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Weekly Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SEMANA LABORAL</Text>
                    <Text style={styles.sectionHint}>
                        Toca en cada hora para cambiarla. Puedes añadir múltiples franjas por día.
                    </Text>

                    {DAYS.map((day) => {
                        const dayData = schedule[day.key];

                        return (
                            <View
                                key={day.key}
                                style={[
                                    styles.dayCard,
                                    dayData.enabled && styles.dayCardActive,
                                ]}
                            >
                                {/* Day Header */}
                                <View style={styles.dayHeader}>
                                    <View style={styles.dayHeaderLeft}>
                                        <View style={[
                                            styles.dayBadge,
                                            dayData.enabled && styles.dayBadgeActive
                                        ]}>
                                            <Text style={[
                                                styles.dayBadgeText,
                                                dayData.enabled && styles.dayBadgeTextActive
                                            ]}>{day.short}</Text>
                                        </View>
                                        <Text style={[
                                            styles.dayLabel,
                                            !dayData.enabled && styles.dayLabelDisabled
                                        ]}>
                                            {day.label}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={dayData.enabled}
                                        onValueChange={() => toggleDay(day.key)}
                                        trackColor={{ false: COLORS.gray300, true: COLORS.green500 }}
                                        thumbColor={COLORS.white}
                                    />
                                </View>

                                {/* Time Slots */}
                                {dayData.enabled && (
                                    <View style={styles.slotsContainer}>
                                        {dayData.slots.map((slot, index) => (
                                            <View key={slot.id} style={styles.slotRow}>
                                                <View style={styles.slotTimes}>
                                                    {/* Start Time Button */}
                                                    <TouchableOpacity
                                                        style={styles.timeButton}
                                                        onPress={() => openTimePicker(day.key, slot.id, "start", slot.start)}
                                                    >
                                                        <MaterialIcons name="login" size={16} color={COLORS.green600} />
                                                        <Text style={styles.timeButtonText}>{slot.start}</Text>
                                                    </TouchableOpacity>

                                                    <MaterialIcons name="arrow-forward" size={16} color={COLORS.gray400} />

                                                    {/* End Time Button */}
                                                    <TouchableOpacity
                                                        style={styles.timeButton}
                                                        onPress={() => openTimePicker(day.key, slot.id, "end", slot.end)}
                                                    >
                                                        <MaterialIcons name="logout" size={16} color={COLORS.red600} />
                                                        <Text style={styles.timeButtonText}>{slot.end}</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Remove Slot */}
                                                {dayData.slots.length > 1 && (
                                                    <TouchableOpacity
                                                        style={styles.removeSlotButton}
                                                        onPress={() => removeSlot(day.key, slot.id)}
                                                    >
                                                        <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}

                                        {/* Add Slot */}
                                        <TouchableOpacity
                                            style={styles.addSlotButton}
                                            onPress={() => addSlot(day.key)}
                                        >
                                            <MaterialIcons name="add" size={18} color={COLORS.blue600} />
                                            <Text style={styles.addSlotText}>Añadir franja</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Help Notice */}
                <View style={styles.helpNotice}>
                    <MaterialIcons name="info-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.helpText}>
                        Este horario se usará para mostrar tu disponibilidad a los clientes que quieran agendar citas contigo.
                    </Text>
                </View>
            </ScrollView>

            {/* Time Picker Modal */}
            <Modal
                visible={timePickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setTimePickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                                <Text style={styles.modalCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                {editingSlot?.field === "start" ? "Hora de inicio" : "Hora de fin"}
                            </Text>
                            <TouchableOpacity onPress={confirmTimePicker}>
                                <Text style={styles.modalConfirm}>OK</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Time Display */}
                        <View style={styles.timeDisplay}>
                            <Text style={styles.timeDisplayText}>
                                {selectedHour}:{selectedMinute}
                            </Text>
                        </View>

                        {/* Picker Wheels */}
                        <View style={styles.pickerContainer}>
                            {/* Hours */}
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Hora</Text>
                                <ScrollView
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerScrollContent}
                                >
                                    {HOURS.map(hour => (
                                        <TouchableOpacity
                                            key={hour}
                                            style={[
                                                styles.pickerItem,
                                                selectedHour === hour && styles.pickerItemActive
                                            ]}
                                            onPress={() => setSelectedHour(hour)}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                selectedHour === hour && styles.pickerItemTextActive
                                            ]}>
                                                {hour}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Minutes */}
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Min</Text>
                                <ScrollView
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.pickerScrollContent}
                                >
                                    {MINUTES.map(minute => (
                                        <TouchableOpacity
                                            key={minute}
                                            style={[
                                                styles.pickerItem,
                                                selectedMinute === minute && styles.pickerItemActive
                                            ]}
                                            onPress={() => setSelectedMinute(minute)}
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                selectedMinute === minute && styles.pickerItemTextActive
                                            ]}>
                                                {minute}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {/* Quick Select for common times */}
                        <View style={styles.quickTimes}>
                            <Text style={styles.quickTimesLabel}>Rápido:</Text>
                            {["09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map(time => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.quickTimeButton,
                                        `${selectedHour}:${selectedMinute}` === time && styles.quickTimeButtonActive
                                    ]}
                                    onPress={() => {
                                        const [h, m] = time.split(":");
                                        setSelectedHour(h);
                                        setSelectedMinute(m);
                                    }}
                                >
                                    <Text style={[
                                        styles.quickTimeText,
                                        `${selectedHour}:${selectedMinute}` === time && styles.quickTimeTextActive
                                    ]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
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
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    summaryCard: {
        flexDirection: "row",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: COLORS.gray200,
        marginHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 12,
        lineHeight: 18,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    settingsLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingsIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsText: {
        flex: 1,
    },
    settingsLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    settingsHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    dayCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    dayCardActive: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.green500,
    },
    dayHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dayHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dayBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    dayBadgeActive: {
        backgroundColor: COLORS.green50,
    },
    dayBadgeText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    dayBadgeTextActive: {
        color: COLORS.green600,
    },
    dayLabel: {
        fontSize: 16,
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
        gap: 10,
    },
    slotRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    slotTimes: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    timeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: COLORS.gray100,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    timeButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
        fontFamily: "monospace",
    },
    removeSlotButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    addSlotButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: COLORS.blue500,
        borderRadius: 10,
        backgroundColor: COLORS.blue50,
    },
    addSlotText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.blue600,
    },
    helpNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 14,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
    },
    helpText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    modalCancel: {
        fontSize: 16,
        color: COLORS.gray500,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    modalConfirm: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.blue600,
    },
    timeDisplay: {
        alignItems: "center",
        paddingVertical: 24,
    },
    timeDisplayText: {
        fontSize: 48,
        fontWeight: "bold",
        color: COLORS.textMain,
        fontFamily: "monospace",
    },
    pickerContainer: {
        flexDirection: "row",
        paddingHorizontal: 40,
        gap: 20,
    },
    pickerColumn: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        textAlign: "center",
        marginBottom: 8,
    },
    pickerScroll: {
        height: 180,
    },
    pickerScrollContent: {
        paddingVertical: 60,
    },
    pickerItem: {
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 8,
        marginVertical: 2,
    },
    pickerItemActive: {
        backgroundColor: COLORS.primary,
    },
    pickerItemText: {
        fontSize: 20,
        color: COLORS.gray500,
        fontFamily: "monospace",
    },
    pickerItemTextActive: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    quickTimes: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    quickTimesLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        fontWeight: "600",
    },
    quickTimeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: COLORS.gray100,
    },
    quickTimeButtonActive: {
        backgroundColor: COLORS.primary,
    },
    quickTimeText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    quickTimeTextActive: {
        color: COLORS.textMain,
        fontWeight: "bold",
    },
});
