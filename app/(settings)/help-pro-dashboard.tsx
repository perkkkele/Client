import { router } from "expo-router";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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

const COLORS = {
    primary: "#137fec",
    primaryLight: "#EFF6FF",
    backgroundLight: "#F5F5F7",
    backgroundDark: "#000000",
    cardLight: "#FFFFFF",
    textLight: "#1C1C1E",
    textDark: "#FFFFFF",
    subtextLight: "#8E8E93",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    blue50: "#EFF6FF",
    blue600: "#2563EB",
    green50: "#ECFDF5",
    green600: "#059669",
    purple50: "#F5F3FF",
    purple600: "#7C3AED",
    orange50: "#FFF7ED",
    orange600: "#EA580C",
    yellow50: "#FEFCE8",
    yellow600: "#CA8A04",
};

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

export default function HelpProDashboardScreen() {
    const { t } = useTranslation('settings');
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const FAQ_CATEGORIES_KEYS = [
        'catGemelo', 'catPerfil', 'catCitas', 'catGanancias',
        'catDashboard', 'catAtencion', 'catPlanes', 'catNavegacion'
    ];

    const FAQ_ITEMS = useMemo(() => [
        { categoryKey: 'catGemelo', qKey: 'faq1q', aKey: 'faq1a' },
        { categoryKey: 'catGemelo', qKey: 'faq2q', aKey: 'faq2a' },
        { categoryKey: 'catGemelo', qKey: 'faq3q', aKey: 'faq3a' },
        { categoryKey: 'catGemelo', qKey: 'faq4q', aKey: 'faq4a' },
        { categoryKey: 'catPerfil', qKey: 'faq5q', aKey: 'faq5a' },
        { categoryKey: 'catPerfil', qKey: 'faq6q', aKey: 'faq6a' },
        { categoryKey: 'catPerfil', qKey: 'faq7q', aKey: 'faq7a' },
        { categoryKey: 'catCitas', qKey: 'faq8q', aKey: 'faq8a' },
        { categoryKey: 'catCitas', qKey: 'faq9q', aKey: 'faq9a' },
        { categoryKey: 'catCitas', qKey: 'faq10q', aKey: 'faq10a' },
        { categoryKey: 'catCitas', qKey: 'faq11q', aKey: 'faq11a' },
        { categoryKey: 'catGanancias', qKey: 'faq12q', aKey: 'faq12a' },
        { categoryKey: 'catGanancias', qKey: 'faq13q', aKey: 'faq13a' },
        { categoryKey: 'catDashboard', qKey: 'faq14q', aKey: 'faq14a' },
        { categoryKey: 'catDashboard', qKey: 'faq15q', aKey: 'faq15a' },
        { categoryKey: 'catAtencion', qKey: 'faq16q', aKey: 'faq16a' },
        { categoryKey: 'catAtencion', qKey: 'faq17q', aKey: 'faq17a' },
        { categoryKey: 'catPlanes', qKey: 'faq18q', aKey: 'faq18a' },
        { categoryKey: 'catPlanes', qKey: 'faq19q', aKey: 'faq19a' },
        { categoryKey: 'catPlanes', qKey: 'faq20q', aKey: 'faq20a' },
        { categoryKey: 'catNavegacion', qKey: 'faq21q', aKey: 'faq21a' },
        { categoryKey: 'catNavegacion', qKey: 'faq22q', aKey: 'faq22a' },
    ], []);

    const GUIDE_ITEMS = useMemo(() => [
        { icon: 'smart-toy' as keyof typeof MaterialIcons.glyphMap, titleKey: 'guide1Title', durationKey: 'guide1Duration' },
        { icon: 'calendar-month' as keyof typeof MaterialIcons.glyphMap, titleKey: 'guide2Title', durationKey: 'guide2Duration' },
        { icon: 'payments' as keyof typeof MaterialIcons.glyphMap, titleKey: 'guide3Title', durationKey: 'guide3Duration' },
        { icon: 'trending-up' as keyof typeof MaterialIcons.glyphMap, titleKey: 'guide4Title', durationKey: 'guide4Duration' },
        { icon: 'verified' as keyof typeof MaterialIcons.glyphMap, titleKey: 'guide5Title', durationKey: 'guide5Duration' },
    ], []);

    function handleClose() {
        router.back();
    }

    function handleSendEmail() {
        Linking.openURL("mailto:hola@twinpro.app?subject=Ayuda%20con%20Panel%20Profesional");
    }

    function toggleFAQ(index: number) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    // Filter FAQs by search and category
    const filteredFAQs = FAQ_ITEMS.filter(
        (item) => {
            const question = t(`helpProDashboard.${item.qKey}`);
            const answer = t(`helpProDashboard.${item.aKey}`);
            const matchesSearch = searchQuery === "" ||
                question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                answer.toLowerCase().includes(searchQuery.toLowerCase());
            const categoryLabel = t(`helpProDashboard.${item.categoryKey}`);
            const matchesCategory = selectedCategory === null || categoryLabel === selectedCategory;
            return matchesSearch && matchesCategory;
        }
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header Negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{t('helpProDashboard.headerTitle')}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <MaterialIcons name="close" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                    {t('helpProDashboard.headerSubtitle')}
                </Text>
            </View>

            {/* Fixed Search Bar */}
            <View style={styles.searchCardFixed}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.primary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('helpProDashboard.searchPlaceholder')}
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== "" && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                >
                    <TouchableOpacity
                        style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text style={[styles.categoryChipText, selectedCategory === null && styles.categoryChipTextActive]}>
                            {t('helpProDashboard.allCategories')}
                        </Text>
                    </TouchableOpacity>
                    {FAQ_CATEGORIES_KEYS.map((catKey) => {
                        const catLabel = t(`helpProDashboard.${catKey}`);
                        return (
                            <TouchableOpacity
                                key={catKey}
                                style={[styles.categoryChip, selectedCategory === catLabel && styles.categoryChipActive]}
                                onPress={() => setSelectedCategory(catLabel)}
                            >
                                <Text style={[styles.categoryChipText, selectedCategory === catLabel && styles.categoryChipTextActive]}>
                                    {catLabel}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Quick Actions */}
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.green50 }, selectedCategory === t('helpProDashboard.catGemelo') && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === t('helpProDashboard.catGemelo') ? null : t('helpProDashboard.catGemelo'))}
                    >
                        <MaterialIcons name="smart-toy" size={24} color={COLORS.green600} />
                        <Text style={styles.quickActionText}>{t('helpProDashboard.quickGemelo')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.purple50 }, selectedCategory === t('helpProDashboard.catCitas') && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === t('helpProDashboard.catCitas') ? null : t('helpProDashboard.catCitas'))}
                    >
                        <MaterialIcons name="calendar-month" size={24} color={COLORS.purple600} />
                        <Text style={styles.quickActionText}>{t('helpProDashboard.quickCitas')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.orange50 }, selectedCategory === t('helpProDashboard.catGanancias') && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === t('helpProDashboard.catGanancias') ? null : t('helpProDashboard.catGanancias'))}
                    >
                        <MaterialIcons name="payments" size={24} color={COLORS.orange600} />
                        <Text style={styles.quickActionText}>{t('helpProDashboard.quickPagos')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.blue50 }, selectedCategory === t('helpProDashboard.catPerfil') && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === t('helpProDashboard.catPerfil') ? null : t('helpProDashboard.catPerfil'))}
                    >
                        <MaterialIcons name="analytics" size={24} color={COLORS.blue600} />
                        <Text style={styles.quickActionText}>{t('helpProDashboard.quickStats')}</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('helpProDashboard.faqTitle')} {selectedCategory && `• ${selectedCategory.toUpperCase()}`}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {filteredFAQs.length} {filteredFAQs.length === 1 ? t('helpProDashboard.result') : t('helpProDashboard.results')}
                    </Text>
                    <View style={styles.faqContainer}>
                        {filteredFAQs.map((item, index) => {
                            const categoryLabel = t(`helpProDashboard.${item.categoryKey}`);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.faqItem}
                                    onPress={() => toggleFAQ(index)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.faqHeader}>
                                        <View style={styles.faqTitleRow}>
                                            <View style={[styles.faqCategoryBadge, getCategoryColor(categoryLabel)]}>
                                                <Text style={styles.faqCategoryText}>{categoryLabel}</Text>
                                            </View>
                                            <MaterialIcons
                                                name={expandedFAQ === index ? "expand-less" : "expand-more"}
                                                size={22}
                                                color={COLORS.gray400}
                                            />
                                        </View>
                                        <Text style={styles.faqQuestion}>{t(`helpProDashboard.${item.qKey}`)}</Text>
                                    </View>
                                    {expandedFAQ === index && (
                                        <Text style={styles.faqAnswer}>{t(`helpProDashboard.${item.aKey}`)}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Guides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpProDashboard.guidesTitle')}</Text>
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
                                    <MaterialIcons name={item.icon} size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.guideInfo}>
                                    <Text style={styles.guideTitle}>{t(`helpProDashboard.${item.titleKey}`)}</Text>
                                    <Text style={styles.guideDuration}>{t(`helpProDashboard.${item.durationKey}`)}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray200} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpProDashboard.needMoreHelp')}</Text>
                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={handleSendEmail}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIcon, styles.contactIconBlue]}>
                            <MaterialIcons name="mail-outline" size={22} color={COLORS.blue600} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>{t('helpProDashboard.contactSupport')}</Text>
                            <Text style={styles.contactHint}>hola@twinpro.app</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.gray400} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL("https://wa.me/34660938312")}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="chat" size={22} color={COLORS.green600} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                            <Text style={styles.contactHint}>+34 660 93 83 12</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Helper to get category color
