import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
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
    purple50: "#FAF5FF",
    purple600: "#9333EA",
    orange50: "#FFF7ED",
    orange600: "#EA580C",
    green50: "#F0FDF4",
    green600: "#16A34A",
};

interface SummaryItem {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
}

const SUMMARY_ITEMS: SummaryItem[] = [
    {
        icon: "lock",
        iconBg: COLORS.blue50,
        iconColor: COLORS.blue600,
        title: "Privacidad de Datos",
        description: "Tus datos personales se tratan conforme a la normativa vigente (RGPD y normativa aplicable). Tus comunicaciones están protegidas mediante medidas de seguridad adecuadas y no vendemos tus datos personales.\n\nAlgunos datos pueden compartirse con proveedores tecnológicos únicamente cuando sea necesario para prestar el servicio o por obligación legal.",
    },
    {
        icon: "smart-toy",
        iconBg: COLORS.purple50,
        iconColor: COLORS.purple600,
        title: "Interacción con Gemelos Digitales (IA)",
        description: "En TwinPro puedes interactuar con Gemelos Digitales basados en inteligencia artificial, configurados o supervisados por profesionales.\n\nLas respuestas generadas:\n• Son automatizadas\n• Tienen carácter informativo y orientativo\n• No sustituyen la atención ni el asesoramiento profesional humano\n• Pueden ser inexactas, incompletas o desactualizadas.",
    },
    {
        icon: "verified-user",
        iconBg: COLORS.orange50,
        iconColor: COLORS.orange600,
        title: "Responsabilidad del Usuario",
        description: "Al utilizar TwinPro, te comprometes a:\n• Usar el servicio de forma respetuosa y conforme a la ley\n• No realizar usos indebidos, abusivos o fraudulentos\n• No basar decisiones críticas exclusivamente en la información proporcionada por la plataforma o los gemelos digitales\n\nEl incumplimiento de estas normas puede dar lugar a la suspensión o cancelación de la cuenta.",
    },
    {
        icon: "payments",
        iconBg: COLORS.green50,
        iconColor: COLORS.green600,
        title: "Servicios, Créditos y Pagos",
        description: "TwinPro puede ofrecer:\n• Funcionalidades gratuitas\n• Servicios de pago mediante créditos, suscripciones u otros modelos\n\nSiempre se te informará previamente antes de realizar cualquier cargo. Las condiciones económicas se detallan en los Términos de Servicio.",
    },
];

export default function TermsPrivacyScreen() {
    function handleBack() {
        router.back();
    }

    function handleViewFullTerms() {
        Linking.openURL("https://legal.twinpro.app");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resumen Ejecutivo</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro */}
                <View style={styles.intro}>
                    <Text style={styles.introSubtitle}>
                        Hemos resumido los puntos clave de nuestros textos legales para que entiendas de forma clara cómo funciona TwinPro, cómo se tratan tus datos y cuáles son las responsabilidades asociadas al uso del servicio.
                    </Text>
                </View>

                {/* Summary Items */}
                <View style={styles.itemsContainer}>
                    {SUMMARY_ITEMS.map((item, index) => (
                        <View key={index} style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: item.iconBg }]}>
                                <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text style={styles.summaryTitle}>{item.title}</Text>
                                <Text style={styles.summaryDescription}>{item.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Full Terms Button */}
                <TouchableOpacity style={styles.fullTermsButton} onPress={handleViewFullTerms}>
                    <View style={styles.fullTermsLeft}>
                        <MaterialIcons name="description" size={20} color={COLORS.gray400} />
                        <Text style={styles.fullTermsText}>Ver Términos y Condiciones Completos</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    Este resumen no reemplaza el documento legal completo. Al usar la app, aceptas los Términos y Condiciones oficiales.
                </Text>
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
        padding: 20,
        paddingBottom: 32,
        gap: 24,
    },
    // Intro
    intro: {
        alignItems: "center",
        gap: 8,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    introSubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 20,
    },
    // Summary Items
    itemsContainer: {
        gap: 16,
    },
    summaryItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    summaryContent: {
        flex: 1,
        gap: 4,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    summaryDescription: {
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    // Full Terms Button
    fullTermsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 16,
        marginTop: 8,
    },
    fullTermsLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    fullTermsText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Disclaimer
    disclaimer: {
        fontSize: 10,
        color: COLORS.gray400,
        textAlign: "center",
        paddingHorizontal: 24,
    },
});
