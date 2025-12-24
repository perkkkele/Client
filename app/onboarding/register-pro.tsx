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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { authApi } from "../../api";
import { useAuth } from "../../context";

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
    success: "#22C55E",
    blue600: "#2563EB",
};

export default function RegisterProScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isUsernameValid = username.length >= 3 && username.length <= 15 && !/\s/.test(username);
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 6;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = isUsernameValid && isEmailValid && isPasswordValid && passwordsMatch && acceptedTerms;

    async function handleRegister() {
        if (!canSubmit) {
            Alert.alert("Error", "Por favor completa todos los campos correctamente");
            return;
        }

        setIsLoading(true);
        try {
            // Primero registrar la cuenta como profesional (userpro)
            await authApi.register(email, password, 'userpro');

            // Luego iniciar sesión automáticamente para obtener el token
            await login(email, password);

            // Registro e inicio de sesión exitoso, continuar al perfil profesional
            router.push("/onboarding/pro-profile");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al crear la cuenta");
        } finally {
            setIsLoading(false);
        }
    }

    function handleLogin() {
        router.replace("/(auth)/login");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Negro */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoIcon}>
                                    <MaterialIcons name="people" size={20} color={COLORS.backgroundDark} />
                                </View>
                                <View>
                                    <Text style={styles.logoTitle}>TwinPro</Text>
                                    <Text style={styles.logoSubtitle}>Professional Chat</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.helpButton}>
                                <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Crear Cuenta</Text>
                            <Text style={styles.headerSubtitle}>
                                Regístrate para conectar con expertos.
                            </Text>
                        </View>
                    </View>

                    {/* Card de Formulario */}
                    <View style={styles.formCard}>
                        {/* Username */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>NOMBRE DE USUARIO</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="person"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="JavierLópez"
                                    placeholderTextColor={COLORS.gray400}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                {username.length > 0 && (
                                    <Ionicons
                                        name={isUsernameValid ? "checkmark-circle" : "close-circle"}
                                        size={18}
                                        color={isUsernameValid ? COLORS.success : "#EF4444"}
                                    />
                                )}
                            </View>
                            <Text style={styles.inputHint}>
                                3-15 caracteres, sin espacios ni símbolos.
                            </Text>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="email"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="nombre@ejemplo.com"
                                    placeholderTextColor={COLORS.gray400}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                {email.length > 0 && (
                                    <Ionicons
                                        name={isEmailValid ? "checkmark-circle" : "close-circle"}
                                        size={18}
                                        color={isEmailValid ? COLORS.success : "#EF4444"}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="lock"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.gray400}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
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
                                <MaterialIcons
                                    name="lock-reset"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.gray400}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={18}
                                        color={COLORS.gray400}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Terms checkbox */}
                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                                {acceptedTerms && (
                                    <Ionicons name="checkmark" size={14} color={COLORS.backgroundDark} />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                Acepto los{" "}
                                <Text style={styles.termsLink}>Términos de Servicio</Text> y la{" "}
                                <Text style={styles.termsLink}>Política de Privacidad</Text>.
                            </Text>
                        </TouchableOpacity>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, (!canSubmit || isLoading) && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={!canSubmit || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000000" />
                            ) : (
                                <>
                                    <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#000000" />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Separador */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>O continúa con</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Botones sociales */}
                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Image
                                    source={{
                                        uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                                    }}
                                    style={styles.socialIcon}
                                />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={16} color="#000000" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                            <TouchableOpacity onPress={handleLogin}>
                                <Text style={styles.loginLink}>Inicia sesión</Text>
                            </TouchableOpacity>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    // Header
    header: {
        backgroundColor: COLORS.backgroundDark,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    logoIcon: {
        width: 36,
        height: 36,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    logoTitle: {
        color: COLORS.textDark,
        fontSize: 18,
        fontWeight: "700",
    },
    logoSubtitle: {
        color: COLORS.gray400,
        fontSize: 10,
        fontWeight: "500",
    },
    helpButton: {
        width: 36,
        height: 36,
        backgroundColor: COLORS.gray800,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    headerContent: {
        marginTop: 8,
    },
    headerTitle: {
        color: COLORS.textDark,
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 4,
    },
    headerSubtitle: {
        color: COLORS.gray400,
        fontSize: 12,
    },
    // Form Card
    formCard: {
        backgroundColor: COLORS.cardLight,
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.subtextLight,
        letterSpacing: 0.8,
        marginBottom: 6,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textLight,
    },
    inputHint: {
        fontSize: 10,
        color: COLORS.subtextLight,
        marginTop: 4,
        marginLeft: 4,
    },
    eyeButton: {
        padding: 4,
    },
    termsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 12,
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.gray400,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 11,
        color: COLORS.subtextLight,
        lineHeight: 16,
    },
    termsLink: {
        color: COLORS.blue600,
    },
    registerButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    registerButtonText: {
        color: "#000000",
        fontSize: 15,
        fontWeight: "700",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.subtextLight,
    },
    socialButtonsContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.cardLight,
    },
    socialIcon: {
        width: 16,
        height: 16,
    },
    socialButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 4,
    },
    loginText: {
        fontSize: 12,
        color: COLORS.subtextLight,
    },
    loginLink: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textLight,
    },
});
