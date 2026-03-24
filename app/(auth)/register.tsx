import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation('auth');

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      showAlert({ type: 'warning', title: t('register.fieldsRequiredTitle'), message: t('register.fieldsRequired') });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({ type: 'warning', title: t('register.passwordMismatchTitle'), message: t('register.passwordMismatch') });
      return;
    }

    if (password.length < 6) {
      showAlert({ type: 'warning', title: t('register.passwordTooShortTitle'), message: t('register.passwordTooShort') });
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      showAlert({ type: 'error', title: t('register.registerErrorTitle'), message: error.message || t('register.registerError') });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('register.title')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('register.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        testID="register-email-input"
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.passwordPlaceholder')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        testID="register-password-input"
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.confirmPasswordPlaceholder')}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!isLoading}
        testID="register-confirm-password-input"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
        testID="register-submit-button"
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{t('register.registerButton')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>{t('register.hasAccount')} </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.loginLink}>{t('register.loginLink')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#4f46e5",
    fontWeight: "bold",
  },
});
