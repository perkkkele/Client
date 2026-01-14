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
    surfaceDark: "#2E2D15",
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

export default function PrivacyPolicyScreen() {
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
                <Text style={styles.headerTitle}>Política de Privacidad</Text>
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

                {/* Intro Text */}
                <Text style={styles.introText}>
                    En TwinPro tratamos tus datos personales con responsabilidad y transparencia.
                </Text>
                <Text style={[styles.introText, { marginBottom: 20 }]}>
                    Este resumen explica de forma clara qué datos tratamos, para qué los usamos y cuáles son tus derechos al utilizar la plataforma.
                </Text>

                {/* Executive Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>🧾 RESUMEN EJECUTIVO</Text>
                    <View style={styles.summaryList}>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Tratamiento responsable:</Text> Recogemos únicamente los datos necesarios para prestar el servicio y mejorar su funcionamiento.
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Seguridad y confidencialidad:</Text> Aplicamos medidas técnicas y organizativas adecuadas para proteger tu información.
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Control del usuario:</Text> Puedes acceder, modificar o eliminar tus datos y gestionar tus preferencias en cualquier momento.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 1 - Data Collection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Recopilación de Información</Text>
                    <Text style={styles.paragraph}>
                        Recopilamos datos personales cuando utilizas TwinPro, en función de cómo interactúas con la plataforma.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12, fontWeight: "600", color: COLORS.textLight }]}>
                        Tipos de datos tratados:
                    </Text>
                    <View style={styles.sectionCard}>
                        <View style={styles.dataList}>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Datos de registro:</Text> nombre, correo electrónico, número de teléfono, foto de perfil u otros datos facilitados voluntariamente.
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Datos de uso:</Text> interacciones con la aplicación, frecuencia de uso, preferencias y configuración.
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Comunicaciones:</Text> contenido de chats e interacciones con gemelos digitales o profesionales.
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Datos técnicos:</Text> información básica del dispositivo y versión de la app.
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        TwinPro no solicita datos innecesarios ni sensibles para el uso estándar del servicio.
                    </Text>
                </View>

                {/* Section 2 - Data Usage */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Uso de la Información</Text>
                    <Text style={styles.paragraph}>
                        Los datos se utilizan para:
                    </Text>
                    <View style={styles.usageGrid}>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="settings" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Prestar y gestionar el servicio</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="smart-toy" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Facilitar interacciones con gemelos digitales y profesionales</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="build" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Mejorar la experiencia de usuario y la estabilidad de la plataforma</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="security" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Prevenir usos indebidos, fraudes o incidencias de seguridad</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="gavel" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Cumplir obligaciones legales</Text>
                        </View>
                    </View>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        Cuando utilizamos datos con fines analíticos, lo hacemos de forma agregada o pseudonimizada, y solo si el usuario ha dado su consentimiento.
                    </Text>
                </View>

                {/* Section 3 - Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Almacenamiento y Seguridad</Text>
                    <Text style={styles.paragraph}>
                        Tus datos se almacenan en servidores seguros y se conservan únicamente durante el tiempo necesario para cumplir las finalidades descritas.
                    </Text>
                    <Text style={[styles.paragraph, { marginTop: 12 }]}>
                        TwinPro implementa:
                    </Text>
                    <View style={styles.usageGrid}>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="vpn-key" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Controles de acceso restringido</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="verified-user" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Medidas de seguridad de nivel industrial</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="shield" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Protocolos de protección frente a accesos no autorizados</Text>
                        </View>
                    </View>
                </View>

                {/* Section 4 - Rights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Tus Derechos</Text>
                    <Text style={styles.paragraph}>
                        Como usuario, tienes derecho a:
                    </Text>
                    <View style={styles.rightsCard}>
                        <View style={styles.dataList}>
                            <View style={styles.dataItem}>
                                <MaterialIcons name="visibility" size={16} color={COLORS.gray500} />
                                <Text style={styles.dataText}>Acceder a tus datos personales</Text>
                            </View>
                            <View style={styles.dataItem}>
                                <MaterialIcons name="edit" size={16} color={COLORS.gray500} />
                                <Text style={styles.dataText}>Rectificar datos inexactos</Text>
                            </View>
                            <View style={styles.dataItem}>
                                <MaterialIcons name="delete" size={16} color={COLORS.gray500} />
                                <Text style={styles.dataText}>Solicitar la eliminación de tus datos</Text>
                            </View>
                            <View style={styles.dataItem}>
                                <MaterialIcons name="block" size={16} color={COLORS.gray500} />
                                <Text style={styles.dataText}>Oponerte o limitar determinados tratamientos</Text>
                            </View>
                            <View style={styles.dataItem}>
                                <MaterialIcons name="sync-alt" size={16} color={COLORS.gray500} />
                                <Text style={styles.dataText}>Solicitar la portabilidad de tus datos</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => Linking.openURL("mailto:legal@twinpro.app")}
                        >
                            <MaterialIcons name="mail" size={16} color={COLORS.textLight} />
                            <Text style={styles.contactLink}>Contactar al Oficial de Privacidad</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Full Terms Button */}
                <TouchableOpacity
                    style={styles.fullTermsButton}
                    onPress={() => Linking.openURL("https://legal.twinpro.app#privacy")}
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
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.backgroundLight,
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
        color: COLORS.textLight,
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    metaContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
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
        fontWeight: "600",
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    summaryCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    summaryIconContainer: {
        backgroundColor: "rgba(249, 245, 6, 0.2)",
        padding: 6,
        borderRadius: 8,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textLight,
        letterSpacing: 0.5,
    },
    summaryList: {
        gap: 12,
    },
    summaryItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    summaryText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.gray700,
    },
    summaryBold: {
        fontWeight: "600",
        color: COLORS.textLight,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.textLight,
    },
    sectionCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        marginTop: 8,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
    },
    dataList: {
        gap: 10,
    },
    dataItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    dataDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginTop: 7,
    },
    dataText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
    },
    dataBold: {
        fontWeight: "600",
        color: COLORS.textLight,
    },
    usageGrid: {
        gap: 12,
        marginTop: 12,
    },
    usageItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    usageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    rightsCard: {
        backgroundColor: "rgba(249, 245, 6, 0.1)",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(249, 245, 6, 0.2)",
        marginTop: 12,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(249, 245, 6, 0.3)",
    },
    contactLink: {
        fontSize: 13,
        fontWeight: "bold",
        color: COLORS.textLight,
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
