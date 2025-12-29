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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { userApi } from "../../api";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#000000",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1C1C1E",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    gray800: "#1F2937",
    zinc800: "#27272a",
    zinc900: "#18181b",
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

export default function ProProfileScreen() {
    const { token, refreshUser } = useAuth();
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [publicName, setPublicName] = useState("");
    const [profession, setProfession] = useState("");
    const [category, setCategory] = useState("");
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [newSpecialty, setNewSpecialty] = useState("");
    const [bio, setBio] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const bioMaxLength = 160;

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

    async function handleContinue() {
        if (!publicName.trim()) {
            Alert.alert("Error", "Por favor ingresa tu nombre público");
            return;
        }
        if (!profession.trim()) {
            Alert.alert("Error", "Por favor ingresa tu profesión");
            return;
        }
        if (!category) {
            Alert.alert("Error", "Por favor selecciona una categoría");
            return;
        }

        setIsLoading(true);
        try {
            // Parsear nombre en firstname y lastname
            const nameParts = publicName.trim().split(" ");
            const firstname = nameParts[0] || "";
            const lastname = nameParts.slice(1).join(" ") || "";

            // Guardar datos profesionales
            if (token) {
                await userApi.updateUser(token, {
                    firstname,
                    lastname,
                    // Campos profesionales
                    publicName: publicName.trim(),
                    profession: profession.trim(),
                    category: category as any,
                    specialties: specialties,
                    bio: bio.trim() || undefined,
                });

                // Subir avatar si se seleccionó uno
                if (avatarUri) {
                    await userApi.updateAvatar(token, avatarUri);
                }

                if (refreshUser) {
                    await refreshUser();
                }
            }

            // Navegar al siguiente paso
            router.push("/onboarding/pro-contact");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar el perfil");
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
                        <Text style={styles.stepText}>Paso 1 de 2</Text>
                        <View style={styles.stepDots}>
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View style={styles.stepDot} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.helpButton}>
                        <Text style={styles.helpText}>Ayuda</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Perfil Profesional</Text>
                    <Text style={styles.headerSubtitle}>Completa tu ficha para conectar mejor.</Text>
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
                    {/* Avatar picker */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={40} color={COLORS.gray400} />
                                </View>
                            )}
                            <View style={styles.cameraButton}>
                                <MaterialIcons name="add-a-photo" size={16} color="#000000" />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.avatarHint}>
                            <Text style={styles.avatarHintText}>💡 Se recomienda foto real</Text>
                        </View>
                    </View>

                    {/* Nombre público */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nombre público</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Dr. Juan Pérez"
                                placeholderTextColor={COLORS.gray400}
                                value={publicName}
                                onChangeText={setPublicName}
                            />
                        </View>
                    </View>

                    {/* Profesión */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Profesión</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="work" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Abogado"
                                placeholderTextColor={COLORS.gray400}
                                value={profession}
                                onChangeText={setProfession}
                            />
                        </View>
                    </View>

                    {/* Categoría */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Categoría</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                        >
                            <MaterialIcons name="category" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                            <Text style={[styles.input, !category && styles.placeholder]}>
                                {category ? CATEGORIES.find(c => c.id === category)?.label : "Elegir..."}
                            </Text>
                            <MaterialIcons name="expand-more" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                        {showCategoryPicker && (
                            <View style={styles.categoryPicker}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoryOption, category === cat.id && styles.categoryOptionSelected]}
                                        onPress={() => {
                                            setCategory(cat.id);
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <Text style={[styles.categoryOptionText, category === cat.id && styles.categoryOptionTextSelected]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Especialidades */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Especialidades</Text>
                        <View style={styles.specialtiesCard}>
                            {specialties.length > 0 && (
                                <View style={styles.specialtiesTags}>
                                    {specialties.map((specialty, index) => (
                                        <View key={index} style={styles.specialtyTag}>
                                            <Text style={styles.specialtyTagText}>{specialty}</Text>
                                            <TouchableOpacity onPress={() => removeSpecialty(index)}>
                                                <MaterialIcons name="close" size={14} color={COLORS.primaryDark} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
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
                                    <MaterialIcons name="add" size={20} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Presentación/Bio */}
                    <View style={styles.inputGroup}>
                        <View style={styles.bioHeader}>
                            <Text style={styles.inputLabel}>Presentación</Text>
                            <Text style={styles.bioCounter}>{bio.length}/{bioMaxLength}</Text>
                        </View>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Describe tu experiencia y enfoque..."
                            placeholderTextColor={COLORS.gray400}
                            value={bio}
                            onChangeText={(text) => setBio(text.slice(0, bioMaxLength))}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
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
        marginTop: -32,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 16,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: COLORS.backgroundLight,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.backgroundLight,
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: COLORS.backgroundLight,
    },
    avatarHint: {
        marginTop: 8,
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    avatarHintText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    placeholder: {
        color: COLORS.gray400,
    },
    categoryPicker: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        marginTop: 4,
        overflow: "hidden",
    },
    categoryOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    categoryOptionSelected: {
        backgroundColor: "rgba(253, 224, 71, 0.1)",
    },
    categoryOptionText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    categoryOptionTextSelected: {
        color: COLORS.primaryDark,
        fontWeight: "600",
    },
    specialtiesCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
    },
    specialtiesContainer: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 8,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
    },
    specialtiesTags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 8,
    },
    specialtyTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(253, 224, 71, 0.15)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(253, 224, 71, 0.3)",
        gap: 6,
    },
    specialtyTagText: {
        fontSize: 12,
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
        backgroundColor: COLORS.gray200,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 12,
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
    bioHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    bioCounter: {
        fontSize: 9,
        fontWeight: "600",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bioInput: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textMain,
        minHeight: 80,
        lineHeight: 18,
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
