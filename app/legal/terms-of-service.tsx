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
    backgroundDark: "#0F172A",
    surfaceLight: "#FFFFFF",
    textLight: "#181811",
    textMuted: "#64748B",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray700: "#374151",
    gray800: "#1E293B",
    white: "#FFFFFF",
    green600: "#16A34A",
};

export default function TermsOfServiceScreen() {
    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="arrow-back-ios-new" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos de Servicio</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Meta Text */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>Última actualización: 24 de Octubre, 2023</Text>
                </View>

                {/* Section 1 - Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introducción</Text>
                    <Text style={styles.paragraph}>
                        Bienvenido a nuestra aplicación. Al acceder y utilizar nuestros servicios de comunicación con avatares, usted acepta estar sujeto a los siguientes términos y condiciones. Nuestra plataforma facilita la conexión entre usuarios y representaciones digitales ("Avatares") de profesionales verificados. Por favor, lea estos términos detenidamente antes de continuar.
                    </Text>
                </View>

                {/* Section 2 - Professional Avatars */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Uso de Avatares Profesionales</Text>
                    <Text style={styles.paragraph}>
                        Los avatares disponibles en esta plataforma son representaciones generadas o gestionadas por profesionales reales. Sin embargo, debe tener en cuenta lo siguiente:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                El asesoramiento proporcionado a través de la interfaz de chat tiene fines informativos y no sustituye una consulta profesional presencial en situaciones de emergencia.
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Usted acepta tratar a los avatares y a los profesionales detrás de ellos con respeto y cortesía en todo momento.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 3 - Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Privacidad y Datos</Text>
                    <Text style={styles.paragraph}>
                        Sus conversaciones están encriptadas de extremo a extremo. No compartimos el contenido de sus chats con terceros sin su consentimiento explícito, salvo cuando sea requerido por ley. Para más detalles, consulte nuestra{" "}
                        <Text style={styles.link} onPress={() => router.push("/legal/privacy-policy")}>
                            Política de Privacidad
                        </Text>.
                    </Text>
                </View>

                {/* Section 4 - Payments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Pagos y Suscripciones</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>Renovación Automática</Text>
                        <Text style={styles.infoCardText}>
                            Las suscripciones a perfiles Pro se renuevan automáticamente al final de cada ciclo de facturación a menos que se cancelen con al menos 24 horas de antelación.
                        </Text>
                    </View>
                </View>

                {/* Section 5 - Disclaimer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Limitación de Responsabilidad</Text>
                    <Text style={styles.paragraph}>
                        La empresa no se hace responsable por decisiones tomadas basándose únicamente en la información proporcionada por los avatares. El uso del servicio es bajo su propio riesgo.
                    </Text>
                </View>

                {/* Bottom spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
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
        color: COLORS.textLight,
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    metaContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 8,
    },
    metaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    metaText: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textLight,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.gray700,
    },
    bulletList: {
        marginTop: 12,
        gap: 12,
    },
    bulletItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
    },
    link: {
        color: COLORS.primary,
        fontWeight: "500",
        textDecorationLine: "underline",
    },
    infoCard: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    infoCardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: 8,
    },
    infoCardText: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
    },
    bottomSpacer: {
        height: 32,
    },
});
