import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { authApi } from "../../api";
import { useAlert } from "../../components/TwinProAlert";

const COLORS = {
    primary: "#f9f506",
    primaryDark: "#e6e205",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    textMuted: "#6B7280",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    green100: "#D1FAE5",
    green600: "#059669",
    red100: "#FEE2E2",
    red600: "#DC2626",
};

export default function ChangePasswordScreen() {
    const { token } = useAuth();
  const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    function handleBack() {
        router.back();
    }

    // Password validation
    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

    const isValid =
        currentPassword.length > 0 &&
        hasMinLength &&
        hasUpperCase &&
        hasNumber &&
        hasSpecialChar &&
        passwordsMatch;

    async function handleChangePassword() {
        if (!isValid) {
            showAlert({ type: 'error', title: 'Error', message: 'Por favor, completa todos los requisitos' });
            return;
        }

        if (!token) {
            showAlert({ type: 'error', title: 'Error', message: 'No hay sesión activa' });
            return;
        }

        setIsLoading(true);
        try {
            await authApi.changePassword(token, currentPassword, newPassword);
            showAlert({
    type: 'success',
    title: 'Éxito',
    message: 'Tu contraseña ha sido actualizada correctamente',
    buttons: [{ text: "OK", onPress: () => router.back() }]
});
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message || "No se pudo cambiar la contraseña" });
        } finally {
            setIsLoading(false);
        }
    }

    function renderRequirement(met: boolean, text: string) {
        return (
            <View style={styles.requirement}>
                <MaterialIcons
                    name={met ? "check-circle" : "radio-button-unchecked"}
                    size={16}
                    color={met ? COLORS.green600 : COLORS.gray400}
                />
                <Text style={[styles.requirementText, met && styles.requirementMet]}>
                    {text}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Info */}
                    <View style={styles.infoCard}>
                        <MaterialIcons name="info" size={20} color={COLORS.gray600} />
                        <Text style={styles.infoText}>
                            Por seguridad, necesitas tu contraseña actual para hacer cambios.
                        </Text>
                    </View>

                    {/* Current Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>CONTRASEÑA ACTUAL</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Tu contraseña actual"
                                placeholderTextColor={COLORS.gray400}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={COLORS.gray400}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>NUEVA CONTRASEÑA</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock-outline" size={20} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nueva contraseña"
                                placeholderTextColor={COLORS.gray400}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={COLORS.gray400}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Requirements */}
                        <View style={styles.requirements}>
                            {renderRequirement(hasMinLength, "Mínimo 8 caracteres")}
                            {renderRequirement(hasUpperCase, "Una letra mayúscula")}
                            {renderRequirement(hasNumber, "Un número")}
                            {renderRequirement(hasSpecialChar, "Un carácter especial")}
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>CONFIRMAR CONTRASEÑA</Text>
                        <View style={[
                            styles.inputContainer,
                            confirmPassword.length > 0 && (passwordsMatch ? styles.inputSuccess : styles.inputError)
                        ]}>
                            <MaterialIcons name="lock-outline" size={20} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Repite la nueva contraseña"
                                placeholderTextColor={COLORS.gray400}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={COLORS.gray400}
                                />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        (!isValid || isLoading) && styles.saveButtonDisabled
                    ]}
                    onPress={handleChangePassword}
                    disabled={!isValid || isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                            <MaterialIcons name="check" size={20} color="#000000" />
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
        backgroundColor: COLORS.backgroundLight,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
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
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingBottom: 120,
    },
    // Info Card
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray600,
        lineHeight: 18,
    },
    // Form
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputSuccess: {
        borderColor: COLORS.green600,
        backgroundColor: COLORS.green100 + "30",
    },
    inputError: {
        borderColor: COLORS.red600,
        backgroundColor: COLORS.red100 + "30",
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textMain,
    },
    eyeButton: {
        padding: 4,
    },
    // Requirements
    requirements: {
        marginTop: 12,
        gap: 6,
    },
    requirement: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    requirementText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    requirementMet: {
        color: COLORS.green600,
    },
    // Error text
    errorText: {
        fontSize: 12,
        color: COLORS.red600,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        padding: 20,
        paddingBottom: 36,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#000000",
    },
});
