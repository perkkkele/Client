import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import { User } from "../../api/user";
import {
    getAvailableSlots,
    createAppointment,
    TimeSlot,
    AppointmentType,
    ServiceType,
} from "../../api/appointment";
import { createCheckoutSession } from "../../api/payment";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1a190b",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray50: "#f8fafc",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#cbd5e1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray600: "#475569",
    slate900: "#0F172A",
    blue100: "#dbeafe",
    blue400: "#60a5fa",
    blue600: "#2563eb",
    purple100: "#f3e8ff",
    purple400: "#c084fc",
    purple600: "#9333ea",
    green100: "#dcfce7",
    green600: "#16a34a",
    white: "#FFFFFF",
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Format date to YYYY-MM-DD using LOCAL timezone (not UTC)
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

interface ServiceOption {
    id: ServiceType;
    label: string;
    duration: number;
    price: number;
    description: string;
}

// Default prices (in cents) - used if professional hasn't configured pricing
const DEFAULT_PRICES: Record<number, number> = {
    15: 2500,
    30: 5000,
    45: 7500,
    60: 9000,
    90: 12000,
};

export default function BookAppointmentScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token, user } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    // Nuevos estados para tipo de cita y servicio
    const [appointmentType, setAppointmentType] = useState<AppointmentType>("videoconference");
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

    // Build service options dynamically from professional's pricing
    const SERVICE_OPTIONS = useMemo((): ServiceOption[] => {
        console.log('[BookAppointment] Building service options, professional:', professional?._id, 'prices:', professional?.appointmentPrices);

        if (!professional) {
            console.log('[BookAppointment] No professional data yet, using defaults');
            return [
                { id: "30min", label: "Consulta 30 min", duration: 30, price: DEFAULT_PRICES[30], description: "Consulta básica" },
                { id: "60min", label: "Consulta 60 min", duration: 60, price: DEFAULT_PRICES[60], description: "Consulta completa" },
            ];
        }

        const priceData = professional.appointmentPrices;
        const durations = professional.appointmentDurations;

        // Get relevant prices based on appointment type
        const typePrices = appointmentType === "videoconference"
            ? priceData?.videoconference
            : priceData?.presencial;

        console.log('[BookAppointment] Type prices for', appointmentType, ':', typePrices);

        // Default duration for current type
        const defaultDuration = appointmentType === "videoconference"
            ? (durations?.videoconference || 60)
            : (durations?.presencial || 60);

        // Build options for available durations with configured prices
        const options: ServiceOption[] = [];
        const availableDurations = [15, 30, 45, 60, 90]; // All possible durations

        for (const duration of availableDurations) {
            // Price from professional's config (already in euros)
            const priceInEuros = typePrices?.[duration] ?? 0;

            // Only include durations that have a configured price > 0
            if (priceInEuros > 0) {
                const priceInCents = priceInEuros * 100;
                const durationLabel = duration < 60 ? `${duration}min` : `${duration}min`;

                options.push({
                    id: duration <= 30 ? "30min" : "60min", // Map to ServiceType
                    label: `Consulta ${duration} min`,
                    duration,
                    price: priceInCents,
                    description: duration === defaultDuration ? "Duración por defecto" :
                        (duration < 45 ? "Consulta breve" : "Consulta completa"),
                });
            }
        }

        // If no prices configured, show defaults
        if (options.length === 0) {
            console.log('[BookAppointment] No configured prices, using defaults');
            return [
                { id: "30min", label: "Consulta 30 min", duration: 30, price: DEFAULT_PRICES[30], description: "Consulta básica" },
                { id: "60min", label: "Consulta 60 min", duration: 60, price: DEFAULT_PRICES[60], description: "Consulta completa" },
            ];
        }

        console.log('[BookAppointment] Built options:', options);
        return options;
    }, [professional, appointmentType]);

    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        setIsLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, professionalId]);

    useEffect(() => {
        loadProfessional();
    }, [loadProfessional]);

    // Cargar slots disponibles cuando cambia la fecha
    const loadAvailableSlots = useCallback(async () => {
        if (!token || !professionalId || !selectedDate) return;

        setIsLoadingSlots(true);
        try {
            const dateStr = formatLocalDate(selectedDate);
            // Pass appointment type to get correct duration-based slots
            const response = await getAvailableSlots(token, professionalId, dateStr, appointmentType);
            setTimeSlots(response.slots);
            setSelectedTime(null);
        } catch (error) {
            console.error("Error loading slots:", error);
            // Fallback a slots simulados si falla la API
            setTimeSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    }, [token, professionalId, selectedDate, appointmentType]);

    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedDate, loadAvailableSlots]);

    const handleBack = () => {
        router.back();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        // getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
        // We want Monday=0, Tuesday=1, ..., Sunday=6
        const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        // Convert: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
        return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    };

    const isDatePast = (day: number) => {
        const today = new Date();
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const isDateSelected = (day: number) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear()
        );
    };

    const handleSelectDate = (day: number) => {
        if (isDatePast(day)) return;
        setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    };

    const handleSelectTime = (time: string) => {
        setSelectedTime(time);
    };

    const formatSelectedDate = () => {
        if (!selectedDate) return "";
        // getDay() returns 0=Sunday, so we need separate lookup
        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const dayName = dayNames[selectedDate.getDay()];
        const day = selectedDate.getDate();
        const month = MONTHS[selectedDate.getMonth()].substring(0, 3);
        return `${dayName}, ${day} ${month}`;
    };

    const getSelectedServiceOption = (): ServiceOption | null => {
        if (selectedDuration === null) return null;
        return SERVICE_OPTIONS.find(s => s.duration === selectedDuration) || null;
    };

    const formatPrice = (cents: number): string => {
        return `${(cents / 100).toFixed(0)}€`;
    };

    const handleConfirmAppointment = async () => {
        if (!selectedDate || !selectedTime || !token || !professionalId) {
            Alert.alert("Error", "Por favor selecciona una fecha y hora");
            return;
        }

        setIsSubmitting(true);
        try {
            const dateStr = formatLocalDate(selectedDate);
            const serviceOption = getSelectedServiceOption();
            const price = serviceOption?.price || 0;

            const appointment = await createAppointment(token, {
                professionalId,
                date: dateStr,
                time: selectedTime,
                type: appointmentType,
                serviceType: selectedDuration && selectedDuration <= 30 ? "30min" : "60min",
                price,
            });

            // Payment logic:
            // - Videollamada: SIEMPRE requiere pago al agendar
            // - Presencial: Depende de la configuración del profesional
            const requiresPayment =
                appointmentType === "videoconference" ||
                (appointmentType === "presencial" && professional?.requirePaymentOnBooking !== false);

            if (requiresPayment) {
                // Pago obligatorio - abrir Stripe Checkout
                try {
                    const session = await createCheckoutSession(token, appointment._id);
                    const canOpen = await Linking.canOpenURL(session.url);
                    if (canOpen) {
                        Alert.alert(
                            "¡Cita Agendada!",
                            `Se abrirá la página de pago (${formatPrice(price)}) para confirmar tu cita.`,
                            [{ text: "Continuar", onPress: () => Linking.openURL(session.url) }]
                        );
                    } else {
                        Alert.alert("Error", "No se pudo abrir el enlace de pago");
                        router.replace(`/appointment-details/${appointment._id}` as any);
                    }
                } catch (payError: any) {
                    console.error("Payment error:", payError);
                    Alert.alert("Error", "No se pudo iniciar el pago. Podrás pagar desde los detalles de la cita.");
                    router.replace(`/appointment-details/${appointment._id}` as any);
                }
            } else {
                // Pago in situ - el profesional cobra directamente
                Alert.alert(
                    "¡Cita Agendada!",
                    "Tu cita presencial ha sido reservada. Pagarás directamente al profesional cuando asistas.",
                    [{ text: "OK", onPress: () => router.replace(`/appointment-details/${appointment._id}` as any) }]
                );
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo agendar la cita. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayName = professional?.publicName ||
        `${professional?.firstname || ""} ${professional?.lastname || ""}`.trim() ||
        "Profesional";

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days: React.ReactNode[] = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const isPast = isDatePast(day);
            const isSelected = isDateSelected(day);

            days.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.calendarDay,
                        isPast && styles.calendarDayPast,
                        isSelected && styles.calendarDaySelected,
                    ]}
                    onPress={() => handleSelectDate(day)}
                    disabled={isPast}
                >
                    <Text
                        style={[
                            styles.calendarDayText,
                            isPast && styles.calendarDayTextPast,
                            isSelected && styles.calendarDayTextSelected,
                        ]}
                    >
                        {day}
                    </Text>
                </TouchableOpacity>
            );
        }

        return days;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Agendar Cita</Text>
                    <Text style={styles.headerSubtitle}>con {displayName}</Text>
                </View>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Appointment Type Selector */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Tipo de Cita</Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeOption,
                                appointmentType === "videoconference" && styles.typeOptionSelected,
                            ]}
                            onPress={() => setAppointmentType("videoconference")}
                        >
                            <View style={[
                                styles.typeIconContainer,
                                appointmentType === "videoconference" && styles.typeIconContainerSelected,
                            ]}>
                                <MaterialIcons
                                    name="videocam"
                                    size={24}
                                    color={appointmentType === "videoconference" ? COLORS.textMain : COLORS.gray500}
                                />
                            </View>
                            <Text style={[
                                styles.typeLabel,
                                appointmentType === "videoconference" && styles.typeLabelSelected,
                            ]}>
                                Videollamada
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeOption,
                                appointmentType === "presencial" && styles.typeOptionSelected,
                            ]}
                            onPress={() => setAppointmentType("presencial")}
                        >
                            <View style={[
                                styles.typeIconContainer,
                                appointmentType === "presencial" && styles.typeIconContainerSelected,
                            ]}>
                                <MaterialIcons
                                    name="location-on"
                                    size={24}
                                    color={appointmentType === "presencial" ? COLORS.textMain : COLORS.gray500}
                                />
                            </View>
                            <Text style={[
                                styles.typeLabel,
                                appointmentType === "presencial" && styles.typeLabelSelected,
                            ]}>
                                Presencial
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Calendar Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionLabel}>Seleccionar Fecha</Text>
                        <View style={styles.monthNavigation}>
                            <TouchableOpacity style={styles.monthNavButton} onPress={handlePrevMonth}>
                                <MaterialIcons name="chevron-left" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>
                                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </Text>
                            <TouchableOpacity style={styles.monthNavButton} onPress={handleNextMonth}>
                                <MaterialIcons name="chevron-right" size={24} color={COLORS.textMain} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Weekday Headers */}
                    <View style={styles.weekdayRow}>
                        {WEEKDAYS.map((day) => (
                            <Text key={day} style={styles.weekdayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {renderCalendar()}
                    </View>
                </View>

                {/* Time Slots */}
                {selectedDate && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Horarios Disponibles</Text>
                            <Text style={styles.sectionHint}>{formatSelectedDate()}</Text>
                        </View>
                        {isLoadingSlots ? (
                            <View style={styles.loadingSlotsContainer}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.loadingSlotsText}>Cargando horarios...</Text>
                            </View>
                        ) : timeSlots.length > 0 ? (
                            <View style={styles.timeSlotsGrid}>
                                {timeSlots.map((slot) => (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[
                                            styles.timeSlot,
                                            !slot.available && styles.timeSlotUnavailable,
                                            selectedTime === slot.time && styles.timeSlotSelected,
                                        ]}
                                        onPress={() => slot.available && handleSelectTime(slot.time)}
                                        disabled={!slot.available}
                                    >
                                        <Text
                                            style={[
                                                styles.timeSlotText,
                                                !slot.available && styles.timeSlotTextUnavailable,
                                                selectedTime === slot.time && styles.timeSlotTextSelected,
                                            ]}
                                        >
                                            {slot.time}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.noSlotsContainer}>
                                <MaterialIcons name="event-busy" size={32} color={COLORS.gray400} />
                                <Text style={styles.noSlotsText}>No hay horarios disponibles para esta fecha</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Rates/Service Selection Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Tarifas del Profesional</Text>
                    <View style={styles.ratesContainer}>
                        {SERVICE_OPTIONS.map((service) => (
                            <TouchableOpacity
                                key={service.duration}
                                style={[
                                    styles.rateItem,
                                    selectedDuration === service.duration && styles.rateItemSelected,
                                ]}
                                onPress={() => setSelectedDuration(service.duration)}
                            >
                                <View style={styles.rateLeft}>
                                    <View style={[
                                        styles.rateIcon,
                                        {
                                            backgroundColor: service.duration <= 30 ? COLORS.blue100 : COLORS.purple100,
                                        },
                                    ]}>
                                        <MaterialIcons
                                            name={service.duration <= 30 ? "timer" : "history-edu"}
                                            size={22}
                                            color={service.duration <= 30 ? COLORS.blue600 : COLORS.purple600}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.rateTitle}>{service.label}</Text>
                                        <Text style={styles.rateSubtitle}>{service.description}</Text>
                                    </View>
                                </View>
                                <View style={styles.rateRight}>
                                    <Text style={styles.ratePrice}>{formatPrice(service.price)}</Text>
                                    {selectedDuration === service.duration && (
                                        <MaterialIcons name="check-circle" size={20} color={COLORS.green600} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!selectedDate || !selectedTime) && styles.confirmButtonDisabled,
                    ]}
                    onPress={handleConfirmAppointment}
                    disabled={!selectedDate || !selectedTime || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={COLORS.textMain} />
                    ) : (
                        <>
                            <MaterialIcons name="check-circle" size={22} color={COLORS.textMain} />
                            <Text style={styles.confirmButtonText}>Confirmar Cita</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.termsText}>
                    Al confirmar, aceptas los términos y condiciones de la consulta.
                </Text>

                {/* Bottom Padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos" as any)}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Directorio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Favoritos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/settings")}>
                    <MaterialIcons name="settings" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Ajustes</Text>
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
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.backgroundLight,
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.backgroundLight,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerCenter: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    headerPlaceholder: {
        width: 40,
        height: 40,
    },
    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    // Card
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    // Type Selector
    typeSelector: {
        flexDirection: "row",
        gap: 12,
    },
    typeOption: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
    },
    typeOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(249, 245, 6, 0.1)",
    },
    typeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    typeIconContainerSelected: {
        backgroundColor: COLORS.primary,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray500,
    },
    typeLabelSelected: {
        color: COLORS.textMain,
        fontWeight: "bold",
    },
    monthNavigation: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    monthNavButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    monthText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Calendar
    weekdayRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 12,
    },
    weekdayText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        width: 36,
        textAlign: "center",
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    calendarDayEmpty: {
        width: "14.28%",
        height: 40,
    },
    calendarDay: {
        width: "14.28%",
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    calendarDayPast: {
        opacity: 0.4,
    },
    calendarDaySelected: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        transform: [{ scale: 1.1 }],
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    calendarDayText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    calendarDayTextPast: {
        color: COLORS.gray300,
        textDecorationLine: "line-through",
    },
    calendarDayTextSelected: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Section
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionHint: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
    },
    // Loading Slots
    loadingSlotsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 24,
        gap: 8,
    },
    loadingSlotsText: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    // No Slots
    noSlotsContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
        backgroundColor: COLORS.white,
        borderRadius: 16,
    },
    noSlotsText: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 8,
        textAlign: "center",
    },
    // Time Slots
    timeSlotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    timeSlot: {
        width: "31%",
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
        alignItems: "center",
    },
    timeSlotUnavailable: {
        backgroundColor: COLORS.gray50,
        borderColor: COLORS.gray200,
    },
    timeSlotSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: "rgba(249, 245, 6, 0.1)",
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    timeSlotTextUnavailable: {
        color: COLORS.gray400,
        textDecorationLine: "line-through",
    },
    timeSlotTextSelected: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Rates
    ratesContainer: {
        gap: 12,
    },
    rateItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: COLORS.gray50,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.gray100,
    },
    rateItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(249, 245, 6, 0.1)",
    },
    rateLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rateIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    rateTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    rateSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    rateRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    ratePrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Confirm Button
    confirmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        gap: 8,
        marginBottom: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    termsText: {
        fontSize: 10,
        color: COLORS.gray400,
        textAlign: "center",
        marginBottom: 16,
    },
    // Bottom Navigation
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    navLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        fontWeight: "500",
    },
});
