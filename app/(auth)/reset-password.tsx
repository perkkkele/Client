import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../api/config";
import { useAlert } from "../../components/TwinProAlert";

const COLORS = {
    primary: "#FFED00",
    primaryDark: "#E6D500",
    backgroundLight: "#F5F5F7",
    backgroundDark: "#000000",
    cardLight: "#FFFFFF",
    textLight: "#1C1C1E",
    textDark: "#FFFFFF",
    subtextLight: "#8E8E93",
    gray400: "#9CA3AF",
    gray800: "#1F2937",
    border: "#E5E7EB",
    green500: "#22c55e",
    red500: "#EF4444",
};

export default function ResetPasswordScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { showAlert } = useAlert();

    async function handleResetPassword() {
        if (!code || code.length !== 6) {
            showAlert({ type: 'warning', title: 'Código incompleto', message: 'Introduce el código de 6 dígitos que recibiste por email.' });
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            showAlert({ type: 'warning', title: 'Contraseña demasiado corta', message: 'Tu nueva contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert({ type: 'warning', title: 'Las contraseñas no coinciden', message: 'Asegúrate de que ambas contraseñas sean iguales.' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    code,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                showAlert({ type: 'error', title: 'No se pudo restablecer', message: data.message || 'El código podría ser incorrecto o haber expirado. Solicita uno nuevo.' });
            }
        } catch (error) {
            console.error("Reset password error:", error);
            showAlert({ type: 'error', title: 'Sin conexión', message: 'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.' });
        } finally {
            setIsLoading(false);
        }
    }

    function handleGoToLogin() {
        router.replace("/(auth)/login");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nueva Contraseña</Text>
                <View style={styles.backButton} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {!isSuccess ? (
                        <>
                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <Ionicons name="key-outline" size={64} color={COLORS.primary} />
                            </View>

                            <Text style={styles.title}>Restablecer Contraseña</Text>
                            <Text style={styles.subtitle}>
                                Introduce el código que recibiste y tu nueva contraseña.
                            </Text>

                            {/* Code Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>CÓDIGO DE 6 DÍGITOS</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="keypad-outline"
                                        size={18}
                                        color={COLORS.gray400}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.codeInput]}
                                        placeholder="000000"
                                        placeholderTextColor={COLORS.gray400}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={code}
                                        onChangeText={setCode}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* New Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NUEVA CONTRASEÑA</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={18}
                                        color={COLORS.gray400}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor={COLORS.gray400}
                                        secureTextEntry={!showPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                                            size={18}
                                            color={COLORS.gray400}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>CONFIRMAR CONTRASEÑA</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={18}
                                        color={COLORS.gray400}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repetir contraseña"
                                        placeholderTextColor={COLORS.gray400}
                                        secureTextEntry={!showPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000000" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <View style={styles.iconContainer}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark" size={48} color={COLORS.green500} />
                                </View>
                            </View>

                            <Text style={styles.title}>¡Contraseña Actualizada!</Text>
                            <Text style={styles.subtitle}>
                                Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                            </Text>

                            {/* Go to Login Button */}
                            <TouchableOpacity style={styles.submitButton} onPress={handleGoToLogin}>
                                <Text style={styles.submitButtonText}>Ir a Iniciar Sesión</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: COLORS.textDark,
        fontSize: 17,
        fontWeight: "600",
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    contentContainer: {
        padding: 24,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#dcfce7",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textLight,
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subtextLight,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.subtextLight,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.cardLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: COLORS.textLight,
    },
    codeInput: {
        fontSize: 24,
        fontWeight: "600",
        letterSpacing: 8,
        textAlign: "center",
    },
    eyeButton: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
});
