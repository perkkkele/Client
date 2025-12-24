import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { professionalApi, API_HOST, API_PORT } from "../../api";
import { Professional } from "../../api/professional";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#000000",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1a190b",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray700: "#334155",
    gray800: "#1E293B",
    slate900: "#0F172A",
    amber100: "#FEF3C7",
    amber500: "#F59E0B",
    amber700: "#B45309",
    green500: "#22C55E",
    blue500: "#3B82F6",
};

const CATEGORIES = [
    { id: "todos", label: "Todos", emoji: "" },
    { id: "legal", label: "Legal", emoji: "⚖️" },
    { id: "salud", label: "Salud", emoji: "🩺" },
    { id: "hogar", label: "Hogar", emoji: "🔧" },
    { id: "educacion", label: "Educación", emoji: "🎓" },
    { id: "fitness", label: "Fitness", emoji: "💪" },
    { id: "tecnologia", label: "Tecnología", emoji: "💻" },
];

const SORT_OPTIONS = [
    { id: "relevance", label: "Relevancia" },
    { id: "distance", label: "Cercanía" },
    { id: "price", label: "Precio" },
    { id: "reviews", label: "Reseñas" },
] as const;

type SortOption = typeof SORT_OPTIONS[number]["id"];

export default function CategoryResultsScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const { token, user } = useAuth();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(category || "legal");
    const [sortBy, setSortBy] = useState<SortOption>("relevance");
    const [searchText, setSearchText] = useState("");

    // Filter modal states
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [filterDistance, setFilterDistance] = useState(15);
    const [filterMaxPrice, setFilterMaxPrice] = useState(80);
    const [filterMinRating, setFilterMinRating] = useState(4);

    const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;

    const loadProfessionals = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const data = await professionalApi.getProfessionalsByCategory(
                token,
                selectedCategory,
                { sortBy }
            );
            setProfessionals(data);
        } catch (error) {
            console.error("Error loading professionals:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedCategory, sortBy]);

    useEffect(() => {
        loadProfessionals();
    }, [loadProfessionals]);

    function handleBack() {
        router.back();
    }

    function handleCategoryChange(newCategory: string) {
        if (newCategory === "todos") {
            router.push("/(tabs)/all-categories");
        } else {
            setSelectedCategory(newCategory);
        }
    }

    function handleContactProfessional(professional: Professional) {
        // TODO: Navigate to chat with professional
        console.log("Contact:", professional.firstname);
    }

    function getAvatarUrl(avatar: string | null | undefined) {
        if (!avatar) return null;
        if (avatar.startsWith("http")) return avatar;
        return `http://${API_HOST}:${API_PORT}/${avatar}`;
    }

    function handleProfilePress() {
        router.push("/(tabs)/settings");
    }

    function renderProfessionalCard({ item }: { item: Professional }) {
        const avatarUrl = getAvatarUrl(item.avatar);
        const fullName = `${item.firstname || ""} ${item.lastname || ""}`.trim();
        const isOnline = item.isOnline;
        const isVerified = item.ratingCount > 10;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.95}
                onPress={() => handleContactProfessional(item)}
            >
                {/* Favorite button */}
                <TouchableOpacity style={styles.favoriteButton}>
                    <MaterialIcons name="favorite-border" size={18} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={28} color={COLORS.gray400} />
                            </View>
                        )}
                    </View>
                    {isOnline && (
                        <View style={styles.onlineBadge}>
                            <MaterialIcons name="bolt" size={10} color="#FFFFFF" />
                        </View>
                    )}
                    {isVerified && !isOnline && (
                        <View style={[styles.onlineBadge, { backgroundColor: COLORS.blue500 }]}>
                            <MaterialIcons name="verified" size={10} color="#FFFFFF" />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.cardContent}>
                    <Text style={styles.cardName} numberOfLines={1}>{fullName || "Profesional"}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description || item.profession || "Profesional"}
                    </Text>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={12} color={COLORS.amber500} />
                        <Text style={styles.ratingText}>
                            {(item.rating || 0).toFixed(1)}
                        </Text>
                    </View>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {item.tags.slice(0, 2).map((tag: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Contact button */}
                <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactProfessional(item)}
                >
                    <Text style={styles.contactButtonText}>Contactar</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    {/* Top bar */}
                    <View style={styles.headerTop}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIcon}>
                                <MaterialIcons name="group" size={24} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.logoText}>TwinPro</Text>
                                <Text style={styles.logoSubtext}>Professional Chat</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.qrButton}>
                            <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.gray400} />
                        </TouchableOpacity>
                    </View>

                    {/* User greeting */}
                    <View style={styles.greetingContainer}>
                        <TouchableOpacity style={styles.userAvatar} onPress={handleProfilePress}>
                            {user?.avatar ? (
                                <Image
                                    source={{ uri: getAvatarUrl(user.avatar) || "" }}
                                    style={styles.userAvatarImage}
                                />
                            ) : (
                                <MaterialIcons name="person" size={28} color={COLORS.gray400} />
                            )}
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.greetingText}>Hola, {user?.firstname || "Usuario"}</Text>
                            <Text style={styles.greetingSubtext}>¿Qué profesional necesitas hoy?</Text>
                        </View>
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={COLORS.gray400} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Derecho penal, laboral, civil..."
                            placeholderTextColor={COLORS.gray400}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity style={styles.micButton}>
                            <MaterialIcons name="mic" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    </View>

                    {/* Category filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesScroll}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === cat.id && styles.categoryButtonActive
                                ]}
                                onPress={() => handleCategoryChange(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategory === cat.id && styles.categoryButtonTextActive
                                ]}>
                                    {cat.emoji} {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </View>

            {/* Main content */}
            <View style={styles.main}>
                {/* Results info */}
                <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                        Resultados basados en tu búsqueda reciente <Text style={styles.resultsTextBold}>"{categoryLabel}"</Text>
                    </Text>
                </View>

                {/* Sort options */}
                <View style={styles.sortContainer}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFiltersModal(true)}
                    >
                        <MaterialIcons name="filter-list" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sortOptions}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.sortOption}
                                onPress={() => setSortBy(option.id)}
                            >
                                <Text style={[
                                    styles.sortOptionText,
                                    sortBy === option.id && styles.sortOptionTextActive
                                ]}>
                                    {option.label}
                                </Text>
                                {sortBy === option.id && (
                                    <MaterialIcons name="arrow-downward" size={14} color={COLORS.textMain} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Professionals grid */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : professionals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="search-off" size={48} color={COLORS.gray400} />
                        <Text style={styles.emptyText}>No se encontraron profesionales</Text>
                        <Text style={styles.emptySubtext}>Intenta con otra categoría</Text>
                    </View>
                ) : (
                    <FlatList
                        data={professionals}
                        renderItem={renderProfessionalCard}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.grid}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Filters Modal */}
            <Modal
                visible={showFiltersModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFiltersModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtros Avanzados</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowFiltersModal(false)}
                            >
                                <MaterialIcons name="close" size={20} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Distance Filter */}
                            <View style={styles.filterSection}>
                                <View style={styles.filterHeader}>
                                    <View style={styles.filterLabelRow}>
                                        <MaterialIcons name="location-on" size={18} color={COLORS.gray500} />
                                        <Text style={styles.filterLabel}>Cercanía</Text>
                                    </View>
                                    <Text style={styles.filterValueText}>
                                        {filterDistance >= 100 ? "Sin Límite" : `${filterDistance} km`}
                                    </Text>
                                </View>
                                <View style={styles.filterOptionsRow}>
                                    {[5, 10, 15, 30, 50, 100].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            style={[
                                                styles.filterOptionButton,
                                                filterDistance === val && styles.filterOptionButtonActive
                                            ]}
                                            onPress={() => setFilterDistance(val)}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                filterDistance === val && styles.filterOptionTextActive
                                            ]}>
                                                {val >= 100 ? "∞" : val}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderLabelText}>0 km</Text>
                                    <Text style={styles.sliderLabelText}>Sin Límite</Text>
                                </View>
                            </View>

                            {/* Price Filter */}
                            <View style={styles.filterSection}>
                                <View style={styles.filterHeader}>
                                    <View style={styles.filterLabelRow}>
                                        <MaterialIcons name="attach-money" size={18} color={COLORS.gray500} />
                                        <Text style={styles.filterLabel}>Precio / hora</Text>
                                    </View>
                                    <Text style={styles.filterValueText}>
                                        {filterMaxPrice >= 200 ? "Máximo Sector" : `Max: ${filterMaxPrice}€`}
                                    </Text>
                                </View>
                                <View style={styles.filterOptionsRow}>
                                    {[20, 40, 60, 80, 120, 200].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            style={[
                                                styles.filterOptionButton,
                                                filterMaxPrice === val && styles.filterOptionButtonActive
                                            ]}
                                            onPress={() => setFilterMaxPrice(val)}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                filterMaxPrice === val && styles.filterOptionTextActive
                                            ]}>
                                                {val >= 200 ? "∞" : val}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderLabelText}>0€</Text>
                                    <Text style={styles.sliderLabelText}>Máximo Sector</Text>
                                </View>
                            </View>

                            {/* Rating Filter */}
                            <View style={styles.filterSection}>
                                <View style={styles.filterHeader}>
                                    <View style={styles.filterLabelRow}>
                                        <MaterialIcons name="star" size={18} color={COLORS.gray500} />
                                        <Text style={styles.filterLabel}>Reseñas mínimas</Text>
                                    </View>
                                    <Text style={styles.filterValueText}>{filterMinRating}.0+</Text>
                                </View>
                                <View style={styles.ratingButtons}>
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <TouchableOpacity
                                            key={rating}
                                            style={[
                                                styles.ratingButton,
                                                filterMinRating === rating && styles.ratingButtonActive
                                            ]}
                                            onPress={() => setFilterMinRating(rating)}
                                        >
                                            <Text style={[
                                                styles.ratingButtonText,
                                                filterMinRating === rating && styles.ratingButtonTextActive
                                            ]}>
                                                {rating}
                                            </Text>
                                            <MaterialIcons
                                                name="star"
                                                size={14}
                                                color={filterMinRating === rating ? "#000000" : COLORS.gray400}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => {
                                    setFilterDistance(15);
                                    setFilterMaxPrice(80);
                                    setFilterMinRating(4);
                                }}
                            >
                                <Text style={styles.resetButtonText}>Restablecer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    setShowFiltersModal(false);
                                    // TODO: Apply filters to the professional list
                                }}
                            >
                                <Text style={styles.applyButtonText}>Aplicar filtros</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        backgroundColor: COLORS.backgroundDark,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
        zIndex: 10,
    },
    headerTop: {
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
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        backgroundColor: COLORS.backgroundDark,
        borderWidth: 3,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    logoSubtext: {
        fontSize: 11,
        color: COLORS.gray400,
        fontWeight: "500",
    },
    qrButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
    },
    greetingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 16,
    },
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    userAvatarImage: {
        width: "100%",
        height: "100%",
    },
    greetingText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    greetingSubtext: {
        fontSize: 14,
        color: COLORS.gray400,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        marginLeft: 8,
    },
    micButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    categoriesScroll: {
        paddingLeft: 24,
    },
    categoriesContainer: {
        gap: 8,
        paddingRight: 24,
    },
    categoryButton: {
        height: 32,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        borderWidth: 1,
        borderColor: COLORS.gray700,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryButtonText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray400,
    },
    categoryButtonTextActive: {
        color: "#000000",
        fontWeight: "bold",
    },
    main: {
        flex: 1,
        paddingTop: 16,
    },
    resultsInfo: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    resultsText: {
        fontSize: 11,
        color: COLORS.gray500,
    },
    resultsTextBold: {
        fontWeight: "bold",
    },
    sortContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 12,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    sortOptions: {
        flexDirection: "row",
        gap: 24,
    },
    sortOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    sortOptionText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.gray400,
    },
    sortOptionTextActive: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    grid: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    card: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    favoriteButton: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    avatarContainer: {
        position: "relative",
        marginTop: 8,
        marginBottom: 12,
    },
    avatarWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: COLORS.gray200,
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
        backgroundColor: COLORS.gray100,
    },
    onlineBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        alignItems: "center",
        width: "100%",
        flex: 1,
    },
    cardName: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.textMain,
        textAlign: "center",
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 10,
        color: COLORS.gray500,
        textAlign: "center",
        marginBottom: 8,
        minHeight: 28,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.amber100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.amber700,
        marginLeft: 2,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 4,
        marginBottom: 12,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: COLORS.gray100,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
    },
    contactButton: {
        width: "100%",
        paddingVertical: 10,
        backgroundColor: COLORS.slate900,
        borderRadius: 12,
        alignItems: "center",
    },
    contactButtonText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        minHeight: 450,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBody: {
        flexGrow: 1,
        marginBottom: 16,
    },
    filterSection: {
        marginBottom: 32,
    },
    filterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    filterLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    filterValueBadge: {
        backgroundColor: "rgba(249, 245, 6, 0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    filterValueText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    filterOptionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 8,
    },
    filterOptionButton: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    filterOptionButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray400,
    },
    filterOptionTextActive: {
        color: "#000000",
    },
    sliderLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sliderLabelText: {
        fontSize: 10,
        color: COLORS.gray400,
        fontWeight: "500",
    },

    ratingButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    ratingButton: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 4,
    },
    ratingButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    ratingButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray400,
    },
    ratingButtonTextActive: {
        color: "#000000",
    },
    modalFooter: {
        flexDirection: "row",
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        marginTop: 16,
    },
    resetButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    applyButton: {
        flex: 2,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.slate900,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
});
