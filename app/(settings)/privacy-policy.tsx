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
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    green600: "#16A34A",
};

interface SummaryItem {
    title: string;
    description: string;
}

const SUMMARY_ITEMS: SummaryItem[] = [];

export default function PrivacyPolicyScreen() {
    const { t } = useTranslation('settings');

    const summaryItems: SummaryItem[] = [
        { title: t('privacyPolicyScreen.summary1Title'), description: t('privacyPolicyScreen.summary1Desc') },
        { title: t('privacyPolicyScreen.summary2Title'), description: t('privacyPolicyScreen.summary2Desc') },
        { title: t('privacyPolicyScreen.summary3Title'), description: t('privacyPolicyScreen.summary3Desc') },
    ];

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
                <Text style={styles.headerTitle}>{t('privacyPolicyScreen.headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro */}
                <View style={styles.introSection}>
                    <Text style={styles.metaText}>{t('privacyPolicyScreen.lastUpdated')}</Text>
                    <Text style={styles.introText}>
                        {t('privacyPolicyScreen.introText')}
                    </Text>
                </View>

                {/* Executive Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIconContainer}>
                            <MaterialIcons name="summarize" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.summaryTitle}>{t('privacyPolicyScreen.executiveSummary')}</Text>
                    </View>
                    <View style={styles.summaryList}>
                        {summaryItems.map((item, index) => (
                            <View key={index} style={styles.summaryItem}>
                                <MaterialIcons name="check" size={18} color={COLORS.green600} />
                                <Text style={styles.summaryItemText}>
                                    <Text style={styles.summaryItemBold}>{item.title}:</Text> {item.description}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Section 1 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="storage" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('privacyPolicyScreen.section1Title')}</Text>
                    </View>
                    <View style={styles.contentCard}>
                        <Text style={styles.cardParagraph}>
                            {t('privacyPolicyScreen.section1Intro')}
                        </Text>
                        <View style={styles.bulletList}>
                            <View style={styles.bulletItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.bulletText}>
                                    <Text style={styles.bulletBold}>{t('privacyPolicyScreen.section1Bullet1Title')}</Text> {t('privacyPolicyScreen.section1Bullet1Desc')}
                                </Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.bulletText}>
                                    <Text style={styles.bulletBold}>{t('privacyPolicyScreen.section1Bullet2Title')}</Text> {t('privacyPolicyScreen.section1Bullet2Desc')}
                                </Text>
                            </View>
                            <View style={styles.bulletItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.bulletText}>
                                    <Text style={styles.bulletBold}>{t('privacyPolicyScreen.section1Bullet3Title')}</Text> {t('privacyPolicyScreen.section1Bullet3Desc')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section 2 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="psychology" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('privacyPolicyScreen.section2Title')}</Text>
                    </View>
                    <Text style={styles.sectionParagraph}>
                        {t('privacyPolicyScreen.section2Intro')}
                    </Text>
                    <View style={styles.usageGrid}>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="build" size={20} color={COLORS.gray400} />
                            <Text style={styles.usageText}>{t('privacyPolicyScreen.section2Usage1')}</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="security" size={20} color={COLORS.gray400} />
                            <Text style={styles.usageText}>{t('privacyPolicyScreen.section2Usage2')}</Text>
                        </View>
                        <View style={styles.usageItem}>
                            <MaterialIcons name="analytics" size={20} color={COLORS.gray400} />
                            <Text style={styles.usageText}>{t('privacyPolicyScreen.section2Usage3')}</Text>
                        </View>
                    </View>
                </View>

                {/* Section 3 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('privacyPolicyScreen.section3Title')}</Text>
                    </View>
                    <Text style={styles.sectionParagraph}>
                        {t('privacyPolicyScreen.section3Text')}
                    </Text>
                </View>

                {/* Section 4 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="gavel" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('privacyPolicyScreen.section4Title')}</Text>
                    </View>
                    <View style={styles.rightsCard}>
                        <Text style={styles.rightsText}>
                            {t('privacyPolicyScreen.section4Text')}
                        </Text>
                        <TouchableOpacity>
                            <Text style={styles.rightsLink}>{t('privacyPolicyScreen.contactPrivacyOfficer')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.fullDocButton}
                        onPress={() => Linking.openURL("https://legal.twinpro.app#privacy")}
                    >
                        <MaterialIcons name="description" size={18} color={COLORS.gray500} />
                        <Text style={styles.fullDocText}>{t('privacyPolicyScreen.viewFullDoc')}</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={COLORS.gray400} />
                    </TouchableOpacity>
                    <Text style={styles.footerText}>{t('privacyPolicyScreen.acceptTerms')}</Text>
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
        backgroundColor: COLORS.backgroundLight,
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
        paddingBottom: 48,
    },
    // Intro
    introSection: {
        marginBottom: 24,
    },
    metaText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    introText: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    // Summary Card
    summaryCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: 24,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    summaryIconContainer: {
        backgroundColor: "rgba(249, 245, 6, 0.2)",
        padding: 6,
        borderRadius: 8,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
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
    summaryItemText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.gray700,
        lineHeight: 20,
    },
    summaryItemBold: {
        fontWeight: "bold",
    },
    // Section
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    sectionParagraph: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
        marginBottom: 16,
    },
    // Content Card
    contentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    cardParagraph: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
        marginBottom: 12,
    },
    bulletList: {
        gap: 8,
    },
    bulletItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginTop: 7,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 22,
    },
    bulletBold: {
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Usage Grid
    usageGrid: {
        gap: 12,
    },
    usageItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    usageText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    // Rights Card
    rightsCard: {
        backgroundColor: "rgba(249, 245, 6, 0.1)",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(249, 245, 6, 0.2)",
    },
    rightsText: {
        fontSize: 14,
        color: COLORS.gray800,
        lineHeight: 22,
        marginBottom: 12,
    },
    rightsLink: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
        textDecorationLine: "underline",
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
