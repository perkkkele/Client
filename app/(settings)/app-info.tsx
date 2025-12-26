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
};

interface LegalItem {
    icon: string;
    label: string;
    route: string;
}

export default function AppInfoScreen() {
    function handleBack() {
        router.back();
    }

    function handleVisitWebsite() {
        Linking.openURL("https://twinpro.com");
    }

    function handleContactUs() {
        Linking.openURL("mailto:info@twinpro.com");
    }

    const legalItems: LegalItem[] = [
        { icon: "gavel", label: "Términos de Servicio", route: "/(settings)/terms-of-service" },
        { icon: "policy", label: "Política de Privacidad", route: "/(settings)/privacy-policy" },
        { icon: "code", label: "Licencias de Código Abierto", route: "/(settings)/licenses" },
        { icon: "volunteer-activism", label: "Créditos", route: "/(settings)/credits" },
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Info de la aplicación</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo & Version */}
                <View style={styles.logoSection}>
                    <View style={styles.appLogo}>
                        <MaterialIcons name="group" size={56} color={COLORS.primary} />
                    </View>
                    <Text style={styles.appName}>TwinPro</Text>
                    <Text style={styles.appVersion}>Versión 1.0.0</Text>
                </View>

                {/* Legal & Credits Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LEGAL Y CRÉDITOS</Text>
                    <View style={styles.legalCard}>
                        {legalItems.map((item, index) => (
                            <View key={item.label}>
                                <TouchableOpacity style={styles.legalItem} onPress={() => router.push(item.route as any)}>
                                    <View style={styles.legalItemLeft}>
                                        <View style={styles.legalIcon}>
                                            <MaterialIcons name={item.icon as any} size={18} color={COLORS.gray600} />
                                        </View>
                                        <Text style={styles.legalLabel}>{item.label}</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                                {index < legalItems.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleVisitWebsite}>
                        <MaterialIcons name="public" size={20} color={COLORS.textMain} />
                        <Text style={styles.actionButtonText}>Visitar nuestra web</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleContactUs}>
                        <MaterialIcons name="mail" size={20} color={COLORS.textMain} />
                        <Text style={styles.actionButtonText}>Contactar con nosotros</Text>
                    </TouchableOpacity>
                </View>

                {/* Copyright */}
                <Text style={styles.copyright}>
                    © 2024 TwinPro Inc. Todos los derechos reservados.
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
        padding: 16,
        paddingBottom: 32,
        gap: 24,
    },
    // Logo Section
    logoSection: {
        alignItems: "center",
        paddingVertical: 32,
        gap: 8,
    },
    appLogo: {
        width: 112,
        height: 112,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        borderBottomLeftRadius: 10,
        backgroundColor: "#000000",
        borderWidth: 4,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    appName: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appVersion: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    // Section
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        paddingHorizontal: 12,
    },
    // Legal Card
    legalCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    legalItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    legalItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    legalIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    legalLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginLeft: 56,
    },
    // Actions Section
    actionsSection: {
        gap: 12,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 16,
        paddingVertical: 14,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Copyright
    copyright: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "center",
        marginTop: 16,
    },
});
