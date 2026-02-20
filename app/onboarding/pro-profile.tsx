import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    ActivityIndicator,    KeyboardAvoidingView,
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
import { useAuth } from "../../context";
import { userApi, STATIC_URL } from "../../api";
import { normalizeProfession } from "../../constants/professionNormalizer";
import { useAlert } from "../../components/TwinProAlert";

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
    green500: "#22c55e",
    green600: "#16a34a",
    red500: "#ef4444",
    red600: "#dc2626",
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

// Alias validation rules
const ALIAS_MIN_LENGTH = 3;
const ALIAS_MAX_LENGTH = 20;
const ALIAS_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

type AliasStatus = "idle" | "checking" | "valid" | "invalid" | "taken";

export default function ProProfileScreen() {
    const { token, refreshUser } = useAuth();

  const { showAlert } = useAlert();
    // Alias state
    const [alias, setAlias] = useState("");
    const [aliasStatus, setAliasStatus] = useState<AliasStatus>("idle");
    const [aliasError, setAliasError] = useState<string>("");

    const [publicName, setPublicName] = useState("");
    const [profession, setProfession] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [businessType, setBusinessType] = useState<string>("");
    const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false);
    const [category, setCategory] = useState("");
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [newSpecialty, setNewSpecialty] = useState("");
    const [bio, setBio] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const bioMaxLength = 250;

    // Validate alias format
    const validateAliasFormat = (value: string): { valid: boolean; error: string } => {
        if (!value) {
            return { valid: false, error: "" };
        }
        if (value.length < ALIAS_MIN_LENGTH) {
            return { valid: false, error: `Mínimo ${ALIAS_MIN_LENGTH} caracteres` };
        }
        if (value.length > ALIAS_MAX_LENGTH) {
            return { valid: false, error: `Máximo ${ALIAS_MAX_LENGTH} caracteres` };
        }
        if (!ALIAS_REGEX.test(value)) {
            if (/^[0-9]/.test(value)) {
                return { valid: false, error: "Debe comenzar con una letra" };
            }
            if (/[^a-zA-Z0-9_]/.test(value)) {
                return { valid: false, error: "Solo letras, números y guiones bajos" };
            }
            return { valid: false, error: "Formato inválido" };
        }
        return { valid: true, error: "" };
    };

    // Check alias availability
    const checkAliasAvailability = useCallback(async (aliasToCheck: string) => {
        if (!aliasToCheck || aliasToCheck.length < ALIAS_MIN_LENGTH) {
            return;
        }

        const formatValidation = validateAliasFormat(aliasToCheck);
        if (!formatValidation.valid) {
            setAliasStatus("invalid");
            setAliasError(formatValidation.error);
            return;
        }

        setAliasStatus("checking");
        setAliasError("");

        try {
            const response = await fetch(
                `${STATIC_URL}/api/users/check-username/${aliasToCheck.toLowerCase()}`
            );
            const data = await response.json();

            if (data.available) {
                setAliasStatus("valid");
                setAliasError("");
            } else {
                setAliasStatus("taken");
                setAliasError("Este alias ya está en uso");
            }
        } catch (error) {
            setAliasStatus("invalid");
            setAliasError("Error al verificar disponibilidad");
        }
    }, []);

    // Debounced alias check
    useEffect(() => {
        const formatValidation = validateAliasFormat(alias);
        if (!formatValidation.valid) {
            if (alias.length > 0) {
                setAliasStatus("invalid");
                setAliasError(formatValidation.error);
            } else {
                setAliasStatus("idle");
                setAliasError("");
            }
            return;
        }

        const timer = setTimeout(() => {
            checkAliasAvailability(alias);
        }, 500);

        return () => clearTimeout(timer);
    }, [alias, checkAliasAvailability]);

    function handleBack() {
        router.back();
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
        if (!alias.trim()) {
            showAlert({ type: 'error', title: 'Error', message: 'Por favor ingresa un alias para tu perfil' });
            return;
        }
        if (aliasStatus !== "valid") {
            showAlert({ type: 'error', title: 'Error', message: 'El alias no es válido o ya está en uso' });
            return;
        }
        if (!publicName.trim()) {
            showAlert({ type: 'error', title: 'Error', message: 'Por favor ingresa tu nombre público' });
            return;
        }
        if (!profession.trim()) {
            showAlert({ type: 'error', title: 'Error', message: 'Por favor ingresa tu profesión' });
            return;
        }
        if (!category) {
            showAlert({ type: 'error', title: 'Error', message: 'Por favor selecciona una categoría' });
            return;
        }

        setIsLoading(true);
        try {
            const nameParts = publicName.trim().split(" ");
            const firstname = nameParts[0] || "";
            const lastname = nameParts.slice(1).join(" ") || "";

            if (token) {
                await userApi.updateUser(token, {
                    firstname,
                    lastname,
                    username: alias.toLowerCase(),
                    publicName: publicName.trim(),
                    profession: profession.trim(),
                    businessName: businessName.trim() || undefined,
                    businessType: (businessType || undefined) as 'Autónomo' | 'Empresa' | 'Clínica/Centro' | undefined,
                    category: category as any,
                    specialties: specialties,
                    bio: bio.trim() || undefined,
                });

                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/pro-contact");
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message || "Error al guardar el perfil" });
        } finally {
            setIsLoading(false);
        }
    }

    const getAliasIcon = () => {
        switch (aliasStatus) {
            case "checking":
                return <ActivityIndicator size="small" color={COLORS.gray400} />;
            case "valid":
                return <MaterialIcons name="check-circle" size={20} color={COLORS.green500} />;
            case "invalid":
            case "taken":
                return <MaterialIcons name="error" size={20} color={COLORS.red500} />;
            default:
                return null;
        }
    };

    const getAliasInputStyle = () => {
        if (aliasStatus === "valid") return styles.inputValid;
        if (aliasStatus === "invalid" || aliasStatus === "taken") return styles.inputError;
        return {};
    };

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            {/* Header negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {/* Spacer izquierdo para centrar */}
                    <View style={styles.headerSpacer} />
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepText}>Paso 1 de 2</Text>
                        <View style={styles.stepDots}>
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View style={styles.stepDot} />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => router.push("/onboarding/help-pro-profile")}
                    >
                        <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
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
                    {/* Alias - Campo principal */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Alias</Text>
                        <View style={[styles.inputContainer, getAliasInputStyle()]}>
                            <Text style={styles.aliasPrefix}>@</Text>
                            <TextInput
                                style={styles.aliasInput}
                                placeholder="Ej. DrJuanPerez"
                                placeholderTextColor={COLORS.gray400}
                                value={alias}
                                onChangeText={setAlias}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={ALIAS_MAX_LENGTH}
                            />
                            <View style={styles.aliasStatusIcon}>
                                {getAliasIcon()}
                            </View>
                        </View>
                        <Text style={styles.aliasHelpText}>
                            Tu alias será tu identidad única y permanente en TwinPro. Se usará en tu URL: twinpro.app/@{alias || "alias"}
                        </Text>

                        {/* Reglas del alias */}
                        <View style={styles.aliasRules}>
                            <View style={styles.aliasRule}>
                                <MaterialIcons
                                    name={alias.length >= ALIAS_MIN_LENGTH ? "check-circle" : "radio-button-unchecked"}
                                    size={14}
                                    color={alias.length >= ALIAS_MIN_LENGTH ? COLORS.green500 : COLORS.gray400}
                                />
                                <Text style={[styles.aliasRuleText, alias.length >= ALIAS_MIN_LENGTH && styles.aliasRuleValid]}>
                                    Mínimo {ALIAS_MIN_LENGTH} caracteres
                                </Text>
                            </View>
                            <View style={styles.aliasRule}>
                                <MaterialIcons
                                    name={!alias ? "radio-button-unchecked" : (/^[a-zA-Z]/.test(alias) ? "check-circle" : "error")}
                                    size={14}
                                    color={!alias ? COLORS.gray400 : (/^[a-zA-Z]/.test(alias) ? COLORS.green500 : COLORS.red500)}
                                />
                                <Text style={[styles.aliasRuleText, /^[a-zA-Z]/.test(alias) && styles.aliasRuleValid]}>
                                    Comenzar con una letra
                                </Text>
                            </View>
                            <View style={styles.aliasRule}>
                                <MaterialIcons
                                    name={!alias ? "radio-button-unchecked" : (ALIAS_REGEX.test(alias) ? "check-circle" : "error")}
                                    size={14}
                                    color={!alias ? COLORS.gray400 : (ALIAS_REGEX.test(alias) ? COLORS.green500 : COLORS.red500)}
                                />
                                <Text style={[styles.aliasRuleText, ALIAS_REGEX.test(alias) && styles.aliasRuleValid]}>
                                    Solo letras, números y guiones bajos (_)
                                </Text>
                            </View>
                        </View>

                        {aliasError ? (
                            <View style={styles.aliasErrorContainer}>
                                <MaterialIcons name="info" size={14} color={COLORS.red500} />
                                <Text style={styles.aliasErrorText}>{aliasError}</Text>
                            </View>
                        ) : null}


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
                                onBlur={() => {
                                    if (profession.trim()) {
                                        setProfession(normalizeProfession(profession));
                                    }
                                }}
                            />
                        </View>
                    </View>

                    {/* Empresa / Marca profesional (Opcional) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.inputLabel}>Empresa / Marca profesional</Text>
                            <Text style={styles.optionalLabel}>Opcional</Text>
                        </View>
                        <View style={styles.businessRow}>
                            <View style={[styles.inputContainer, styles.businessNameInput]}>
                                <MaterialIcons name="business" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nombre de empresa..."
                                    placeholderTextColor={COLORS.gray400}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.businessTypeButton}
                                onPress={() => setShowBusinessTypePicker(!showBusinessTypePicker)}
                            >
                                <Text style={[styles.businessTypeText, !businessType && styles.placeholder]}>
                                    {businessType || "Tipo"}
                                </Text>
                                <MaterialIcons name="expand-more" size={18} color={COLORS.gray400} />
                            </TouchableOpacity>
                        </View>
                        {showBusinessTypePicker && (
                            <View style={styles.businessTypePicker}>
                                {["Autónomo", "Empresa", "Clínica/Centro"].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.categoryOption, businessType === type && styles.categoryOptionSelected]}
                                        onPress={() => {
                                            setBusinessType(type);
                                            setShowBusinessTypePicker(false);
                                        }}
                                    >
                                        <Text style={[styles.categoryOptionText, businessType === type && styles.categoryOptionTextSelected]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
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
                    style={[styles.continueButton, (aliasStatus !== "valid" || isLoading) && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={isLoading || aliasStatus !== "valid"}
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
        zIndex: 1,
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
    headerSpacer: {
        width: 36,
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
        paddingTop: 48,
        paddingBottom: 100,
    },
    inputGroup: {
        marginBottom: 16,
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
        height: 48,
        borderWidth: 2,
        borderColor: "transparent",
    },
    inputValid: {
        borderColor: COLORS.green500,
    },
    inputError: {
        borderColor: COLORS.red500,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    placeholder: {
        color: COLORS.gray400,
    },
    // Alias specific styles
    aliasPrefix: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.gray500,
        marginRight: 2,
    },
    aliasInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    aliasStatusIcon: {
        width: 24,
        alignItems: "center",
    },
    aliasHelpText: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 8,
        marginLeft: 4,
        lineHeight: 16,
    },
    aliasRules: {
        marginTop: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 10,
        padding: 12,
        gap: 8,
    },
    aliasRule: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    aliasRuleText: {
        fontSize: 11,
        color: COLORS.gray500,
    },
    aliasRuleValid: {
        color: COLORS.green600,
    },
    aliasErrorContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        marginLeft: 4,
    },
    aliasErrorText: {
        fontSize: 11,
        color: COLORS.red500,
        fontWeight: "500",
    },
    aliasWarning: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 10,
        backgroundColor: COLORS.gray200,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    aliasWarningText: {
        fontSize: 11,
        color: COLORS.gray500,
        fontWeight: "500",
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
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000000",
    },
    // Business field styles
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    optionalLabel: {
        fontSize: 9,
        fontWeight: "500",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    businessRow: {
        flexDirection: "row",
        gap: 8,
    },
    businessNameInput: {
        flex: 1,
    },
    businessTypeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        minWidth: 110,
        gap: 4,
    },
    businessTypeText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    businessTypePicker: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        marginTop: 4,
        overflow: "hidden",
    },
});
