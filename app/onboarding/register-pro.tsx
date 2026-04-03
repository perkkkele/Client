import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
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
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';

// Native Google Sign-In
let GoogleSignin: any = null;
let isGoogleSignInAvailable = false;
try {
    const GoogleSignInModule = require("@react-native-google-signin/google-signin");
    GoogleSignin = GoogleSignInModule.GoogleSignin;
    isGoogleSignInAvailable = true;

    // Configure Google Sign-In
    GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
} catch (e) {
    console.log("Google Sign-In not available:", e);
}

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
    const { login, loginWithGoogle } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('onboarding');
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptAnalytics, setAcceptAnalytics] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const isNameValid = name.trim().length >= 2;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 6;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = isNameValid && isEmailValid && isPasswordValid && passwordsMatch && acceptedTerms;

    // Handle native Google Sign-In for professionals
    async function handleGoogleSignIn() {
        if (!isGoogleSignInAvailable || !GoogleSignin) {
            showAlert({ type: 'error', title: t('common:error'), message: t('registerPro.googleError') });
            return;
        }

        setIsGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error(t('registerPro.googleError'));
            }

            // Login/register with Google as 'userpro' (professional)
            await loginWithGoogle(idToken, 'userpro');

            // Navigate to professional profile setup
            router.push("/onboarding/pro-profile");
        } catch (error: any) {
            console.log("Google Sign-In error:", error);
            if (error.code !== "SIGN_IN_CANCELLED") {
                showAlert({ type: 'error', title: t('common:error'), message: error.message || t('registerPro.googleError') });
            }
        } finally {
            setIsGoogleLoading(false);
        }
    }

    async function handleRegister() {
        if (!canSubmit) {
            showAlert({ type: 'error', title: t('common:error'), message: t('registerPro.fieldsError') });
            return;
        }

        setIsLoading(true);
        try {
            // Primero registrar la cuenta como profesional (userpro) con preferencias de analítica
            await authApi.register(email, password, 'userpro', acceptAnalytics);

            // Luego iniciar sesión automáticamente para obtener el token
            await login(email, password);

            // Registro e inicio de sesión exitoso, continuar al perfil profesional
            router.push("/onboarding/pro-profile");
        } catch (error: any) {
            showAlert({ type: 'error', title: t('common:error'), message: error.message || t('registerPro.registerError') });
        } finally {
            setIsLoading(false);
        }
    }

    function handleLogin() {
        router.replace("/(auth)/login");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
                                    <MaterialIcons name="group" size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.logoTitle}>TwinPro</Text>
                                    <Text style={styles.logoSubtitle}>Professional Chat</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.helpButton}
                                onPress={() => router.push("/onboarding/help-register-user")}
                            >
                                <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>{t('registerPro.headerTitle')}</Text>
                            <Text style={styles.headerSubtitle}>
                                {t('registerPro.headerSubtitle')}
                            </Text>
                        </View>
                    </View>

                    {/* Card de Formulario */}
                    <View style={styles.formCard}>
                        {/* Nombre */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('registerPro.nameLabel')}</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="person"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('registerPro.namePlaceholder')}
                                    placeholderTextColor={COLORS.gray400}
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading}
                                />
                                {name.length > 0 && (
                                    <Ionicons
                                        name={isNameValid ? "checkmark-circle" : "close-circle"}
                                        size={18}
                                        color={isNameValid ? COLORS.success : "#EF4444"}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('registerPro.emailLabel')}</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="email"
                                    size={18}
                                    color={COLORS.gray400}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('registerPro.emailPlaceholder')}
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
                            <Text style={styles.inputLabel}>{t('registerPro.passwordLabel')}</Text>
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
                            <Text style={styles.inputLabel}>{t('registerPro.confirmPasswordLabel')}</Text>
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
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                onPress={() => setAcceptedTerms(!acceptedTerms)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                                    {acceptedTerms && (
                                        <Ionicons name="checkmark" size={14} color={COLORS.backgroundDark} />
                                    )}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.termsText}>
                                {t('registerPro.acceptTermsPrefix')}
                                <Text
                                    style={styles.termsLink}
                                    onPress={() => router.push("/legal/terms-of-service")}
                                >
                                    {t('registerPro.termsOfService')}
                                </Text>
                                {t('registerPro.acceptTermsMiddle')}
                                <Text
                                    style={styles.termsLink}
                                    onPress={() => router.push("/legal/privacy-policy")}
                                >
                                    {t('registerPro.privacyPolicy')}
                                </Text>.
                            </Text>
                        </View>

                        {/* Analytics consent checkbox (optional) */}
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                onPress={() => setAcceptAnalytics(!acceptAnalytics)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, acceptAnalytics && styles.checkboxChecked]}>
                                    {acceptAnalytics && (
                                        <Ionicons name="checkmark" size={14} color={COLORS.backgroundDark} />
                                    )}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.termsText}>
                                {t('registerPro.acceptAnalytics')}
                            </Text>
                        </View>

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
                                    <Text style={styles.registerButtonText}>{t('registerPro.createAccount')}</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#000000" />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Separador */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>{t('registerPro.orContinueWith')}</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Botones sociales */}
                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.socialButtonFull, (isGoogleLoading || !isGoogleSignInAvailable) && styles.buttonDisabled]}
                                onPress={handleGoogleSignIn}
                                disabled={isGoogleLoading || !isGoogleSignInAvailable}
                            >
                                {isGoogleLoading ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <>
                                        <Image
                                            source={{
                                                uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                                            }}
                                            style={styles.socialIcon}
                                        />
                                        <Text style={styles.socialButtonText}>{t('registerPro.orContinueWith')} Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Login link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>{t('registerPro.hasAccount')}</Text>
                            <TouchableOpacity onPress={handleLogin}>
                                <Text style={styles.loginLink}>{t('registerPro.loginLink')}</Text>
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
        gap: 12,
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        backgroundColor: COLORS.backgroundDark,
        borderWidth: 3,
        borderColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    logoTitle: {
        color: COLORS.textDark,
        fontSize: 20,
        fontWeight: "bold",
    },
    logoSubtitle: {
        color: COLORS.gray400,
        fontSize: 11,
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
    socialButtonFull: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
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
