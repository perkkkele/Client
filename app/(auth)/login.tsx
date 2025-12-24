import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  gray500: "#6B7280",
  gray800: "#1F2937",
  border: "#E5E7EB",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al iniciar sesión");
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
                  <Ionicons name="people" size={20} color="#000000" />
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
              <Text style={styles.headerTitle}>Iniciar Sesión</Text>
              <Text style={styles.headerSubtitle}>
                Accede a tu cuenta para conectar.
              </Text>
            </View>
          </View>

          {/* Card de Formulario */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
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
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
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
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                ¿Olvidé mi contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón Iniciar Sesión */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000000" />
                </>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O continuar con</Text>
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

            {/* Crear cuenta */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes cuenta? </Text>
              <Link href="/onboarding/language" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Crear cuenta</Text>
                </TouchableOpacity>
              </Link>
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
    letterSpacing: 0.5,
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
});
