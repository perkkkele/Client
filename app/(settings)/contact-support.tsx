import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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
    blue50: "#EFF6FF",
    blue600: "#2563EB",
    blue800: "#1E40AF",
    green50: "#F0FDF4",
    green100: "#DCFCE7",
    green500: "#22C55E",
    green600: "#16A34A",
    green700: "#15803D",
    green800: "#166534",
};

const SUPPORT_TOPICS = [
    "Problema Técnico",
    "Facturación y Pagos",
    "Reportar un Usuario",
    "Consulta General",
    "Otro",
];

export default function ContactSupportScreen() {
    const [selectedTopic, setSelectedTopic] = useState(SUPPORT_TOPICS[0]);
    const [showPicker, setShowPicker] = useState(false);

    function handleBack() {
        router.back();
    }

    function handleWriteSupport() {
        const subject = encodeURIComponent(`[${selectedTopic}] Consulta de soporte`);
        Linking.openURL(`mailto:soporte@twinpro.com?subject=${subject}`);
    }

    function handleLiveChat() {
        Alert.alert("Chat en Vivo", "El chat en vivo estará disponible próximamente.");
    }

    function handleCallSupport() {
        Linking.openURL("tel:+34900000000");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contactar Soporte</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIcon}>
                        <MaterialIcons name="support-agent" size={48} color={COLORS.gray400} />
                    </View>
                    <Text style={styles.heroTitle}>Estamos para ayudarte</Text>
                    <Text style={styles.heroSubtitle}>
                        Elige el motivo de tu consulta y nos pondremos en contacto contigo lo antes posible.
                    </Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Atención: Lun-Vie • 9:00 - 18:00</Text>
                    </View>
                </View>

                {/* Topic Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ASUNTO</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowPicker(!showPicker)}
                    >
                        <Text style={styles.pickerText}>{selectedTopic}</Text>
                        <MaterialIcons name="expand-more" size={24} color={COLORS.gray400} />
                    </TouchableOpacity>
                    {showPicker && (
                        <View style={styles.pickerContainer}>
                            {SUPPORT_TOPICS.map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    style={[
                                        styles.pickerOption,
                                        selectedTopic === topic && styles.pickerOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedTopic(topic);
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            selectedTopic === topic && styles.pickerOptionTextSelected,
                                        ]}
                                    >
                                        {topic}
                                    </Text>
                                    {selectedTopic === topic && (
                                        <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Write to Support Button */}
                <TouchableOpacity style={styles.primaryButton} onPress={handleWriteSupport}>
                    <MaterialIcons name="edit-square" size={20} color="#000000" />
                    <Text style={styles.primaryButtonText}>Escribir a Soporte</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>¿Necesitas ayuda inmediata?</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleLiveChat}>
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.blue50 }]}>
                            <MaterialIcons name="chat" size={24} color={COLORS.blue600} />
                        </View>
                        <Text style={styles.quickActionTitle}>Chat en Vivo</Text>
                        <Text style={styles.quickActionSubtitle}>Tiempo de espera: ~2 min</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleCallSupport}>
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="call" size={24} color={COLORS.green600} />
                        </View>
                        <Text style={styles.quickActionTitle}>Llamar a Soporte</Text>
                        <Text style={styles.quickActionSubtitle}>Hablar con un agente</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Note */}
                <View style={styles.infoNote}>
                    <MaterialIcons name="info" size={18} color={COLORS.gray400} />
                    <Text style={styles.infoNoteText}>
                        Para consultas sobre privacidad de datos, por favor revisa nuestra política de privacidad en los ajustes de tu perfil.
                    </Text>
                </View>
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 20,
    },
    // Hero
    heroSection: {
        alignItems: "center",
        paddingVertical: 16,
        gap: 8,
    },
    heroIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    heroSubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        maxWidth: 280,
        lineHeight: 20,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.green100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green500,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.green700,
    },
    // Section
    section: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        paddingHorizontal: 4,
    },
    // Picker
    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
    // Primary Button
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
    // Divider
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray200,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    // Quick Actions
    quickActions: {
        flexDirection: "row",
        gap: 16,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        padding: 20,
        alignItems: "flex-start",
        gap: 12,
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    quickActionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    quickActionSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    // Info Note
    infoNote: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
    },
});
