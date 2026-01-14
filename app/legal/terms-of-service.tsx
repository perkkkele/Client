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
    gray400: "#9CA3AF",
    gray500: "#6B7280",
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
                    <Text style={styles.metaText}>Última actualización: 14 de enero, 2026</Text>
                </View>

                {/* Section 1 - Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introducción</Text>
                    <Text style={styles.paragraph}>
                        Bienvenido a TwinPro. Al acceder y utilizar la aplicación, aceptas quedar vinculado por los presentes Términos de Servicio.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        TwinPro es una plataforma tecnológica de intermediación que facilita la comunicación entre usuarios y profesionales, incluyendo interacciones mediante gemelos digitales basados en inteligencia artificial, así como chats, videollamadas, agenda y servicios asociados.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        TwinPro no presta servicios profesionales ni actúa como representante de los profesionales que utilizan la plataforma.
                    </Text>
                </View>

                {/* Section 2 - Digital Twins */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Uso de Gemelos Digitales y Profesionales</Text>
                    <Text style={styles.paragraph}>
                        Los gemelos digitales disponibles en TwinPro son representaciones automatizadas configuradas o supervisadas por profesionales reales.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        Debes tener en cuenta que:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Las respuestas generadas son automatizadas, con fines informativos y orientativos
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                No sustituyen la atención ni el asesoramiento profesional humano
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Pueden ser inexactas, incompletas o desactualizadas
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                No deben utilizarse para tomar decisiones críticas sin validación humana
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        El usuario se compromete a mantener un uso respetuoso de la plataforma y de los profesionales que la integran.
                    </Text>
                </View>

                {/* Section 3 - Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Privacidad y Datos Personales</Text>
                    <Text style={styles.paragraph}>
                        El tratamiento de los datos personales se realiza conforme a la normativa vigente (RGPD y normativa aplicable).
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        TwinPro aplica medidas de seguridad adecuadas para proteger la información y no vende datos personales.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        Para más información, consulta nuestra{" "}
                        <Text style={styles.link} onPress={() => router.push("/legal/privacy-policy")}>
                            Política de Privacidad
                        </Text>.
                    </Text>
                </View>

                {/* Section 4 - Payments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Servicios, Créditos y Suscripciones</Text>
                    <Text style={styles.paragraph}>
                        TwinPro puede ofrecer funcionalidades gratuitas y servicios de pago mediante créditos, suscripciones u otros modelos.
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Las suscripciones se renuevan automáticamente salvo cancelación previa
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Siempre se informará al usuario antes de realizar cualquier cargo
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.bulletText}>
                                Las condiciones económicas completas se detallan en los Términos de Servicio oficiales
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 5 - Disclaimer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Limitación de Responsabilidad</Text>
                    <Text style={styles.paragraph}>
                        TwinPro no será responsable de:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="remove" size={18} color={COLORS.gray400} />
                            <Text style={styles.bulletText}>
                                Las decisiones tomadas por los usuarios basándose en información obtenida a través de la plataforma
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="remove" size={18} color={COLORS.gray400} />
                            <Text style={styles.bulletText}>
                                El contenido proporcionado por gemelos digitales o profesionales
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <MaterialIcons name="remove" size={18} color={COLORS.gray400} />
                            <Text style={styles.bulletText}>
                                La disponibilidad, resultado o calidad de los servicios ofrecidos por los profesionales
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        El uso de TwinPro se realiza bajo la responsabilidad del usuario.
                    </Text>
                </View>

                {/* Full Terms Button */}
                <TouchableOpacity
                    style={styles.fullTermsButton}
                    onPress={() => Linking.openURL("https://legal.twinpro.app#terms")}
                >
                    <View style={styles.fullTermsLeft}>
                        <MaterialIcons name="description" size={20} color={COLORS.gray500} />
                        <Text style={styles.fullTermsText}>Ver Términos y Condiciones Completos</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Footer Disclaimer */}
                <Text style={styles.footerDisclaimer}>
                    Este resumen no reemplaza el documento legal completo. Al usar la app, aceptas los Términos y Condiciones oficiales.
                </Text>

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
        color: "#2563EB",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    legalSection: {
        marginBottom: 20,
    },
    legalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: 8,
    },
    legalText: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
    },
    fullTermsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceLight,
        marginBottom: 16,
    },
    fullTermsLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    fullTermsText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    footerDisclaimer: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 16,
    },
    bottomSpacer: {
        height: 32,
    },
});
