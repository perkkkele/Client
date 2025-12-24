import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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
    { id: "L", label: "L" },
    { id: "M", label: "M" },
    { id: "X", label: "X" },
    { id: "J", label: "J" },
    { id: "V", label: "V" },
    { id: "S", label: "S" },
    { id: "D", label: "D" },
];

export default function ProContactScreen() {
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [location, setLocation] = useState("");
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

    function handleBack() {
        router.back();
    }

    function toggleDay(dayId: string) {
        setWorkDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    }

    async function handleContinue() {
        setIsLoading(true);
        try {
            // TODO: Guardar datos de contacto en backend
            // Por ahora solo navegamos al siguiente paso
            router.push("/onboarding/pro-complete");
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
                    <TouchableOpacity style={styles.helpButton}>
                        <Text style={styles.helpText}>Ayuda</Text>
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
                        <TouchableOpacity style={styles.visibilityButton}>
                            <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
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
                        <TouchableOpacity style={styles.visibilityButton}>
                            <MaterialIcons name="visibility-off" size={20} color={COLORS.gray400} />
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
                        <TouchableOpacity style={styles.visibilityButton}>
                            <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Ubicación */}
                    <View style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="location-on" size={20} color={COLORS.gray400} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Ubicación / Consulta</Text>
                            <TextInput
                                style={styles.contactInput}
                                placeholder="Madrid, España"
                                placeholderTextColor={COLORS.gray400}
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                        <TouchableOpacity style={styles.visibilityButton}>
                            <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
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
                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Inicio</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={workStart}
                                    onChangeText={setWorkStart}
                                    placeholder="09:00"
                                />
                            </View>
                            <Text style={styles.timeSeparator}>-</Text>
                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Fin</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={workEnd}
                                    onChangeText={setWorkEnd}
                                    placeholder="18:00"
                                />
                            </View>
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
                            <TouchableOpacity style={styles.calendarButton}>
                                <MaterialIcons name="event" size={16} color={COLORS.textMain} />
                                <Text style={styles.calendarButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.calendarButton}>
                                <MaterialIcons name="event" size={16} color={COLORS.textMain} />
                                <Text style={styles.calendarButtonText}>Outlook</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.calendarButton}>
                                <MaterialIcons name="event" size={16} color={COLORS.textMain} />
                                <Text style={styles.calendarButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Redes Sociales */}
                    <Text style={styles.sectionTitle}>Redes Sociales</Text>
                    <View style={styles.socialCard}>
                        <View style={styles.socialRow}>
                            <View style={[styles.socialIcon, { backgroundColor: "#0077b5" }]}>
                                <Text style={styles.socialIconText}>in</Text>
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
                                <MaterialIcons name="camera-alt" size={14} color="#FFFFFF" />
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
                                <Text style={styles.socialIconText}>f</Text>
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
                                <Text style={styles.socialIconText}>♪</Text>
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
                                <MaterialIcons name="play-arrow" size={14} color="#FFFFFF" />
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
        </SafeAreaView>
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
});
