import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import * as calendarApi from "../../api/calendar";
import AddressAutocomplete from "../../components/AddressAutocomplete";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#000000",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1C1C1E",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    gray800: "#1F2937",
    zinc700: "#3f3f46",
    zinc800: "#27272a",
    blue600: "#2563EB",
    green400: "#4ADE80",
};

const DAYS = [
    { id: "L", label: "L", key: "monday" },
    { id: "M", label: "M", key: "tuesday" },
    { id: "X", label: "X", key: "wednesday" },
    { id: "J", label: "J", key: "thursday" },
    { id: "V", label: "V", key: "friday" },
    { id: "S", label: "S", key: "saturday" },
    { id: "D", label: "D", key: "sunday" },
];

const TIME_OPTIONS = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

export default function ProContactScreen() {
    const { token, user, refreshUser } = useAuth();
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [location, setLocation] = useState("");
    const [locationData, setLocationData] = useState<{
        address: string | null;
        city: string | null;
        lat: number | null;
        lng: number | null;
    }>({ address: null, city: null, lat: null, lng: null });
    const [workDays, setWorkDays] = useState<string[]>(["L", "M", "X", "J", "V"]);
    const [workStart, setWorkStart] = useState("09:00");
    const [workEnd, setWorkEnd] = useState("18:00");
    const [linkedin, setLinkedin] = useState("");
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [tiktok, setTiktok] = useState("");
    const [youtube, setYoutube] = useState("");
    const [twitter, setTwitter] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

    // Visibility toggles
    const [emailVisible, setEmailVisible] = useState(true);
    const [phoneVisible, setPhoneVisible] = useState(true);
    const [websiteVisible, setWebsiteVisible] = useState(true);

    // Time picker modal
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerType, setTimePickerType] = useState<"start" | "end">("start");

    const calendarConnected = user?.connectedCalendar?.connected || false;
    const calendarProvider = user?.connectedCalendar?.provider || null;

    function handleBack() {
        router.back();
    }

    function handleSkip() {
        router.push("/onboarding/pro-complete");
    }

    function toggleDay(dayId: string) {
        setWorkDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    }

    function openTimePicker(type: "start" | "end") {
        setTimePickerType(type);
        setTimePickerVisible(true);
    }

    function selectTime(time: string) {
        if (timePickerType === "start") {
            setWorkStart(time);
        } else {
            setWorkEnd(time);
        }
        setTimePickerVisible(false);
    }

    async function handleConnectGoogle() {
        if (!token) return;
        setIsConnectingCalendar(true);
        try {
            const { url } = await calendarApi.getGoogleAuthUrl(token);
            await Linking.openURL(url);
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo conectar con Google Calendar");
        } finally {
            setIsConnectingCalendar(false);
        }
    }

    async function handleConnectOutlook() {
        if (!token) return;
        setIsConnectingCalendar(true);
        try {
            const { url } = await calendarApi.getOutlookAuthUrl(token);
            await Linking.openURL(url);
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo conectar con Outlook");
        } finally {
            setIsConnectingCalendar(false);
        }
    }

    async function handleContinue() {
        setIsLoading(true);
        try {
            if (token) {
                // Day ID to number mapping (0=Dom, 1=Lun, ...)
                const dayIdToNumber: Record<string, number> = {
                    "D": 0, // Domingo
                    "L": 1, // Lunes
                    "M": 2, // Martes
                    "X": 3, // Miércoles
                    "J": 4, // Jueves
                    "V": 5, // Viernes
                    "S": 6, // Sábado
                };

                // Construir workSchedule compatible con work-schedule.tsx
                // Convert selected day IDs (L, M, X, J, V, S, D) to day numbers (0-6)
                const selectedDayNumbers: number[] = workDays
                    .map(dayId => dayIdToNumber[dayId])
                    .filter((n): n is number => n !== undefined)
                    .sort((a, b) => a - b);

                const dayOverrides: { day: number; enabled: boolean; start: string; end: string }[] =
                    selectedDayNumbers.map(dayNum => ({
                        day: dayNum,
                        enabled: true,
                        start: workStart,
                        end: workEnd,
                    }));

                // Build workSchedule object (same format as work-schedule.tsx)
                const workSchedule = {
                    workDays: selectedDayNumbers,
                    defaultHours: {
                        start: workStart,
                        end: workEnd,
                    },
                    dayOverrides,
                    breaks: [],
                };

                // Usar locationData del autocompletado o dirección sin validar
                const finalLocationData = locationData.lat && locationData.lng
                    ? locationData
                    : {
                        address: location.trim() || null,
                        city: null,
                        lat: null,
                        lng: null
                    };

                await userApi.updateUser(token, {
                    professionalEmail: contactEmail.trim() || undefined,
                    phone: contactPhone.trim() || undefined,
                    website: website.trim() || undefined,
                    location: finalLocationData,
                    workSchedule,
                    appointmentsEnabled: true, // Enable appointments for the professional
                    socialLinks: {
                        linkedin: linkedin.trim() || null,
                        instagram: instagram.trim() || null,
                        twitter: twitter.trim() || null,
                        facebook: facebook.trim() || null,
                        tiktok: tiktok.trim() || null,
                        youtube: youtube.trim() || null,
                    },
                    contactVisibility: {
                        email: emailVisible,
                        phone: phoneVisible,
                        website: websiteVisible
                    }
                });

                if (refreshUser) {
                    await refreshUser();
                }

                router.push("/onboarding/pro-complete");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar");
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            {/* Header negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepText}>Paso 2 de 2</Text>
                        <View style={styles.stepDots}>
                            <View style={styles.stepDotDone} />
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipText}>Omitir</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Datos de Contacto</Text>
                    <Text style={styles.headerSubtitle}>Gestiona tu disponibilidad y canales.</Text>
                </View>
            </View>

            {/* Contenido con scroll */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Información de Contacto */}
                    <Text style={styles.sectionTitle}>Información de Contacto</Text>

                    {/* Email */}
                    <View style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="mail" size={20} color={COLORS.gray400} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Email Profesional</Text>
                            <TextInput
                                style={styles.contactInput}
                                placeholder="contacto@email.com"
                                placeholderTextColor={COLORS.gray400}
                                value={contactEmail}
                                onChangeText={setContactEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <TouchableOpacity style={styles.visibilityButton} onPress={() => setEmailVisible(!emailVisible)}>
                            <MaterialIcons name={emailVisible ? "visibility" : "visibility-off"} size={20} color={emailVisible ? COLORS.primary : COLORS.gray400} />
                        </TouchableOpacity>
                    </View>

                    {/* Teléfono */}
                    <View style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="phone" size={20} color={COLORS.gray400} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Móvil de Trabajo</Text>
                            <TextInput
                                style={styles.contactInput}
                                placeholder="+34 600 000 000"
                                placeholderTextColor={COLORS.gray400}
                                value={contactPhone}
                                onChangeText={setContactPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <TouchableOpacity style={styles.visibilityButton} onPress={() => setPhoneVisible(!phoneVisible)}>
                            <MaterialIcons name={phoneVisible ? "visibility" : "visibility-off"} size={20} color={phoneVisible ? COLORS.primary : COLORS.gray400} />
                        </TouchableOpacity>
                    </View>

                    {/* Web */}
                    <View style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="language" size={20} color={COLORS.gray400} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Sitio Web</Text>
                            <TextInput
                                style={styles.contactInput}
                                placeholder="https://tuweb.com"
                                placeholderTextColor={COLORS.gray400}
                                value={website}
                                onChangeText={setWebsite}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>
                        <TouchableOpacity style={styles.visibilityButton} onPress={() => setWebsiteVisible(!websiteVisible)}>
                            <MaterialIcons name={websiteVisible ? "visibility" : "visibility-off"} size={20} color={websiteVisible ? COLORS.primary : COLORS.gray400} />
                        </TouchableOpacity>
                    </View>

                    {/* Ubicación con autocompletado */}
                    <View style={[styles.contactCard, { flexDirection: 'column', alignItems: 'stretch', zIndex: 100 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={styles.contactIcon}>
                                <MaterialIcons name="location-on" size={20} color={COLORS.gray400} />
                            </View>
                            <Text style={styles.contactLabel}>Ubicación / Consulta</Text>
                        </View>
                        <AddressAutocomplete
                            value={location}
                            onChangeText={setLocation}
                            onAddressSelect={(address) => {
                                setLocation(address.formattedAddress);
                                setLocationData({
                                    address: address.formattedAddress,
                                    city: address.city,
                                    lat: address.lat,
                                    lng: address.lng,
                                });
                            }}
                            placeholder="Escribe una dirección..."
                        />
                    </View>

                    {/* Horario Laboral */}
                    <Text style={styles.sectionTitle}>Horario Laboral</Text>
                    <View style={styles.scheduleCard}>
                        <Text style={styles.scheduleLabel}>Días Laborables</Text>
                        <View style={styles.daysRow}>
                            {DAYS.map((day) => (
                                <TouchableOpacity
                                    key={day.id}
                                    style={[
                                        styles.dayButton,
                                        workDays.includes(day.id) && styles.dayButtonActive
                                    ]}
                                    onPress={() => toggleDay(day.id)}
                                >
                                    <Text style={[
                                        styles.dayButtonText,
                                        workDays.includes(day.id) && styles.dayButtonTextActive
                                    ]}>
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.scheduleLabel, { marginTop: 16 }]}>Franja Horaria</Text>
                        <View style={styles.timeRow}>
                            <TouchableOpacity style={styles.timeBox} onPress={() => openTimePicker("start")}>
                                <Text style={styles.timeLabel}>Inicio</Text>
                                <View style={styles.timePickerRow}>
                                    <Text style={styles.timeInput}>{workStart}</Text>
                                    <MaterialIcons name="arrow-drop-down" size={20} color={COLORS.gray400} />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.timeSeparator}>-</Text>
                            <TouchableOpacity style={styles.timeBox} onPress={() => openTimePicker("end")}>
                                <Text style={styles.timeLabel}>Fin</Text>
                                <View style={styles.timePickerRow}>
                                    <Text style={styles.timeInput}>{workEnd}</Text>
                                    <MaterialIcons name="arrow-drop-down" size={20} color={COLORS.gray400} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Integrar Calendario */}
                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <View style={styles.calendarIconContainer}>
                                <MaterialIcons name="event" size={20} color={COLORS.blue600} />
                            </View>
                            <View style={styles.calendarTextContainer}>
                                <Text style={styles.calendarTitle}>Integrar Calendario</Text>
                                <Text style={styles.calendarSubtitle}>Sincroniza para evitar conflictos</Text>
                            </View>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>Recomendado</Text>
                            </View>
                        </View>
                        <View style={styles.calendarButtons}>
                            {calendarConnected ? (
                                <View style={styles.calendarConnectedBadge}>
                                    <MaterialIcons name="check-circle" size={16} color="#059669" />
                                    <Text style={styles.calendarConnectedText}>
                                        {calendarProvider === "google" ? "Google Calendar" : "Outlook"} conectado
                                    </Text>
                                </View>
                            ) : isConnectingCalendar ? (
                                <View style={styles.calendarConnectedBadge}>
                                    <ActivityIndicator size="small" color={COLORS.textMain} />
                                    <Text style={styles.calendarConnectedText}>Conectando...</Text>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.calendarButton} onPress={handleConnectGoogle}>
                                        <MaterialIcons name="event" size={16} color={COLORS.textMain} />
                                        <Text style={styles.calendarButtonText}>Google</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.calendarButton} onPress={handleConnectOutlook}>
                                        <MaterialIcons name="event" size={16} color={COLORS.textMain} />
                                        <Text style={styles.calendarButtonText}>Outlook</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Redes Sociales */}
                    <Text style={styles.sectionTitle}>Redes Sociales</Text>
                    <View style={styles.socialCard}>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#0077b5" }]}>
                                <FontAwesome5 name="linkedin-in" size={12} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="linkedin.com/in/usuario"
                                placeholderTextColor={COLORS.gray400}
                                value={linkedin}
                                onChangeText={setLinkedin}
                            />
                        </View>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#E1306C" }]}>
                                <FontAwesome5 name="instagram" size={12} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="@usuario"
                                placeholderTextColor={COLORS.gray400}
                                value={instagram}
                                onChangeText={setInstagram}
                            />
                        </View>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#1877F2" }]}>
                                <FontAwesome5 name="facebook-f" size={12} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="facebook.com/usuario"
                                placeholderTextColor={COLORS.gray400}
                                value={facebook}
                                onChangeText={setFacebook}
                            />
                        </View>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#000000" }]}>
                                <FontAwesome5 name="tiktok" size={12} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="@usuario"
                                placeholderTextColor={COLORS.gray400}
                                value={tiktok}
                                onChangeText={setTiktok}
                            />
                        </View>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#FF0000" }]}>
                                <FontAwesome5 name="youtube" size={12} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="youtube.com/@canal"
                                placeholderTextColor={COLORS.gray400}
                                value={youtube}
                                onChangeText={setYoutube}
                            />
                        </View>
                        <View style={[styles.socialRow, { borderBottomWidth: 0 }]}>
                            <View style={[styles.socialIcon, { backgroundColor: "#000000" }]}>
                                <Text style={styles.socialIconText}>𝕏</Text>
                            </View>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="@usuario"
                                placeholderTextColor={COLORS.gray400}
                                value={twitter}
                                onChangeText={setTwitter}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Guardar y Continuar</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Time Picker Modal */}
            <Modal
                visible={timePickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTimePickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setTimePickerVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Seleccionar {timePickerType === "start" ? "hora de inicio" : "hora de fin"}
                            </Text>
                            <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.gray400} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={TIME_OPTIONS}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.timeOption,
                                        (timePickerType === "start" ? workStart : workEnd) === item && styles.timeOptionSelected
                                    ]}
                                    onPress={() => selectTime(item)}
                                >
                                    <Text style={[
                                        styles.timeOptionText,
                                        (timePickerType === "start" ? workStart : workEnd) === item && styles.timeOptionTextSelected
                                    ]}>
                                        {item}
                                    </Text>
                                    {(timePickerType === "start" ? workStart : workEnd) === item && (
                                        <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        backgroundColor: COLORS.backgroundDark,
        paddingTop: 48,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepIndicator: {
        alignItems: "center",
    },
    stepText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    stepDots: {
        flexDirection: "row",
        gap: 6,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.zinc800,
    },
    stepDotDone: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(253, 224, 71, 0.4)",
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
        borderRadius: 4,
    },
    helpButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    helpText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    skipButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    skipText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    calendarConnectedBadge: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        gap: 8,
    },
    calendarConnectedText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#059669",
    },
    headerContent: {
        alignItems: "center",
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.gray400,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        marginTop: -24,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 12,
        marginLeft: 4,
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 6,
        paddingRight: 16,
        marginBottom: 8,
        gap: 12,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.gray50,
        alignItems: "center",
        justifyContent: "center",
    },
    contactContent: {
        flex: 1,
        paddingVertical: 4,
    },
    contactLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        marginBottom: 2,
    },
    contactInput: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
        padding: 0,
    },
    visibilityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    scheduleCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    scheduleLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    daysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 4,
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    dayButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    dayButtonText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
    },
    dayButtonTextActive: {
        color: "#000000",
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    timeBox: {
        flex: 1,
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    timeLabel: {
        fontSize: 9,
        color: COLORS.gray400,
        marginBottom: 4,
    },
    timeInput: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    timeSeparator: {
        fontSize: 16,
        color: COLORS.gray400,
    },
    timePickerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    calendarCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.5)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    calendarHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    calendarIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    calendarTextContainer: {
        flex: 1,
    },
    calendarTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    calendarSubtitle: {
        fontSize: 10,
        color: COLORS.gray500,
        marginTop: 2,
    },
    recommendedBadge: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.2)",
    },
    recommendedText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#059669",
    },
    calendarButtons: {
        flexDirection: "row",
        gap: 8,
    },
    calendarButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.surfaceLight,
        gap: 6,
    },
    calendarButtonText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    socialCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 24,
    },
    socialRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    socialIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    socialIconText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    socialInput: {
        flex: 1,
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    footer: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000000",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: "60%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    timeOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    timeOptionSelected: {
        backgroundColor: "rgba(253, 224, 71, 0.2)",
    },
    timeOptionText: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    timeOptionTextSelected: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
});
