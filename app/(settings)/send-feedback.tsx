import { router } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray800: "#1F2937",
};

export default function SendFeedbackScreen() {
    const { t } = useTranslation('settings');

    const FEEDBACK_TYPES = [
        { value: "sugerencia", label: t('sendFeedbackScreen.types.suggestion') },
        { value: "error", label: t('sendFeedbackScreen.types.error') },
        { value: "general", label: t('sendFeedbackScreen.types.general') },
        { value: "otro", label: t('sendFeedbackScreen.types.other') },
    ];

    const [feedbackType, setFeedbackType] = useState("sugerencia");
    const { showAlert } = useAlert();
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    function handleBack() {
        router.back();
    }

    async function handleSubmit() {
        if (!message.trim()) {
            showAlert({ type: 'error', title: t('common:error'), message: t('sendFeedbackScreen.emptyMessageError') });
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            showAlert({
                type: 'info',
                title: t('sendFeedbackScreen.successTitle'),
                message: t('sendFeedbackScreen.successMessage'),
                buttons: [{ text: "OK", onPress: () => router.back() }]
            });
        }, 1500);
    }

    const selectedTypeLabel = FEEDBACK_TYPES.find(t => t.value === feedbackType)?.label || "";

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('sendFeedbackScreen.headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.description}>
                        {t('sendFeedbackScreen.description')}
                    </Text>

                    {/* Feedback Type Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('sendFeedbackScreen.typeLabel')}</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowPicker(!showPicker)}
                        >
                            <Text style={styles.pickerText}>{selectedTypeLabel}</Text>
                            <MaterialIcons name="expand-more" size={24} color={COLORS.gray500} />
                        </TouchableOpacity>
                        {showPicker && (
                            <View style={styles.pickerContainer}>
                                {FEEDBACK_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.pickerOption,
                                            feedbackType === type.value && styles.pickerOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setFeedbackType(type.value);
                                            setShowPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerOptionText,
                                                feedbackType === type.value && styles.pickerOptionTextSelected,
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                        {feedbackType === type.value && (
                                            <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Message Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('sendFeedbackScreen.messageLabel')}</Text>
                        <TextInput
                            style={styles.textArea}
                            value={message}
                            onChangeText={setMessage}
                            placeholder={t('sendFeedbackScreen.messagePlaceholder')}
                            placeholderTextColor={COLORS.gray400}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>{t('sendFeedbackScreen.submitButton')}</Text>
                            <MaterialIcons name="send" size={20} color="#000000" />
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
        padding: 20,
        paddingBottom: 120,
        gap: 24,
    },
    description: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 22,
    },
    // Input Group
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        paddingHorizontal: 12,
    },
    // Picker
    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 16,
        padding: 16,
    },
    pickerText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    pickerContainer: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    pickerOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    pickerOptionSelected: {
        backgroundColor: COLORS.gray100,
    },
    pickerOptionText: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    pickerOptionTextSelected: {
        fontWeight: "600",
    },
    // Text Area
    textArea: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 16,
        padding: 20,
        fontSize: 16,
        color: COLORS.textMain,
        minHeight: 200,
        lineHeight: 24,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.backgroundLight,
        padding: 20,
        paddingBottom: 36,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
});
