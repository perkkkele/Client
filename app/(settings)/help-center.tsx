import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    gray800: "#1F2937",
    indigo100: "#E0E7FF",
    indigo600: "#4F46E5",
    purple100: "#F3E8FF",
    purple600: "#9333EA",
    blue50: "#EFF6FF",
    blue600: "#2563EB",
    green50: "#F0FDF4",
    green600: "#16A34A",
    orange50: "#FFF7ED",
    orange600: "#EA580C",
};

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FAQItem[] = [];

export default function HelpCenterScreen() {
    const { t } = useTranslation('settings');
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const faqItems: FAQItem[] = [
        {
            question: t('helpCenterScreen.faq1Question'),
            answer: t('helpCenterScreen.faq1Answer'),
        },
        {
            question: t('helpCenterScreen.faq2Question'),
            answer: t('helpCenterScreen.faq2Answer'),
        },
        {
            question: t('helpCenterScreen.faq3Question'),
            answer: t('helpCenterScreen.faq3Answer'),
        },
    ];

    function handleBack() {
        router.back();
    }

    function toggleFAQ(index: number) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    function handleContactLiveChat() {
        Linking.openURL(
            "mailto:hola@twinpro.app?subject=" +
            encodeURIComponent("Consulta desde la app TwinPro")
        );
    }

    function handleContactEmail() {
        Linking.openURL("mailto:hola@twinpro.app");
    }

    function handleGuidePress() {
        Alert.alert(
            t('helpCenterScreen.comingSoonTitle', { defaultValue: 'Próximamente' }),
            t('helpCenterScreen.comingSoonMessage', { defaultValue: 'Las guías detalladas estarán disponibles pronto.' }),
            [{ text: 'OK' }]
        );
    }

    function handleCommunityPress() {
        Linking.openURL("https://www.twinpro.app");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('helpCenterScreen.headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Search */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('helpCenterScreen.searchPlaceholder')}
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCenterScreen.faqSectionTitle')}</Text>
                    <View style={styles.faqContainer}>
                        {faqItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.faqItem}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    <MaterialIcons
                                        name={expandedFAQ === index ? "expand-less" : "expand-more"}
                                        size={24}
                                        color={COLORS.gray400}
                                    />
                                </View>
                                {expandedFAQ === index && (
                                    <View style={styles.faqAnswerContainer}>
                                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Guides Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCenterScreen.guidesSectionTitle')}</Text>
                    <View style={styles.guidesCard}>
                        <TouchableOpacity style={styles.guideItem} onPress={handleGuidePress}>
                            <View style={[styles.guideIcon, { backgroundColor: COLORS.indigo100 }]}>
                                <MaterialIcons name="smartphone" size={18} color={COLORS.indigo600} />
                            </View>
                            <Text style={styles.guideText}>{t('helpCenterScreen.guideBasicUsage')}</Text>
                            <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.guideItem} onPress={handleGuidePress}>
                            <View style={[styles.guideIcon, { backgroundColor: COLORS.purple100 }]}>
                                <MaterialIcons name="smart-toy" size={18} color={COLORS.purple600} />
                            </View>
                            <Text style={styles.guideText}>{t('helpCenterScreen.guideDigitalTwin')}</Text>
                            <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contact Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCenterScreen.contactSectionTitle')}</Text>
                    <View style={styles.contactGrid}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleContactLiveChat}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.blue50 }]}>
                                <MaterialIcons name="chat" size={24} color={COLORS.blue600} />
                            </View>
                            <Text style={styles.contactLabel}>{t('helpCenterScreen.contactLiveChat')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactButton} onPress={handleContactEmail}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.orange50 }]}>
                                <MaterialIcons name="mail" size={24} color={COLORS.orange600} />
                            </View>
                            <Text style={styles.contactLabel}>{t('helpCenterScreen.contactEmail')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Community Banner */}
                <TouchableOpacity style={styles.communityBanner} onPress={handleCommunityPress}>
                    <View style={styles.communityIcon}>
                        <MaterialIcons name="groups" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.communityText}>
                        <Text style={styles.communityTitle}>{t('helpCenterScreen.communityTitle')}</Text>
                        <Text style={styles.communitySubtitle}>{t('helpCenterScreen.communitySubtitle')}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
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
    // Search
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.textMain,
    },
    // Section
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        paddingHorizontal: 4,
    },
    // FAQ
    faqContainer: {
        gap: 12,
    },
    faqItem: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    faqHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
        paddingRight: 12,
    },
    faqAnswerContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        padding: 16,
        paddingTop: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 20,
    },
    // Guides
    guidesCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    guideItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    guideIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    guideText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginLeft: 56,
    },
    // Contact
    contactGrid: {
        flexDirection: "row",
        gap: 12,
    },
    contactButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        padding: 16,
        alignItems: "center",
        gap: 8,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    contactLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
    },
    // Community
    communityBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray800,
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    communityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    communityText: {
        flex: 1,
    },
    communityTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    communitySubtitle: {
        fontSize: 12,
        color: "#D1D5DB",
    },
});
