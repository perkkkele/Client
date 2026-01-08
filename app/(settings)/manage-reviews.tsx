import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl, reviewApi } from "../../api";
import type { Review as APIReview } from "../../api/review";

const COLORS = {
    primary: "#FFED00",
    primaryDark: "#E6D500",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#6B7280",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray800: "#1F2937",
    yellow400: "#facc15",
    green50: "#f0fdf4",
    green700: "#15803d",
    lime50: "#f7fee7",
    lime700: "#4d7c0f",
    orange100: "#ffedd5",
    orange600: "#ea580c",
    amber50: "#fffbeb",
    amber500: "#f59e0b",
    blue50: "#eff6ff",
    blue600: "#2563eb",
};

// Avatar colors for initials
const AVATAR_COLORS = [
    { bg: "#ffedd5", text: "#ea580c" },
    { bg: "#f3e8ff", text: "#9333ea" },
    { bg: "#dbeafe", text: "#2563eb" },
    { bg: "#fce7f3", text: "#db2777" },
    { bg: "#ccfbf1", text: "#0d9488" },
    { bg: "#fef3c7", text: "#d97706" },
];

function getAvatarUrl(avatarPath: string | undefined | null): string | null {
    return getAssetUrl(avatarPath ?? undefined);
}

function getInitials(firstname?: string, lastname?: string): string {
    const first = firstname?.charAt(0).toUpperCase() || '';
    const last = lastname?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
}

