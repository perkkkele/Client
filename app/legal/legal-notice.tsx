import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#181811",
    textMuted: "#64748B",
    gray50: "#F9FAFB",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray700: "#374151",
    white: "#FFFFFF",
    amber50: "#FFFBEB",
    amber100: "#FEF3C7",
    amber500: "#F59E0B",
    amber600: "#D97706",
    red50: "#FEF2F2",
    red500: "#EF4444",
};

export default function LegalNoticeScreen() {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aviso Legal</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section 1 - General Legal Notice */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Aviso Legal General – Uso de TwinPro</Text>
                    <Text style={styles.paragraph}>
                        TwinPro es una plataforma tecnológica que facilita la comunicación entre usuarios y profesionales, incluyendo interacciones mediante gemelos digitales basados en inteligencia artificial.
                    </Text>

                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>Naturaleza del Servicio:</Text>
                                <Text style={styles.bulletText}>
                                    TwinPro no presta servicios profesionales ni sustituye la atención directa de un profesional humano.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>Carácter de la Información:</Text>
                                <Text style={styles.bulletText}>
                                    La información proporcionada a través de la plataforma, ya sea por gemelos digitales o por profesionales, tiene un carácter meramente informativo y orientativo.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>Garantías y Responsabilidad:</Text>
                                <Text style={styles.bulletText}>
                                    TwinPro no garantiza la exactitud, integridad o actualidad de los contenidos y no se responsabiliza de las decisiones, acciones o consecuencias derivadas del uso de la información obtenida a través de la plataforma.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>Responsabilidad del Usuario:</Text>
                                <Text style={styles.bulletText}>
                                    El usuario acepta que el uso de TwinPro se realiza bajo su propia responsabilidad.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section 2 - Digital Twins Notice */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Aviso General de Gemelos Digitales</Text>

                    <View style={styles.warningCard}>
                        <MaterialIcons name="warning" size={20} color={COLORS.amber600} />
                        <Text style={styles.warningText}>
                            IMPORTANTE: Las respuestas generadas por los gemelos digitales de TwinPro son producidas mediante sistemas automatizados de inteligencia artificial y pueden ser inexactas, incompletas, desactualizadas o incorrectas.
                        </Text>
                    </View>

                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>No Sustitución:</Text>
                                <Text style={styles.bulletText}>
                                    Los gemelos digitales no sustituyen en ningún caso el asesoramiento, diagnóstico, evaluación o intervención de un profesional humano cualificado.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <View style={styles.bulletDot} />
                            <View style={styles.bulletContent}>
                                <Text style={styles.bulletLabel}>Limitación de Decisiones:</Text>
                                <Text style={styles.bulletText}>
                                    El usuario se compromete a no basar decisiones personales, profesionales, legales, médicas, financieras o de cualquier otro tipo exclusivamente en la información proporcionada por un gemelo digital.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Understand Button */}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.gray700,
        marginBottom: 16,
    },
    bulletList: {
        gap: 16,
    },
    bulletItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.amber500,
        marginTop: 8,
    },
    bulletContent: {
        flex: 1,
    },
    bulletLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    bulletText: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.gray500,
    },
    warningCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.amber50,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.amber500,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 22,
        color: COLORS.amber600,
    },
    understandButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
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
});
