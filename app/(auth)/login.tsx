import { Link, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useAuth } from "../../context";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, type SupportedLanguage } from '../../services/i18n';

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
  gray500: "#6B7280",
  gray800: "#1F2937",
  border: "#E5E7EB",
};

const LANGUAGES: { id: SupportedLanguage; name: string; flag: string }[] = [
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation('auth');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getCurrentLanguage());

  const currentFlag = LANGUAGES.find(l => l.id === currentLang)?.flag || '🇪🇸';

  async function handleChangeLanguage(lang: SupportedLanguage) {
    setCurrentLang(lang);
    await changeLanguage(lang);
    setShowLanguagePicker(false);
  }

  // Handle native Google Sign-In
  async function handleGoogleSignIn() {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      showAlert({ type: 'error', title: t('common:error'), message: t('login.googleNotAvailable') });
      return;
    }

    setIsGoogleLoading(true);
    try {
      // Check if user is already signed in
      await GoogleSignin.hasPlayServices();

      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error(t('login.googleTokenError'));
      }

      // Send to our backend
      await loginWithGoogle(idToken);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Google Sign-In error:", error);
      // Check if account is suspended
      if (error.code === "ACCOUNT_SUSPENDED") {
        router.replace({
          pathname: "/(auth)/account-suspended",
          params: { reason: error.reason || "" }
        });
      } else if (error.code !== "SIGN_IN_CANCELLED") {
        showAlert({ type: 'error', title: t('common:error'), message: error.message || t('login.googleLoginError') });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      showAlert({ type: 'warning', title: t('login.fieldsRequiredTitle'), message: t('login.fieldsRequired') });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      // Check if account is suspended
      if (error.code === "ACCOUNT_SUSPENDED") {
        router.replace({
          pathname: "/(auth)/account-suspended",
          params: { reason: error.reason || "" }
        });
      } else {
        showAlert({ type: 'error', title: t('common:error'), message: error.message || t('login.loginError') });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
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
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.langButton}
                  onPress={() => setShowLanguagePicker(true)}
                  testID="login-language-button"
                >
                  <Text style={styles.langButtonFlag}>{currentFlag}</Text>
                  <Ionicons name="chevron-down" size={12} color={COLORS.gray400} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.helpButton} onPress={() => router.push("/(auth)/help")}>
                  <Ionicons name="help-circle-outline" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t('login.title')}</Text>
              <Text style={styles.headerSubtitle}>
                {t('login.subtitle')}
              </Text>
            </View>
          </View>

          {/* Card de Formulario */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('login.emailLabel')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.gray400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={COLORS.gray400}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  testID="login-email-input"
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('login.passwordLabel')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
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
                  testID="login-password-input"
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

            {/* Olvidé contraseña */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>
                {t('login.forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* Botón Iniciar Sesión */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>{t('login.loginButton')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000000" />
                </>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('login.divider')}</Text>
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
                    <Text style={styles.socialButtonText}>{t('login.googleButton')}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* TODO: Implementar Apple Sign-In post-MVP
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={16} color="#000000" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
              */}
            </View>

            {/* Crear cuenta */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{t('login.noAccount')} </Text>
              <Link href="/onboarding/language" asChild>
                <TouchableOpacity testID="login-create-account-link">
                  <Text style={styles.registerLink}>{t('login.createAccount')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('login.selectLanguage', '🌐 Idioma')}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.langOption,
                  currentLang === lang.id && styles.langOptionSelected,
                ]}
                onPress={() => handleChangeLanguage(lang.id)}
              >
                <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.langOptionName,
                  currentLang === lang.id && styles.langOptionNameSelected,
                ]}>{lang.name}</Text>
                {currentLang === lang.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray800,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langButtonFlag: {
    fontSize: 18,
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
    fontSize: 26,
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
    marginTop: -32,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.subtextLight,
    letterSpacing: 0.8,
    marginBottom: 8,
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
    height: 48,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textLight,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
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
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
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
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  registerText: {
    fontSize: 12,
    color: COLORS.subtextLight,
  },
  registerLink: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textLight,
  },
  // Language Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalContent: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 16,
    textAlign: "center",
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  langOptionSelected: {
    backgroundColor: "#DCFCE7",
  },
  langOptionFlag: {
    fontSize: 24,
  },
  langOptionName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textLight,
    flex: 1,
  },
  langOptionNameSelected: {
    fontWeight: "700",
    color: "#16A34A",
  },
});
