import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, API_HOST, API_PORT } from "../../api";
import { User } from "../../api/user";

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
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    slate900: "#0F172A",
    amber400: "#FBBF24",
    amber500: "#F59E0B",
    green500: "#22C55E",
    indigo100: "#E0E7FF",
    indigo500: "#6366F1",
    rose100: "#FFE4E6",
    rose500: "#F43F5E",
    white: "#FFFFFF",
};

// Mock reviews data - in production this would come from an API
const MOCK_REVIEWS = [
    {
        id: "1",
        userName: "Carlos M.",
        userAvatar: null,
        rating: 5,
        date: "Hace 2 días",
        comment: "Excelente profesional, muy atenta y clara en sus explicaciones. Me ayudó mucho con mi dieta y el plan de rehabilitación fue fácil de seguir. ¡Totalmente recomendada!",
    },
    {
        id: "2",
        userName: "Laura G.",
        userAvatar: null,
        rating: 4,
        date: "Hace 1 semana",
        comment: "Muy buena atención clínica. La doctora sabe mucho y se nota. Lo único es que la espera fue un poco larga para conseguir la cita inicial, pero valió la pena.",
    },
    {
        id: "3",
        userName: "Miguel A.",
        userInitials: "MA",
        rating: 5,
        date: "Hace 2 semanas",
        comment: "Increíble el uso de la tecnología en sus consultas. Me sentí muy cómodo hablando con su avatar digital, la respuesta fue inmediata. 5 estrellas sin duda.",
    },
    {
        id: "4",
        userName: "Sofía R.",
        userInitials: "SR",
        rating: 3,
        date: "Hace 1 mes",
        comment: "La doctora es buena, pero tuve algunos problemas técnicos con la app durante la videollamada. Espero que lo mejoren.",
    },
];

const TRAIT_TAGS = [
    { id: "amable", label: "#Amable", selected: true },
    { id: "experta", label: "#Experta", selected: true },
    { id: "rapida", label: "#Rápida", selected: false },
    { id: "clara", label: "#Clara", selected: false },
    { id: "paciente", label: "#Paciente", selected: false },
    { id: "puntual", label: "#Puntual", selected: false },
];

interface Review {
    id: string;
    userName: string;
    userAvatar?: string | null;
    userInitials?: string;
    rating: number;
    date: string;
    comment: string;
}

