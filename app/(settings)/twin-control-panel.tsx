import { router } from "expo-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";

const COLORS = {
    primary: "#137fec",
    backgroundDark: "#111418",
    surfaceDark: "#1c2127",
    borderDark: "#3b4754",
    textSecondary: "#9dabb9",
    green500: "#22c55e",
    orange500: "#f97316",
    white: "#FFFFFF",
};

export default function TwinControlPanelScreen() {
    const { user, token, refreshUser } = useAuth();
    const { t } = useTranslation('settings');
    const [isActive, setIsActive] = useState(false);
    const [sessionLimitMinutes, setSessionLimitMinutes] = useState(0);
    const [sessionLimitInput, setSessionLimitInput] = useState("0");

    // Sync isActive and sessionLimitMinutes from user.digitalTwin
    useEffect(() => {
        if (user?.digitalTwin) {
            setIsActive(user.digitalTwin.isActive ?? false);
            const limit = user.digitalTwin.sessionLimitMinutes ?? 0;
            setSessionLimitMinutes(limit);
            setSessionLimitInput(limit.toString());
        }
    }, [user?.digitalTwin?.isActive, user?.digitalTwin?.sessionLimitMinutes]);

    // Handle toggle change with API persistence
    async function handleToggle(value: boolean) {
        setIsActive(value);
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                digitalTwin: {
                    isActive: value,
                },
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error toggling digital twin:", error);
        }
    }

    // Handle session limit change
    async function handleSessionLimitSave() {
        const value = parseInt(sessionLimitInput) || 0;
        if (value === sessionLimitMinutes) return; // No change

        setSessionLimitMinutes(value);
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                digitalTwin: {
                    sessionLimitMinutes: value,
                },
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error updating session limit:", error);
        }
    }

    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('twinControlPanel.headerTitle')}</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="help-outline" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Status Card */}
                    <View style={styles.statusCard}>
                        <View style={styles.statusContent}>
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusTitle}>{t('twinControlPanel.statusConfigured')}</Text>
                                <Text style={styles.statusDescription}>{t('twinControlPanel.statusSynced')}</Text>
                            </View>
                            <View style={styles.statusImage}>
                                <MaterialIcons name="smart-toy" size={48} color={COLORS.primary} />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.testTwinButton}
                            onPress={() => user?._id && router.push(`/avatar-chat/${user._id}`)}
                        >
                            <MaterialIcons name="chat-bubble" size={18} color={COLORS.white} />
                            <Text style={styles.testTwinButtonText}>{t('twinControlPanel.testTwin')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Master Toggle */}
                    <View style={styles.toggleCard}>
                        <View style={styles.toggleContent}>
                            <View>
                                <Text style={styles.toggleTitle}>{t('twinControlPanel.twinStatus')}</Text>
                                <View style={styles.toggleStatus}>
                                    <MaterialIcons
                                        name={isActive ? "wifi" : "wifi-off"}
                                        size={14}
                                        color={isActive ? COLORS.green500 : COLORS.textSecondary}
                                    />
                                    <Text style={[styles.toggleStatusText, isActive && { color: COLORS.green500 }]}>
                                        {isActive ? t('twinControlPanel.active') : t('twinControlPanel.inactive')}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={handleToggle}
                                trackColor={{ false: COLORS.borderDark, true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>

                    {/* Session Time Limit */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('twinControlPanel.sessionLimitTitle')}</Text>
                        <View style={styles.sessionLimitCard}>
                            <View style={styles.sessionLimitContent}>
                                <View style={styles.sessionLimitInfo}>
                                    <MaterialIcons name="timer" size={24} color={COLORS.primary} />
                                    <View style={styles.sessionLimitTextContainer}>
                                        <Text style={styles.sessionLimitTitle}>{t('twinControlPanel.maxAttention')}</Text>
                                        <Text style={styles.sessionLimitHint}>
                                            {t('twinControlPanel.maxAttentionHint')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.sessionLimitInputRow}>
                                    <TextInput
                                        style={styles.sessionLimitInput}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={sessionLimitInput}
                                        onChangeText={(text) => setSessionLimitInput(text.replace(/[^0-9]/g, ''))}
                                        onEndEditing={handleSessionLimitSave}
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                    <Text style={styles.sessionLimitLabel}>{t('twinControlPanel.minutes')}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Configuration Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('twinControlPanel.configSummary')}</Text>

                        <TouchableOpacity
                            style={styles.configItem}
                            onPress={() => router.push("/onboarding/twin-appearance")}
                        >
                            <View style={styles.configItemLeft}>
                                <View style={styles.configIcon}>
                                    <MaterialIcons name="settings" size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.configTitle}>{t('twinControlPanel.configTwin')}</Text>
                                    <Text style={styles.configSubtitle}>{t('twinControlPanel.configTwinSubtitle')}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
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
        backgroundColor: "rgba(17, 20, 24, 0.95)",
        borderBottomWidth: 1,
        borderBottomColor: "#283039",
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 20,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#283039",
        overflow: "hidden",
    },
    statusContent: {
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "space-between",
        padding: 16,
        gap: 16,
    },
    statusInfo: {
        flex: 1,
        gap: 8,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green500,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.green500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statusImage: {
        width: 96,
        height: 96,
        backgroundColor: "#283039",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        alignItems: "center",
        justifyContent: "center",
    },
    testTwinButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 10,
    },
    testTwinButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.white,
    },
    toggleCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 20,
    },
    toggleContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    toggleStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    toggleStatusText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
        paddingHorizontal: 4,
    },
    modeOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    modeOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(19, 127, 236, 0.1)",
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#546271",
        alignItems: "center",
        justifyContent: "center",
    },
    radioButtonSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.white,
    },
    modeContent: {
        flex: 1,
    },
    modeTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    modeDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    configItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    configItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    configIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#283039",
        alignItems: "center",
        justifyContent: "center",
    },
    configTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    configValue: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.green500,
        marginTop: 2,
    },
    configSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#283039",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        paddingVertical: 12,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.white,
    },
    // Session Limit Styles
    sessionLimitCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    sessionLimitContent: {
        gap: 16,
    },
    sessionLimitInfo: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    sessionLimitTextContainer: {
        flex: 1,
    },
    sessionLimitTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    sessionLimitHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    sessionLimitInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginLeft: 36,
    },
    sessionLimitInput: {
        width: 70,
        height: 44,
        backgroundColor: "#283039",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    sessionLimitLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