function getAvatarColor(name: string) {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

interface DisplayReview {
    id: string;
    initials: string;
    name: string;
    authorAvatar?: string | null;
    date: string;
    rating: number;
    comment: string;
    tags: string[];
    avatarColor: { bg: string; text: string };
    hasResponse: boolean;
    response?: string;
}

type SortOption = 'recent' | 'highest' | 'lowest';

const FILTERS: { label: string; value: SortOption }[] = [
    { label: "Más recientes", value: "recent" },
    { label: "Mejor valoradas", value: "highest" },
    { label: "Peor valoradas", value: "lowest" },
];

export default function ManageReviewsScreen() {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<DisplayReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Stats
    const [rating, setRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.publicName || user?.firstname || "Profesional";

    const loadReviews = useCallback(async () => {
        if (!user?._id) return;

        try {
            const response = await reviewApi.getReviewsForProfessional(user._id, sortBy);

            // Transform API reviews to display format
            const displayReviews: DisplayReview[] = response.reviews.map((r: APIReview) => {
                const name = `${r.author.firstname || ''} ${r.author.lastname || ''}`.trim() || 'Usuario';
                return {
                    id: r._id,
                    initials: getInitials(r.author.firstname, r.author.lastname),
                    name,
                    authorAvatar: r.author.avatar,
                    date: formatRelativeDate(r.createdAt),
                    rating: r.rating,
                    comment: r.comment,
                    tags: r.tags || [],
                    avatarColor: getAvatarColor(name),
                    hasResponse: !!(r.reply && r.reply.text && r.reply.text.trim()),
                    response: r.reply?.text?.trim() || '',
                };
            });

            setReviews(displayReviews);
            setRating(response.rating || 0);
            setRatingCount(response.ratingCount || 0);
        } catch (error) {
            console.error("Error loading reviews:", error);
            Alert.alert("Error", "No se pudieron cargar las reseñas");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?._id, sortBy]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadReviews();
    }, [loadReviews]);

    const handleBack = () => {
        router.back();
    };

    const handleSendReply = async (reviewId: string) => {
        if (!token || !replyText.trim()) {
            Alert.alert("Error", "Por favor escribe una respuesta");
            return;
        }

        setIsSendingReply(true);
        try {
            await reviewApi.replyToReview(token, reviewId, replyText.trim());

            // Update local state
            setReviews(prev => prev.map(r =>
                r.id === reviewId
                    ? { ...r, hasResponse: true, response: replyText.trim() }
                    : r
            ));

            setReplyingTo(null);
            setReplyText("");
            Alert.alert("✓ Éxito", "Tu respuesta ha sido publicada");
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo enviar la respuesta");
        } finally {
            setIsSendingReply(false);
        }
    };

    function renderStars(starRating: number) {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                        key={star}
                        name="star"
                        size={18}
                        color={star <= starRating ? COLORS.yellow400 : COLORS.gray200}
                    />
                ))}
            </View>
        );
    }

    function getRatingBadgeStyle(reviewRating: number) {
        if (reviewRating >= 4.5) return { bg: COLORS.green50, text: COLORS.green700 };
        if (reviewRating >= 4.0) return { bg: COLORS.lime50, text: COLORS.lime700 };
        if (reviewRating >= 3.0) return { bg: COLORS.amber50, text: COLORS.amber500 };
        return { bg: COLORS.gray100, text: COLORS.gray500 };
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gestión de Reseñas</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando reseñas...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Reseñas</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {/* Profile Summary */}
                <View style={styles.profileSummary}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <MaterialIcons name="person" size={32} color={COLORS.gray400} />
                            </View>
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <MaterialIcons
                                        key={star}
                                        name={star <= Math.round(rating) ? "star" : "star-border"}
                                        size={20}
                                        color={COLORS.yellow400}
                                    />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.reviewCount}>
                            {ratingCount === 0
                                ? "Sin reseñas todavía"
                                : `Basado en ${ratingCount} ${ratingCount === 1 ? 'reseña' : 'reseñas'}`}
                        </Text>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterButton,
                                sortBy === filter.value && styles.filterButtonActive
                            ]}
                            onPress={() => setSortBy(filter.value)}
                        >
                            <Text style={[
                                styles.filterText,
                                sortBy === filter.value && styles.filterTextActive
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Reviews List */}
                <View style={styles.reviewsList}>
                    {reviews.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="rate-review" size={64} color={COLORS.gray200} />
                            <Text style={styles.emptyTitle}>Sin reseñas</Text>
                            <Text style={styles.emptySubtitle}>
                                Aún no has recibido ninguna reseña. ¡Tus clientes podrán valorar tu servicio después de interactuar contigo!
                            </Text>
                        </View>
                    ) : (
                        reviews.map((review) => {
                            const badgeStyle = getRatingBadgeStyle(review.rating);
                            const authorAvatarUrl = getAvatarUrl(review.authorAvatar);

                            return (
                                <View key={review.id} style={styles.reviewCard}>
                                    {/* Review Header */}
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewUser}>
                                            {authorAvatarUrl ? (
                                                <Image
                                                    source={{ uri: authorAvatarUrl }}
                                                    style={styles.userAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.userInitials, { backgroundColor: review.avatarColor.bg }]}>
                                                    <Text style={[styles.initialsText, { color: review.avatarColor.text }]}>
                                                        {review.initials}
                                                    </Text>
                                                </View>
                                            )}
                                            <View>
                                                <Text style={styles.userName}>{review.name}</Text>
                                                <Text style={styles.reviewDate}>{review.date}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.ratingBadge, { backgroundColor: badgeStyle.bg }]}>
                                            <Text style={[styles.ratingBadgeText, { color: badgeStyle.text }]}>
                                                {review.rating.toFixed(1)}
                                            </Text>
                                            <MaterialIcons name="star" size={12} color={badgeStyle.text} />
                                        </View>
                                    </View>

                                    {/* Stars */}
                                    {renderStars(review.rating)}

                                    {/* Comment */}
                                    <Text style={styles.reviewComment}>{review.comment}</Text>

                                    {/* Tags */}
                                    {review.tags.length > 0 && (
                                        <View style={styles.tagsRow}>
                                            {review.tags.map((tag, i) => (
                                                <View key={i} style={styles.tag}>
                                                    <Text style={styles.tagText}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Response or Reply Section */}
                                    {review.hasResponse ? (
                                        <View style={styles.responseContainer}>
                                            <View style={styles.responseHeader}>
                                                {avatarUrl ? (
                                                    <Image source={{ uri: avatarUrl }} style={styles.responseAvatar} />
                                                ) : (
                                                    <View style={[styles.responseAvatar, styles.avatarPlaceholderSmall]}>
                                                        <MaterialIcons name="person" size={12} color={COLORS.gray400} />
                                                    </View>
                                                )}
                                                <Text style={styles.responseOwner}>
                                                    {displayName} <Text style={styles.ownerLabel}>(Tu respuesta)</Text>
                                                </Text>
                                            </View>
                                            <Text style={styles.responseText}>{review.response}</Text>
                                        </View>
                                    ) : replyingTo === review.id ? (
                                        <View style={styles.replyContainer}>
                                            <View style={styles.replyHeader}>
                                                <MaterialIcons name="reply" size={20} color={COLORS.textMain} />
                                                <Text style={styles.replyTitle}>Responder a la reseña</Text>
                                            </View>
                                            <TextInput
                                                style={styles.replyInput}
                                                placeholder="Escribe tu respuesta aquí..."
                                                placeholderTextColor={COLORS.gray400}
                                                multiline
                                                value={replyText}
                                                onChangeText={setReplyText}
                                                editable={!isSendingReply}
                                            />
                                            <View style={styles.replyActions}>
                                                <TouchableOpacity
                                                    onPress={() => { setReplyingTo(null); setReplyText(""); }}
                                                    disabled={isSendingReply}
                                                >
                                                    <Text style={styles.cancelButton}>Cancelar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.sendButton,
                                                        (!replyText.trim() || isSendingReply) && styles.sendButtonDisabled
                                                    ]}
                                                    onPress={() => handleSendReply(review.id)}
                                                    disabled={!replyText.trim() || isSendingReply}
                                                >
                                                    {isSendingReply ? (
                                                        <ActivityIndicator size="small" color={COLORS.textMain} />
                                                    ) : (
                                                        <Text style={styles.sendButtonText}>Enviar</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.replyButton}
                                            onPress={() => {
                                                console.log('[ManageReviews] Opening reply for:', review.id);
                                                setReplyingTo(review.id);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <MaterialIcons name="reply" size={20} color={COLORS.textMain} />
                                            <Text style={styles.replyButtonText}>Responder a esta reseña</Text>
                                            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Bottom padding */}
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
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
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        flex: 1,
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
    },
    profileSummary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    avatarContainer: {
        padding: 2,
        borderRadius: 36,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarPlaceholderSmall: {
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    ratingValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    starsRow: {
        flexDirection: "row",
        gap: 2,
    },
    reviewCount: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 4,
    },
    filtersScroll: {
        backgroundColor: COLORS.backgroundLight,
        paddingVertical: 12,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    filterButtonActive: {
        backgroundColor: COLORS.textMain,
        borderColor: COLORS.textMain,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    filterTextActive: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    reviewsList: {
        padding: 16,
        gap: 16,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 22,
    },
    reviewCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 12,
        color: COLORS.gray400,
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    ratingBadgeText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 22,
        marginTop: 12,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
        marginBottom: 8,
    },
    tag: {
        backgroundColor: COLORS.blue50,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: COLORS.blue600,
        fontWeight: "500",
    },
    responseContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "rgba(255, 237, 0, 0.08)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 237, 0, 0.2)",
    },
    responseHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    responseAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    responseOwner: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    ownerLabel: {
        color: COLORS.amber500,
        fontWeight: "normal",
    },
    responseText: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 20,
    },
    replyContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
    },
    replyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    replyTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    replyInput: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 80,
        textAlignVertical: "top",
    },
    replyActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 16,
        marginTop: 12,
    },
    cancelButton: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    replyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primaryDark,
    },
    replyButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
});
