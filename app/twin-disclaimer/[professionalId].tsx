import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import { User } from "../../api/user";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#2c2c24",
    textMain: "#181811",
    textMuted: "#64748B",
    gray50: "#F9FAFB",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    white: "#FFFFFF",
    amber50: "#FFFBEB",
    amber100: "#FEF3C7",
    amber500: "#F59E0B",
    amber600: "#D97706",
    blue50: "#eff6ff",
    blue500: "#3B82F6",
};

// Default disclaimer when professional hasn't set one
const DEFAULT_DISCLAIMER = `Las respuestas proporcionadas por este asistente virtual tienen carácter informativo y orientativo. No sustituyen el consejo profesional especializado. La información puede requerir actualización o adaptación a su situación específica. Consulte siempre con profesionales cualificados para tomar decisiones importantes.`;

export default function TwinDisclaimerScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfessional();
    }, [professionalId, token]);

    const loadProfessional = async () => {
        if (!token || !professionalId) return;

        setLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setLoading(false);
        }
    };

    const disclaimerText = professional?.digitalTwin?.disclaimer || DEFAULT_DISCLAIMER;
    const professionalName = professional?.publicName
        || (professional?.firstname && professional?.lastname
            ? `${professional.firstname} ${professional.lastname}`
            : professional?.firstname)
        || "el profesional";

    const getCategoryIcon = (category?: string | null) => {
        const icons: Record<string, string> = {
            legal: "gavel",
            salud: "local-hospital",
            fitness: "fitness-center",
            educacion: "school",
            tecnologia: "computer",
            diseno: "palette",
            bienestar: "self-improvement",
            inmobiliario: "home-work",
            estetica: "spa",
            hogar: "handyman",
            finanzas: "account-balance",
            energia: "bolt",
            empleo: "work",
            otros: "info",
        };
        return icons[category || "otros"] || "info";
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alcance y Límites</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.amber500} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Alcance y Límites</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Professional Info Card */}
                <View style={styles.professionalCard}>
                    <View style={styles.professionalIconWrapper}>
                        <MaterialIcons
                            name={getCategoryIcon(professional?.category) as any}
                            size={28}
                            color={COLORS.amber600}
                        />
                    </View>
                    <View style={styles.professionalInfo}>
                        <Text style={styles.professionalName}>{professionalName}</Text>
                        <Text style={styles.professionalProfession}>
                            {professional?.profession || "Profesional"}
                        </Text>
                    </View>
                </View>

                {/* Disclaimer Title */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="verified-user" size={20} color={COLORS.amber500} />
                    <Text style={styles.sectionTitle}>Descargo de Responsabilidad</Text>
                </View>

                {/* Disclaimer Content */}
                <View style={styles.disclaimerCard}>
                    <Text style={styles.disclaimerText}>{disclaimerText}</Text>
                </View>

                {/* Info Note */}
                <View style={styles.infoNote}>
                    <MaterialIcons name="info-outline" size={18} color={COLORS.blue500} />
                    <Text style={styles.infoNoteText}>
                        Este texto ha sido proporcionado por {professionalName} para establecer
                        las condiciones y límites del servicio de su gemelo digital.
                    </Text>
                </View>

                {/* What this means */}
                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>¿Qué significa esto?</Text>
                    <View style={styles.helpItem}>
                        <MaterialIcons name="smart-toy" size={16} color={COLORS.gray400} />
                        <Text style={styles.helpText}>
                            Estás interactuando con un asistente virtual basado en IA
                        </Text>
                    </View>
                    <View style={styles.helpItem}>
                        <MaterialIcons name="psychology" size={16} color={COLORS.gray400} />
                        <Text style={styles.helpText}>
                            Las respuestas son orientativas y no sustituyen al profesional
                        </Text>
                    </View>
                    <View style={styles.helpItem}>
                        <MaterialIcons name="support-agent" size={16} color={COLORS.gray400} />
                        <Text style={styles.helpText}>
                            Puedes solicitar hablar con el profesional en cualquier momento
                        </Text>
                    </View>
                </View>

                {/* AVISO LEGAL Section */}
                <View style={styles.legalNoticeSection}>
                    <View style={styles.legalNoticeHeader}>
                        <MaterialIcons name="gavel" size={18} color={COLORS.amber600} />
                        <Text style={styles.legalNoticeTitle}>AVISO LEGAL</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.legalNoticeCard}
                        onPress={() => router.push("/legal/legal-notice" as any)}
                    >
                        <Text style={styles.legalNoticeText}>
                            Este documento detalla las condiciones legales, responsabilidades y limitaciones de uso de la plataforma TwinPro. El uso de la plataforma implica la aceptación de todos los términos aquí descritos.
                        </Text>
                        <View style={styles.legalNoticeLink}>
                            <Text style={styles.legalNoticeLinkText}>Ver documento completo</Text>
                            <MaterialIcons name="arrow-forward" size={16} color="#2563EB" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Understand button */}
                <TouchableOpacity
                    style={styles.understandButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.understandButtonText}>Entendido</Text>
                </TouchableOpacity>
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
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.textMain,
        flex: 1,
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    professionalCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    professionalIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.amber100,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    professionalInfo: {
        flex: 1,
    },
    professionalName: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textMain,
        marginBottom: 2,
    },
    professionalProfession: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    disclaimerCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.amber500,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    disclaimerText: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 22,
    },
    infoNote: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.blue50,
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginBottom: 24,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    helpSection: {
        backgroundColor: COLORS.gray50,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    helpItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    understandButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    understandButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Legal Notice Section
    legalNoticeSection: {
        marginBottom: 24,
    },
    legalNoticeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    legalNoticeTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.amber600,
        letterSpacing: 0.5,
    },
    legalNoticeCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    legalNoticeText: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.gray500,
        marginBottom: 12,
    },
    legalNoticeLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legalNoticeLinkText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2563EB",
    },
});
