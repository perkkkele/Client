import { router } from "expo-router";
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
import { useTranslation } from 'react-i18next';

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
};

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { showAlert } = useAlert();
    const { t } = useTranslation('auth');

    async function handleRequestReset() {
        if (!email) {
            showAlert({ type: 'warning', title: t('forgotPassword.emailRequiredTitle'), message: t('forgotPassword.emailRequired') });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert({ type: 'warning', title: t('forgotPassword.invalidEmailTitle'), message: t('forgotPassword.invalidEmail') });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSent(true);
            } else {
                showAlert({ type: 'error', title: t('forgotPassword.sendFailedTitle'), message: data.message || t('forgotPassword.sendFailed') });
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            showAlert({ type: 'error', title: t('forgotPassword.noConnectionTitle'), message: t('forgotPassword.noConnection') });
        } finally {
            setIsLoading(false);
        }
    }

    function handleContinue() {
        router.push({
            pathname: "/(auth)/reset-password",
            params: { email: email.toLowerCase() },
        });
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('forgotPassword.headerTitle')}</Text>
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
                    {!isSent ? (
                        <>
                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <Ionicons name="mail-outline" size={64} color={COLORS.primary} />
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>{t('forgotPassword.title')}</Text>
                            <Text style={styles.subtitle}>
                                {t('forgotPassword.subtitle')}
                            </Text>

                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('forgotPassword.emailLabel')}</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={18}
                                        color={COLORS.gray400}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('forgotPassword.emailPlaceholder')}
                                        placeholderTextColor={COLORS.gray400}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={email}
                                        onChangeText={setEmail}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                                onPress={handleRequestReset}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000000" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{t('forgotPassword.sendCode')}</Text>
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

                            <Text style={styles.title}>{t('forgotPassword.codeSentTitle')}</Text>
                            <Text style={styles.subtitle}>
                                {t('forgotPassword.codeSentMessage', { email })}
                            </Text>

                            <Text style={styles.checkSpam}>
                                {t('forgotPassword.checkSpam')}
                            </Text>

                            {/* Continue Button */}
                            <TouchableOpacity style={styles.submitButton} onPress={handleContinue}>
                                <Text style={styles.submitButtonText}>{t('forgotPassword.enterCode')}</Text>
                            </TouchableOpacity>

                            {/* Resend */}
                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={() => setIsSent(false)}
                            >
                                <Text style={styles.resendText}>{t('forgotPassword.noCodeReceived')}</Text>
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
    emailHighlight: {
        fontWeight: "600",
        color: COLORS.textLight,
    },
    checkSpam: {
        fontSize: 13,
        color: COLORS.gray400,
        textAlign: "center",
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 24,
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
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    resendButton: {
        marginTop: 16,
        alignItems: "center",
    },
    resendText: {
        fontSize: 14,
        color: COLORS.subtextLight,
    },
});