export default function ProfessionalReviewsScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews] = useState<Review[]>(MOCK_REVIEWS);

    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        setIsLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, professionalId]);

    useEffect(() => {
        loadProfessional();
    }, [loadProfessional]);

    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return null;
        if (avatar.startsWith("http")) return avatar;
        return `http://${API_HOST}:${API_PORT}/${avatar}`;
    };

    const handleBack = () => {
        router.back();
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <MaterialIcons
                    key={i}
                    name={i <= rating ? "star" : "star-border"}
                    size={16}
                    color={i <= rating ? COLORS.amber400 : COLORS.gray300}
                />
            );
        }
        return stars;
    };

    const renderRatingStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating - fullStars >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(
                    <MaterialIcons key={i} name="star" size={16} color={COLORS.amber500} />
                );
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(
                    <MaterialIcons key={i} name="star-half" size={16} color={COLORS.amber500} />
                );
            } else {
                stars.push(
                    <MaterialIcons key={i} name="star-border" size={16} color={COLORS.amber500} />
                );
            }
        }
        return stars;
    };

    const getInitialsColor = (initials: string) => {
        if (initials === "MA") return { bg: COLORS.indigo100, text: COLORS.indigo500 };
        if (initials === "SR") return { bg: COLORS.rose100, text: COLORS.rose500 };
        return { bg: COLORS.gray100, text: COLORS.gray500 };
    };

    const renderReviewCard = ({ item }: { item: Review }) => {
        const initialsColors = item.userInitials ? getInitialsColor(item.userInitials) : null;

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                        {item.userInitials ? (
                            <View style={[styles.userInitials, { backgroundColor: initialsColors?.bg }]}>
                                <Text style={[styles.initialsText, { color: initialsColors?.text }]}>
                                    {item.userInitials}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.userAvatarContainer}>
                                <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                            </View>
                        )}
                        <View>
                            <Text style={styles.userName}>{item.userName}</Text>
                            <Text style={styles.reviewDate}>{item.date}</Text>
                        </View>
                    </View>
                    <View style={styles.reviewRating}>
                        {renderStars(item.rating)}
                    </View>
                </View>
                <Text style={styles.reviewComment}>"{item.comment}"</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!professional) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Profesional no encontrado</Text>
                <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
                    <Text style={styles.backButtonErrorText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(professional.avatar);
    const displayName = professional.publicName ||
        `${professional.firstname || ""} ${professional.lastname || ""}`.trim() ||
        professional.email?.split("@")[0];

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reseñas del Profesional</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Professional Summary Card */}
                <View style={styles.summaryCard}>
                    {/* Avatar */}
                    <View style={styles.avatarBorder}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={32} color={COLORS.gray400} />
                            </View>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={styles.professionalName}>{displayName}</Text>
                    <Text style={styles.professionalProfession}>
                        {professional.profession || "Profesional"}
                    </Text>

                    {/* Rating Summary */}
                    <View style={styles.ratingSummary}>
                        <Text style={styles.ratingBigNumber}>
                            {(professional.rating || 0).toFixed(1)}
                        </Text>
                        <View style={styles.ratingSummaryRight}>
                            <View style={styles.starsRow}>
                                {renderRatingStars(professional.rating || 0)}
                            </View>
                            <Text style={styles.reviewCountText}>
                                {professional.ratingCount || 0} reseñas
                            </Text>
                        </View>
                    </View>

                    {/* Trait Tags */}
                    <View style={styles.traitsSection}>
                        <Text style={styles.traitsTitle}>
                            ¿Qué define mejor a {displayName?.split(" ")[0]}?
                        </Text>
                        <View style={styles.tagsContainer}>
                            {TRAIT_TAGS.map((tag) => (
                                <View
                                    key={tag.id}
                                    style={[
                                        styles.traitTag,
                                        tag.selected && styles.traitTagSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.traitTagText,
                                        tag.selected && styles.traitTagTextSelected
                                    ]}>
                                        {tag.label}
                                    </Text>
                                    {tag.selected && (
                                        <MaterialIcons name="check" size={14} color={COLORS.textMain} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Sort & Write Review Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.sortButton}>
                        <MaterialIcons name="sort" size={18} color={COLORS.gray500} />
                        <Text style={styles.sortButtonText}>Más recientes</Text>
                        <MaterialIcons name="expand-more" size={16} color={COLORS.gray400} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.writeReviewButton}
                        onPress={() => router.push(`/write-review/${professionalId}`)}
                    >
                        <MaterialIcons name="edit" size={18} color={COLORS.textMain} />
                        <Text style={styles.writeReviewText}>Escribir reseña</Text>
                    </TouchableOpacity>
                </View>

                {/* Reviews List */}
                <View style={styles.reviewsList}>
                    {reviews.map((review) => (
                        <View key={review.id}>
                            {renderReviewCard({ item: review })}
                        </View>
                    ))}
                </View>

                {/* End Message */}
                <View style={styles.endMessage}>
                    <Text style={styles.endMessageText}>
                        Has visto todas las reseñas recientes
                    </Text>
                </View>

                {/* Bottom Padding for Navigation */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos")}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Directorio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Favoritos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/settings")}>
                    <MaterialIcons name="settings" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>Ajustes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.backgroundLight,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.gray500,
        marginBottom: 16,
    },
    backButtonError: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    backButtonErrorText: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerContainer: {
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 2,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    professionalName: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.textMain,
        marginBottom: 2,
    },
    professionalProfession: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 16,
    },
    ratingSummary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    ratingBigNumber: {
        fontSize: 32,
        fontWeight: "900",
        color: COLORS.textMain,
    },
    ratingSummaryRight: {
        alignItems: "flex-start",
        gap: 4,
    },
    starsRow: {
        flexDirection: "row",
    },
    reviewCountText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    traitsSection: {
        width: "100%",
    },
    traitsTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    traitTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    traitTagSelected: {
        backgroundColor: COLORS.primary,
    },
    traitTagText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    traitTagTextSelected: {
        color: COLORS.textMain,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    sortButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    writeReviewButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    writeReviewText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    reviewsList: {
        gap: 12,
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    reviewUser: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    userAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    userInitials: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    initialsText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    userName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    reviewDate: {
        fontSize: 10,
        color: COLORS.gray400,
        fontWeight: "500",
    },
    reviewRating: {
        flexDirection: "row",
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 22,
        fontStyle: "italic",
    },
    endMessage: {
        alignItems: "center",
        paddingVertical: 24,
    },
    endMessageText: {
        fontSize: 12,
        color: COLORS.gray400,
        fontWeight: "500",
    },
    // Bottom Navigation
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    navLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        fontWeight: "500",
    },
});
