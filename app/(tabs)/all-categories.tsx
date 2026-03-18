import { router } from "expo-router";
import { useState, useMemo } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";
import { useTranslation } from 'react-i18next';
import { getCategoriesWithIcons } from '../../utils/categoryUtils';

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#000000",
    surfaceLight: "#ffffff",
    textLight: "#ffffff",
    textMuted: "#94a3b8",
    slate400: "#94a3b8",
    slate700: "#334155",
    slate800: "#1e293b",
    slate900: "#0f172a",
};

interface Category {
    id: string;
    label: string;
    icon: string;
}

function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

export default function AllCategoriesScreen() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const { t } = useTranslation('settings');
    const ALL_CATEGORIES = useMemo(() => getCategoriesWithIcons(t), [t]);

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname || user?.email?.split("@")[0] || t('allCategories.defaultUser');

    function handleBack() {
        router.back();
    }

    function handleCategoryPress(categoryId: string) {
        router.push(`/(tabs)/category-results?category=${categoryId}`);
    }

    function handleProfilePress() {
        router.push("/(tabs)/settings");
    }

    // Filtrar categorías por búsqueda
    const filteredCategories = searchQuery
        ? ALL_CATEGORIES.filter(cat =>
            cat.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : ALL_CATEGORIES;

    return (
        <View style={styles.container}>
            {/* Main content with black background */}
            <SafeAreaView style={styles.mainContent} edges={["top"]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <MaterialIcons name="group" size={24} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.logoTitle}>TwinPro</Text>
                            <Text style={styles.logoSubtitle}>Professional Chat</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.qrButton}>
                        <Ionicons name="qr-code-outline" size={24} color={COLORS.slate400} />
                    </TouchableOpacity>
                </View>

                {/* User greeting */}
                <View style={styles.greetingContainer}>
                    <TouchableOpacity style={styles.avatarButton} onPress={handleProfilePress}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={28} color={COLORS.slate400} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.greetingTextContainer}>
                        <Text style={styles.greetingText}>{t('allCategories.greeting', { name: displayName })}</Text>
                        <Text style={styles.greetingSubtext}>{t('allCategories.greetingSubtext')}</Text>
                    </View>
                </View>

                {/* Search bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <MaterialIcons name="search" size={22} color={COLORS.slate400} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('allCategories.searchPlaceholder')}
                            placeholderTextColor={COLORS.slate400}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity style={styles.filterButton}>
                            <MaterialIcons name="tune" size={20} color={COLORS.slate400} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories grid */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionTitle}>{t('allCategories.sectionTitle')}</Text>

                    <View style={styles.categoriesGrid}>
                        {filteredCategories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryCard}
                                onPress={() => handleCategoryPress(category.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.categoryIconContainer}>
                                    <MaterialIcons name={category.icon as any} size={20} color={COLORS.textMuted} />
                                </View>
                                <Text style={styles.categoryLabel}>{category.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Swipe indicator */}
                <View style={styles.swipeIndicator}>
                    <TouchableOpacity style={styles.swipeButton} onPress={handleBack}>
                        <MaterialIcons name="expand-less" size={30} color={COLORS.slate400} />
                        <Text style={styles.swipeText}>{t('allCategories.swipeToClose')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        overflow: "hidden",
    },
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 24,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logoIcon: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.backgroundDark,
        borderWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    logoTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textLight,
    },
    logoSubtitle: {
        fontSize: 11,
        color: COLORS.slate400,
        fontWeight: "500",
    },
    qrButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.slate800,
        alignItems: "center",
        justifyContent: "center",
    },
    // Greeting
    greetingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 16,
    },
    avatarButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: "hidden",
        backgroundColor: COLORS.slate800,
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    greetingTextContainer: {
        flex: 1,
    },
    greetingText: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.textLight,
    },
    greetingSubtext: {
        fontSize: 14,
        color: COLORS.slate400,
        marginTop: 4,
    },
    // Search
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        height: 48,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.slate800,
    },
    filterButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    // Scroll content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.slate400,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 16,
        marginTop: 8,
    },
    categoriesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    categoryCard: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "rgba(30, 41, 59, 0.4)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.slate700,
        gap: 12,
    },
    categoryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.slate900,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#e2e8f0",
        flex: 1,
    },
    // Swipe indicator
    swipeIndicator: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 32,
        paddingBottom: 12,
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    swipeButton: {
        alignItems: "center",
    },
    swipeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.slate400,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: -4,
    },
});