function getCategoryColor(category: string): { backgroundColor: string } {
    const colors: Record<string, string> = {
        "Gemelo Digital": COLORS.green50,
        "Perfil": COLORS.blue50,
        "Citas": COLORS.purple50,
        "Ganancias": COLORS.yellow50,
        "Dashboard": COLORS.orange50,
        "Atención Directa": "#FEF2F2",
        "Planes": "#F5F3FF",
        "Navegación": COLORS.gray200,
    };
    return { backgroundColor: colors[category] || COLORS.gray200 };
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
        fontSize: 22,
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
        fontSize: 13,
        lineHeight: 20,
    },
    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    // Search
    searchCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchCardFixed: {
        backgroundColor: COLORS.cardLight,
        marginHorizontal: 16,
        marginTop: -20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
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
    // Categories
    categoriesScroll: {
        marginBottom: 16,
        marginHorizontal: -16,
    },
    categoriesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.cardLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray700,
    },
    categoryChipTextActive: {
        color: "#FFFFFF",
    },
    // Quick Actions
    quickActionsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    quickAction: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textLight,
        marginTop: 6,
    },
    quickActionActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
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
        marginBottom: 4,
        marginLeft: 4,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: COLORS.gray400,
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
        padding: 16,
    },
    faqTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    faqCategoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    faqCategoryText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        lineHeight: 20,
    },
    faqAnswer: {
        fontSize: 13,
        color: COLORS.subtextLight,
        lineHeight: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    guideInfo: {
        flex: 1,
    },
    guideTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    guideDuration: {
        fontSize: 11,
        color: COLORS.subtextLight,
        marginTop: 2,
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
        marginBottom: 8,
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
    bottomSpacer: {
        height: 40,
    },
});
