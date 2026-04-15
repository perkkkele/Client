import { router } from "expo-router";
import { useState } from "react";
import {
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const COLORS = {
    primary: "#FFED00",
    primaryDark: "#E6D500",
    backgroundLight: "#F5F5F7",
    backgroundDark: "#000000",
    cardLight: "#FFFFFF",
    cardDark: "#1C1C1E",
    textLight: "#1C1C1E",
    textDark: "#FFFFFF",
    subtextLight: "#8E8E93",
    subtextDark: "#98989D",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    blue50: "#EFF6FF",
    blue400: "#60A5FA",
    blue600: "#2563EB",
};

interface FAQItem {
    question: string;
    answer: string;
}

function getFaqItems(t: any): FAQItem[] {
    return [
        { question: t('helpProProfileFaq.q1'), answer: t('helpProProfileFaq.a1') },
        { question: t('helpProProfileFaq.q2'), answer: t('helpProProfileFaq.a2') },
        { question: t('helpProProfileFaq.q3'), answer: t('helpProProfileFaq.a3') },
        { question: t('helpProProfileFaq.q4'), answer: t('helpProProfileFaq.a4') },
        { question: t('helpProProfileFaq.q5'), answer: t('helpProProfileFaq.a5') },
        { question: t('helpProProfileFaq.q6'), answer: t('helpProProfileFaq.a6') },
    ];
}

interface GuideItem {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    duration: string;
}

function getGuideItems(t: any): GuideItem[] {
    return [
        { icon: "person-pin", title: t('helpProProfileFaq.guide1Title'), duration: t('helpProProfileFaq.guide1Duration') },
        { icon: "smart-toy", title: t('helpProProfileFaq.guide2Title'), duration: t('helpProProfileFaq.guide2Duration') },
        { icon: "trending-up", title: t('helpProProfileFaq.guide3Title'), duration: t('helpProProfileFaq.guide3Duration') },
    ];
}

export default function HelpProProfileScreen() {
    const { t } = useTranslation('onboarding');
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const FAQ_ITEMS = getFaqItems(t);
    const GUIDE_ITEMS = getGuideItems(t);

    function handleClose() {
        router.back();
    }

    function handleSendEmail() {
        Linking.openURL("mailto:hola@twinpro.app?subject=Ayuda%20con%20perfil%20profesional");
    }

    function toggleFAQ(index: number) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    const filteredFAQs = FAQ_ITEMS.filter(
        (item) =>
            searchQuery === "" ||
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header Negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{t('helpProProfile.title')}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <MaterialIcons name="close" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                    {t('helpProProfile.subtitle')}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Search */}
                <View style={styles.searchCard}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={COLORS.primaryDark} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('helpCommon.searchPlaceholder')}
                            placeholderTextColor={COLORS.gray400}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCommon.faqSection')}</Text>
                    <View style={styles.faqContainer}>
                        {filteredFAQs.map((item, index) => (
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
                                        size={22}
                                        color={COLORS.gray400}
                                    />
                                </View>
                                {expandedFAQ === index && (
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCommon.needMoreHelp')}</Text>
                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={handleSendEmail}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIcon, styles.contactIconBlue]}>
                            <MaterialIcons name="mail-outline" size={22} color={COLORS.blue600} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>{t('helpCommon.contactSupport')}</Text>
                            <Text style={styles.contactHint}>hola@twinpro.app</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Guides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpCommon.guidesSection')}</Text>
                    <View style={styles.guidesCard}>
                        {GUIDE_ITEMS.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.guideItem,
                                    index < GUIDE_ITEMS.length - 1 && styles.guideItemBorder,
                                ]}
                                activeOpacity={0.7}
                            >
                                <View style={styles.guideIconContainer}>
                                    <MaterialIcons name={item.icon} size={16} color={COLORS.gray400} />
                                </View>
                                <View style={styles.guideInfo}>
                                    <Text style={styles.guideTitle}>{item.title}</Text>
                                    <Text style={styles.guideDuration}>{item.duration}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray200} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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
    // Header
    header: {
        backgroundColor: COLORS.backgroundDark,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headerTitle: {
        color: COLORS.textDark,
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.gray800,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    headerSubtitle: {
        color: COLORS.gray400,
        fontSize: 12,
        lineHeight: 18,
        maxWidth: "85%",
    },
    // Content
    content: {
        flex: 1,
        marginTop: -24,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    // Search
    searchCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textLight,
        marginLeft: 8,
    },
    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.subtextLight,
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },
    // FAQs
    faqContainer: {
        gap: 8,
    },
    faqItem: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        overflow: "hidden",
    },
    faqHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        marginRight: 8,
    },
    faqAnswer: {
        fontSize: 12,
        color: COLORS.subtextLight,
        lineHeight: 18,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
    },
    // Contact
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    contactIconBlue: {
        backgroundColor: COLORS.blue50,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    contactHint: {
        fontSize: 12,
        color: COLORS.subtextLight,
        marginTop: 2,
    },
    // Guides
    guidesCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        overflow: "hidden",
    },
    guideItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    guideItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    guideIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.backgroundLight,
        justifyContent: "center",
        alignItems: "center",
    },
    guideInfo: {
        flex: 1,
    },
    guideTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    guideDuration: {
        fontSize: 10,
        color: COLORS.subtextLight,
        marginTop: 2,
    },
    bottomSpacer: {
        height: 24,
    },
});
