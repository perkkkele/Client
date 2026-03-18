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

export default function TermsPrivacyScreen() {
    const { t } = useTranslation('settings');

    const SUMMARY_ITEMS: SummaryItem[] = [
        {
            icon: "lock",
            iconBg: COLORS.blue50,
            iconColor: COLORS.blue600,
            title: t('termsPrivacyScreen.dataPrivacyTitle'),
            description: t('termsPrivacyScreen.dataPrivacyDesc'),
        },
        {
            icon: "smart-toy",
            iconBg: COLORS.purple50,
            iconColor: COLORS.purple600,
            title: t('termsPrivacyScreen.digitalTwinTitle'),
            description: t('termsPrivacyScreen.digitalTwinDesc'),
        },
        {
            icon: "verified-user",
            iconBg: COLORS.orange50,
            iconColor: COLORS.orange600,
            title: t('termsPrivacyScreen.userResponsibilityTitle'),
            description: t('termsPrivacyScreen.userResponsibilityDesc'),
        },
        {
            icon: "payments",
            iconBg: COLORS.green50,
            iconColor: COLORS.green600,
            title: t('termsPrivacyScreen.paymentsTitle'),
            description: t('termsPrivacyScreen.paymentsDesc'),
        },
    ];

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
                <Text style={styles.headerTitle}>{t('termsPrivacyScreen.headerTitle')}</Text>
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
                        {t('termsPrivacyScreen.introText')}
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
                        <Text style={styles.fullTermsText}>{t('termsPrivacyScreen.viewFullTerms')}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    {t('termsPrivacyScreen.disclaimer')}
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
