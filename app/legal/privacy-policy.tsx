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
    surfaceDark: "#2E2D15",
    textLight: "#181811",
    textMuted: "#64748B",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
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
                    <Text style={styles.metaText}>Última actualización: 15 Oct, 2023</Text>
                </View>
                <Text style={styles.introText}>
                    En TwinPro, nos tomamos muy en serio la privacidad de tus datos. Este documento detalla cómo recopilamos, usamos y protegemos tu información personal al interactuar con nuestros avatares profesionales.
                </Text>

                {/* Executive Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIconContainer}>
                            <MaterialIcons name="summarize" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.summaryTitle}>RESUMEN EJECUTIVO</Text>
                    </View>
                    <View style={styles.summaryList}>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Recopilación Mínima:</Text> Solo guardamos los datos necesarios (email, teléfono) para gestionar tu cuenta.
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Encriptación:</Text> Tus conversaciones con avatares están encriptadas y protegidas.
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <MaterialIcons name="check" size={18} color={COLORS.green600} />
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryBold}>Control Total:</Text> Puedes descargar o borrar tus datos desde tu perfil en cualquier momento.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 1 - Data Collection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="storage" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>1. Recopilación de información</Text>
                    </View>
                    <View style={styles.sectionCard}>
                        <Text style={styles.paragraph}>
                            Recopilamos información para proporcionar y mejorar nuestros servicios de comunicación. Los tipos de datos incluyen:
                        </Text>
                        <View style={styles.dataList}>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Datos de Registro:</Text> Nombre, correo electrónico, número de teléfono y foto de perfil.
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Contenido de Mensajes:</Text> Conversaciones encriptadas con avatares profesionales para mejorar el contexto de las respuestas.
                                </Text>
                            </View>
                            <View style={styles.dataItem}>
                                <View style={styles.dataDot} />
                                <Text style={styles.dataText}>
                                    <Text style={styles.dataBold}>Datos de Uso:</Text> Frecuencia de uso, interacciones con directorios y preferencias de avatares.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section 2 - Data Usage */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="psychology" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>2. Uso de la información</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        La información recopilada se utiliza principalmente para garantizar que los avatares profesionales respondan de manera precisa y útil. Además, utilizamos los datos para:
                    </Text>
                    <View style={styles.usageGrid}>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="build" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Mantenimiento y mejora técnica</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="security" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Detección y prevención de fraude</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="analytics" size={20} color={COLORS.textMuted} />
                            <Text style={styles.usageText}>Análisis anonimizado de tendencias</Text>
                        </View>
                    </View>
                </View>

                {/* Section 3 - Security */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>3. Almacenamiento y Seguridad</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Implementamos medidas de seguridad de nivel industrial, incluyendo encriptación de extremo a extremo para chats sensibles. Sus datos se almacenan en servidores seguros con acceso restringido únicamente a personal autorizado. Retenemos su información solo el tiempo necesario para cumplir con los fines establecidos en esta política.
                    </Text>
                </View>

                {/* Section 4 - Rights */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="gavel" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>4. Tus Derechos</Text>
                    </View>
                    <View style={styles.rightsCard}>
                        <Text style={styles.rightsText}>
                            Como usuario de TwinPro, tienes derecho a acceder, rectificar o eliminar tus datos personales en cualquier momento. También puedes oponerte al procesamiento de ciertos datos o solicitar su portabilidad.
                        </Text>
                        <TouchableOpacity>
                            <Text style={styles.contactLink}>Contactar al Oficial de Privacidad</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Al usar TwinPro, aceptas estos términos.</Text>
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
        marginBottom: 8,
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
        marginBottom: 20,
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
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textMuted,
        marginBottom: 12,
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
    },
    rightsText: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.gray700,
        marginBottom: 12,
    },
    contactLink: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textLight,
        textDecorationLine: "underline",
    },
    footer: {
        marginTop: 16,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    bottomSpacer: {
        height: 32,
    },
});
