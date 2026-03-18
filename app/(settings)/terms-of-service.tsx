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
import { useTranslation } from 'react-i18next';

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
    gray700: "#374151",
};

export default function TermsOfServiceScreen() {
    const { t } = useTranslation('settings');

    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('termsOfServiceScreen.headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Meta */}
                <View style={styles.metaRow}>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>{t('termsOfServiceScreen.lastUpdated')}</Text>
                </View>

                {/* Section 1 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('termsOfServiceScreen.section1Title')}</Text>
                    <Text style={styles.paragraph}>
                        {t('termsOfServiceScreen.section1Text')}
                    </Text>
                </View>

                {/* Section 2 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('termsOfServiceScreen.section2Title')}</Text>
                    <Text style={styles.paragraph}>
                        {t('termsOfServiceScreen.section2Intro')}
                    </Text>
                    <View style={styles.listContainer}>
                        <View style={styles.listItem}>
                            <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                            <Text style={styles.listText}>
                                {t('termsOfServiceScreen.section2Item1')}
                            </Text>
                        </View>
                        <View style={styles.listItem}>
                            <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                            <Text style={styles.listText}>
                                {t('termsOfServiceScreen.section2Item2')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 3 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('termsOfServiceScreen.section3Title')}</Text>
                    <Text style={styles.paragraph}>
                        {t('termsOfServiceScreen.section3Text')}
                    </Text>
                </View>

                {/* Section 4 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('termsOfServiceScreen.section4Title')}</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>{t('termsOfServiceScreen.autoRenewalTitle')}</Text>
                        <Text style={styles.infoCardText}>
                            {t('termsOfServiceScreen.autoRenewalText')}
                        </Text>
                    </View>
                </View>

                {/* Section 5 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('termsOfServiceScreen.section5Title')}</Text>
                    <Text style={styles.paragraph}>
                        {t('termsOfServiceScreen.section5Text')}
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.fullDocButton}
                        onPress={() => Linking.openURL("https://legal.twinpro.app#terms")}
                    >
                        <MaterialIcons name="description" size={18} color={COLORS.gray500} />
                        <Text style={styles.fullDocText}>{t('termsOfServiceScreen.viewFullDoc')}</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={COLORS.gray400} />
                    </TouchableOpacity>
                    <Text style={styles.footerText}>{t('termsOfServiceScreen.acceptTerms')}</Text>
                </View>
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
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 48,
    },
    // Meta
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 24,
    },
    metaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    metaText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // Section
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 15,
        color: COLORS.gray700,
        lineHeight: 24,
    },
    // List
    listContainer: {
        marginTop: 16,
        gap: 12,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    listText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    // Info Card
    infoCard: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    infoCardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    infoCardText: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    // Footer
    footer: {
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        gap: 16,
    },
    fullDocButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 12,
    },
    fullDocText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "center",
    },
});
