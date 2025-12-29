import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { userApi, API_HOST, API_PORT } from "../../api";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    primaryDark: "#EAB308",
    white: "#FFFFFF",
    indigo500: "#6366F1",
    indigo600: "#4F46E5",
    emerald500: "#10B981",
    emerald600: "#059669",
};

const CATEGORIES = [
    { id: "legal", label: "Legal" },
    { id: "salud", label: "Salud" },
    { id: "educacion", label: "Educación" },
    { id: "finanzas", label: "Finanzas" },
    { id: "fitness", label: "Fitness" },
    { id: "tecnologia", label: "Tecnología" },
    { id: "hogar", label: "Hogar" },
    { id: "bienestar", label: "Bienestar" },
    { id: "otros", label: "Otros" },
];

export default function EditProProfileScreen() {
    const { token, user, refreshUser } = useAuth();

    // Initialize with existing user data
    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return null;
        if (avatar.startsWith("http")) return avatar;
        return `http://${API_HOST}:${API_PORT}/${avatar}`;
    };

    const [avatarUri, setAvatarUri] = useState<string | null>(getAvatarUrl(user?.avatar) || null);
    const [publicName, setPublicName] = useState(user?.publicName || "");
    const [profession, setProfession] = useState(user?.profession || "");
    const [category, setCategory] = useState(user?.category || "");
    const [specialties, setSpecialties] = useState<string[]>(user?.specialties || []);
    const [newSpecialty, setNewSpecialty] = useState("");
    const [bio, setBio] = useState(user?.bio || "");
    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    // Appointment settings
    const [appointmentsEnabled, setAppointmentsEnabled] = useState(user?.appointmentsEnabled || false);
    const [appointmentStartTime, setAppointmentStartTime] = useState(user?.appointmentHours?.start || "09:00");
    const [appointmentEndTime, setAppointmentEndTime] = useState(user?.appointmentHours?.end || "18:00");

    const bioMaxLength = 300;

    function handleBack() {
        router.back();
    }

    async function handlePickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    }

    function addSpecialty() {
        if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
            setSpecialties([...specialties, newSpecialty.trim()]);
            setNewSpecialty("");
        }
    }

    function removeSpecialty(index: number) {
        setSpecialties(specialties.filter((_, i) => i !== index));
    }

    async function handleSave() {
        if (!publicName.trim()) {
            Alert.alert("Error", "Por favor ingresa tu nombre público");
            return;
        }
        if (!profession.trim()) {
            Alert.alert("Error", "Por favor ingresa tu profesión");
            return;
        }

        setIsLoading(true);
        try {
            if (token) {
                // Update professional profile data
                await userApi.updateUser(token, {
                    publicName: publicName.trim(),
                    profession: profession.trim(),
                    category: category as any,
                    specialties: specialties,
                    bio: bio.trim() || undefined,
                    appointmentsEnabled,
                    appointmentHours: {
                        start: appointmentStartTime,
                        end: appointmentEndTime,
                    },
                });

                // Upload avatar if changed
                if (avatarUri && !avatarUri.startsWith("http")) {
                    await userApi.updateAvatar(token, avatarUri);
                }

                if (refreshUser) {
                    await refreshUser();
                }
            }

            Alert.alert("Éxito", "Perfil actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar el perfil");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil Profesional</Text>
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={COLORS.textMain} />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={48} color={COLORS.gray400} />
                                </View>
                            )}
                            <View style={styles.cameraButton}>
                                <MaterialIcons name="camera-alt" size={18} color={COLORS.textMain} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Toca para cambiar tu foto</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>INFORMACIÓN BÁSICA</Text>

                        <View style={styles.card}>
                            {/* Public Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre público</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Dr. Juan Pérez"
                                    placeholderTextColor={COLORS.gray400}
                                    value={publicName}
                                    onChangeText={setPublicName}
                                />
                            </View>

                            <View style={styles.divider} />

                            {/* Profession */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Profesión</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Abogado, Médico, Coach..."
                                    placeholderTextColor={COLORS.gray400}
                                    value={profession}
                                    onChangeText={setProfession}
                                />
                            </View>

                            <View style={styles.divider} />

                            {/* Category */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Categoría</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                                >
                                    <Text style={[styles.pickerText, !category && styles.placeholderText]}>
                                        {category ? CATEGORIES.find(c => c.id === category)?.label : "Seleccionar..."}
                                    </Text>
                                    <MaterialIcons
                                        name={showCategoryPicker ? "expand-less" : "expand-more"}
                                        size={20}
                                        color={COLORS.gray400}
                                    />
                                </TouchableOpacity>
                                {showCategoryPicker && (
                                    <View style={styles.categoryPicker}>
                                        {CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[
                                                    styles.categoryOption,
                                                    category === cat.id && styles.categoryOptionSelected
                                                ]}
                                                onPress={() => {
                                                    setCategory(cat.id);
                                                    setShowCategoryPicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.categoryOptionText,
                                                    category === cat.id && styles.categoryOptionTextSelected
                                                ]}>
                                                    {cat.label}
                                                </Text>
                                                {category === cat.id && (
                                                    <MaterialIcons name="check" size={18} color={COLORS.primaryDark} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Specialties Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ESPECIALIDADES</Text>

                        <View style={styles.card}>
                            <View style={styles.specialtiesContainer}>
                                {specialties.map((specialty, index) => (
                                    <View key={index} style={styles.specialtyTag}>
                                        <Text style={styles.specialtyTagText}>{specialty}</Text>
                                        <TouchableOpacity onPress={() => removeSpecialty(index)}>
                                            <MaterialIcons name="close" size={14} color={COLORS.primaryDark} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.addSpecialtyRow}>
                                <TextInput
                                    style={styles.specialtyInput}
                                    placeholder="Añadir especialidad..."
                                    placeholderTextColor={COLORS.gray400}
                                    value={newSpecialty}
                                    onChangeText={setNewSpecialty}
                                    onSubmitEditing={addSpecialty}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity style={styles.addButton} onPress={addSpecialty}>
                                    <MaterialIcons name="add" size={20} color={COLORS.textMain} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Bio Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>PRESENTACIÓN</Text>
                            <Text style={styles.bioCounter}>{bio.length}/{bioMaxLength}</Text>
                        </View>

                        <View style={styles.card}>
                            <TextInput
                                style={styles.bioInput}
                                placeholder="Describe tu experiencia, enfoque profesional y qué pueden esperar los clientes de ti..."
                                placeholderTextColor={COLORS.gray400}
                                value={bio}
                                onChangeText={(text) => setBio(text.slice(0, bioMaxLength))}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Appointments Section - Premium Card */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>AGENDA DE CITAS</Text>

                        <View style={styles.appointmentsCard}>
                            {/* Gradient Header */}
                            <View style={styles.appointmentsHeader}>
                                <View style={styles.appointmentsIconContainer}>
                                    <MaterialIcons name="event" size={24} color={COLORS.white} />
                                </View>
                                <View style={styles.appointmentsHeaderText}>
                                    <Text style={styles.appointmentsTitle}>Citas desde la app</Text>
                                    <Text style={styles.appointmentsSubtitle}>
                                        Permite que los clientes agenden contigo
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.appointmentsToggle,
                                        appointmentsEnabled && styles.appointmentsToggleActive
                                    ]}
                                    onPress={() => setAppointmentsEnabled(!appointmentsEnabled)}
                                >
                                    <View style={[
                                        styles.appointmentsToggleDot,
                                        appointmentsEnabled && styles.appointmentsToggleDotActive
                                    ]} />
                                </TouchableOpacity>
                            </View>

                            {/* Time Settings - Only show when enabled */}
                            {appointmentsEnabled && (
                                <View style={styles.appointmentsTimeSection}>
                                    <View style={styles.appointmentsTimeHeader}>
                                        <MaterialIcons name="schedule" size={16} color={COLORS.gray500} />
                                        <Text style={styles.appointmentsTimeLabel}>Horario de atención</Text>
                                    </View>

                                    <View style={styles.appointmentsTimeRow}>
                                        <View style={styles.appointmentsTimeInput}>
                                            <Text style={styles.appointmentsTimeInputLabel}>Desde</Text>
                                            <TextInput
                                                style={styles.appointmentsTimeInputField}
                                                value={appointmentStartTime}
                                                onChangeText={setAppointmentStartTime}
                                                placeholder="09:00"
                                                placeholderTextColor={COLORS.gray400}
                                                keyboardType="numbers-and-punctuation"
                                            />
                                        </View>

                                        <View style={styles.appointmentsTimeSeparator}>
                                            <MaterialIcons name="arrow-forward" size={20} color={COLORS.gray400} />
                                        </View>

                                        <View style={styles.appointmentsTimeInput}>
                                            <Text style={styles.appointmentsTimeInputLabel}>Hasta</Text>
                                            <TextInput
                                                style={styles.appointmentsTimeInputField}
                                                value={appointmentEndTime}
                                                onChangeText={setAppointmentEndTime}
                                                placeholder="18:00"
                                                placeholderTextColor={COLORS.gray400}
                                                keyboardType="numbers-and-punctuation"
                                            />
                                        </View>
                                    </View>

                                    {/* Info Badge */}
                                    <View style={styles.appointmentsInfoBadge}>
                                        <MaterialIcons name="info-outline" size={14} color={COLORS.indigo600} />
                                        <Text style={styles.appointmentsInfoText}>
                                            Los clientes podrán ver un icono de calendario en tu sala de chat
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        minWidth: 80,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: COLORS.gray200,
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: COLORS.surfaceLight,
    },
    avatarHint: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 8,
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
    inputGroup: {
        paddingVertical: 4,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textMain,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 12,
    },
    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    pickerText: {
        fontSize: 15,
        color: COLORS.textMain,
    },
    placeholderText: {
        color: COLORS.gray400,
    },
    categoryPicker: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        marginTop: 8,
        overflow: "hidden",
    },
    categoryOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    categoryOptionSelected: {
        backgroundColor: "rgba(249, 245, 6, 0.1)",
    },
    categoryOptionText: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    categoryOptionTextSelected: {
        fontWeight: "600",
        color: COLORS.primaryDark,
    },
    specialtiesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    specialtyTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(249, 245, 6, 0.15)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: "rgba(249, 245, 6, 0.3)",
    },
    specialtyTagText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primaryDark,
    },
    addSpecialtyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    specialtyInput: {
        flex: 1,
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textMain,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    bioCounter: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray200,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bioInput: {
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 100,
        lineHeight: 20,
    },

    // =========================================
    // APPOINTMENTS SECTION STYLES
    // =========================================
    appointmentsCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    appointmentsHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: COLORS.indigo600,
        gap: 12,
    },
    appointmentsIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    appointmentsHeaderText: {
        flex: 1,
    },
    appointmentsTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.white,
    },
    appointmentsSubtitle: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 2,
    },
    appointmentsToggle: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        padding: 2,
        justifyContent: "center",
    },
    appointmentsToggleActive: {
        backgroundColor: COLORS.emerald500,
    },
    appointmentsToggleDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    appointmentsToggleDotActive: {
        alignSelf: "flex-end",
    },
    appointmentsTimeSection: {
        padding: 16,
        gap: 12,
    },
    appointmentsTimeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    appointmentsTimeLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    appointmentsTimeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    appointmentsTimeInput: {
        flex: 1,
    },
    appointmentsTimeInputLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.gray500,
        marginBottom: 4,
    },
    appointmentsTimeInputField: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
    },
    appointmentsTimeSeparator: {
        paddingTop: 16,
    },
    appointmentsInfoBadge: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
    },
    appointmentsInfoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.indigo600,
        lineHeight: 16,
    },
});
