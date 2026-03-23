import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, getAssetUrl, reviewApi } from "../../api";
import { User } from "../../api/user";
import { Review as APIReview } from "../../api/review";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from "react-i18next";

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

// Opciones de ordenamiento
const SORT_OPTION_KEYS = [
    { id: 'recent', labelKey: 'reviews.sortRecent' },
    { id: 'highest', labelKey: 'reviews.sortHighest' },
    { id: 'lowest', labelKey: 'reviews.sortLowest' },
] as const;

type SortOption = typeof SORT_OPTION_KEYS[number]['id'];

// Helper to format relative date - now accepts t function
function formatRelativeDate(dateString: string, t: any): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('reviews.today');
    if (diffDays === 1) return t('reviews.yesterday');
    if (diffDays < 7) return t('reviews.daysAgo', { count: diffDays });
    const weeks = Math.floor(diffDays / 7);
    if (diffDays < 30) return t('reviews.weeksAgo', { count: weeks });
    const months = Math.floor(diffDays / 30);
    if (diffDays < 365) return t('reviews.monthsAgo', { count: months });
    const years = Math.floor(diffDays / 365);
    return t('reviews.yearsAgo', { count: years });
}

// Helper para obtener iniciales
function getInitials(firstname?: string, lastname?: string): string {
    const first = firstname?.charAt(0).toUpperCase() || '';
    const last = lastname?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
}

interface DisplayReview {
    id: string;
    userName: string;
    userAvatar?: string | null;
    userInitials?: string;
    rating: number;
    date: string;
    comment: string;
    hasReply: boolean;
    replyText?: string;
}

export default function ProfessionalReviewsScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('reviews');
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState<DisplayReview[]>([]);
    const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Owner reply states
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Check if current user is the owner of this profile
    const isOwner = user?._id === professionalId;

    // Cargar profesional
    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        }
    }, [token, professionalId]);

    // Cargar reseñas desde API
    const loadReviews = useCallback(async () => {
        if (!professionalId) return;
        setIsLoading(true);
        try {
            const response = await reviewApi.getReviewsForProfessional(professionalId, sortBy);

            // Transformar reseñas de API al formato de display
            const displayReviews: DisplayReview[] = response.reviews.map((r: APIReview) => ({
                id: r._id,
                userName: `${r.author.firstname || ''} ${r.author.lastname?.charAt(0) || ''}.`.trim(),
                userAvatar: r.author.avatar,
                userInitials: getInitials(r.author.firstname, r.author.lastname),
                rating: r.rating,
                date: formatRelativeDate(r.createdAt, t),
                comment: r.comment,
                hasReply: !!(r.reply && r.reply.text && r.reply.text.trim()),
                replyText: r.reply?.text?.trim() || '',
            }));

            setReviews(displayReviews);
            setTopTags(response.topTags || []);

            // Actualizar rating del profesional si lo tenemos
            if (professional && response.rating !== undefined) {
                setProfessional(prev => prev ? {
                    ...prev,
                    rating: response.rating,
                    ratingCount: response.ratingCount
                } : null);
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setIsLoading(false);
        }
    }, [professionalId, sortBy, professional]);

    useEffect(() => {
        loadProfessional();
    }, [loadProfessional]);

    useEffect(() => {
        loadReviews();
    }, [professionalId, sortBy]);

    const getAvatarUrl = (avatar: string | null | undefined) => {
        return getAssetUrl(avatar ?? undefined);
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
        // Generar color basado en las iniciales para consistencia
        const colors = [
            { bg: COLORS.indigo100, text: COLORS.indigo500 },
            { bg: COLORS.rose100, text: COLORS.rose500 },
            { bg: '#FEF3C7', text: '#D97706' }, // amber
            { bg: '#D1FAE5', text: '#059669' }, // green
            { bg: '#DBEAFE', text: '#2563EB' }, // blue
        ];
        const index = initials.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort);
        setShowSortMenu(false);
    };

    // Handle sending a reply to a review (owner only)
    const handleSendReply = async (reviewId: string) => {
        if (!token || !replyText.trim()) {
            showAlert({ type: 'warning', title: t('reviews.alertEmptyReply'), message: t('reviews.alertEmptyReplyMessage') });
            return;
        }

        setIsSendingReply(true);
        try {
            await reviewApi.replyToReview(token, reviewId, replyText.trim());

            // Update local state
            setReviews(prev => prev.map(r =>
                r.id === reviewId
                    ? { ...r, hasReply: true, replyText: replyText.trim() }
                    : r
            ));

            setReplyingTo(null);
            setReplyText("");
            showAlert({ type: 'success', title: t('reviews.alertReplySuccess'), message: t('reviews.alertReplySuccessMessage') });
        } catch (error: any) {
            showAlert({ type: 'error', title: t('reviews.alertReplyError'), message: error.message || t('reviews.alertReplyErrorMessage') });
        } finally {
            setIsSendingReply(false);
        }
    };

    const renderReviewCard = ({ item }: { item: DisplayReview }) => {
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

                {/* Professional's Reply */}
                {item.hasReply && item.replyText && (
                    <View style={styles.replyContainer}>
                        <View style={styles.replyHeader}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.replyAvatar} />
                            ) : (
                                <View style={styles.replyAvatarPlaceholder}>
                                    <MaterialIcons name="person" size={12} color={COLORS.gray400} />
                                </View>
                            )}
                            <Text style={styles.replyOwner}>
                                {displayName?.split(' ')[0]}
                            </Text>
                        </View>
                        <Text style={styles.replyText}>{item.replyText}</Text>
                    </View>
                )}

                {/* Reply Button/Form - Only for owner and reviews without replies */}
                {isOwner && !item.hasReply && (
                    replyingTo === item.id ? (
                        <View style={styles.replyFormContainer}>
                            <View style={styles.replyFormHeader}>
                                <MaterialIcons name="reply" size={18} color={COLORS.textMain} />
                                <Text style={styles.replyFormTitle}>{t('reviews.replyToReview')}</Text>
                            </View>
                            <TextInput
                                style={styles.replyInput}
                                placeholder={t('reviews.replyPlaceholder')}
                                placeholderTextColor={COLORS.gray400}
                                multiline
                                value={replyText}
                                onChangeText={setReplyText}
                                editable={!isSendingReply}
                            />
                            <View style={styles.replyFormActions}>
                                <TouchableOpacity
                                    onPress={() => { setReplyingTo(null); setReplyText(""); }}
                                    disabled={isSendingReply}
                                >
                                    <Text style={styles.replyCancelButton}>{t('reviews.replyCancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.replySendButton,
                                        (!replyText.trim() || isSendingReply) && styles.replySendButtonDisabled
                                    ]}
                                    onPress={() => handleSendReply(item.id)}
                                    disabled={!replyText.trim() || isSendingReply}
                                >
                                    {isSendingReply ? (
                                        <ActivityIndicator size="small" color={COLORS.textMain} />
                                    ) : (
                                        <Text style={styles.replySendButtonText}>{t('reviews.replySend')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.replyButtonOwner}
                            onPress={() => setReplyingTo(item.id)}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="reply" size={16} color={COLORS.gray500} />
                            <Text style={styles.replyButtonOwnerText}>{t('reviews.replyButton')}</Text>
                        </TouchableOpacity>
                    )
                )}
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
                <Text style={styles.errorText}>{t('reviews.notFound')}</Text>
                <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
                    <Text style={styles.backButtonErrorText}>{t('reviews.goBack')}</Text>
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
                    <Text style={styles.headerTitle}>{t('reviews.headerTitle')}</Text>
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
                        {professional.profession || t('reviews.professionalFallback')}
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
                                {professional.ratingCount || 0} {t('reviews.reviewCount', { count: professional.ratingCount || 0 }).split(' ').slice(1).join(' ')}
                            </Text>
                        </View>
                    </View>

                    {/* Trait Tags - Now from API */}
                    {topTags.length > 0 && (
                        <View style={styles.traitsSection}>
                            <Text style={styles.traitsTitle}>
                                {t('reviews.whatDefines', { name: displayName?.split(" ")[0] })}
                            </Text>
                            <View style={styles.tagsContainer}>
                                {topTags.slice(0, 6).map((tagData, index) => (
                                    <View
                                        key={tagData.tag}
                                        style={[
                                            styles.traitTag,
                                            index < 2 && styles.traitTagSelected
                                        ]}
                                    >
                                        <Text style={[
                                            styles.traitTagText,
                                            index < 2 && styles.traitTagTextSelected
                                        ]}>
                                            #{tagData.tag.charAt(0).toUpperCase() + tagData.tag.slice(1)}
                                        </Text>
                                        {index < 2 && (
                                            <MaterialIcons name="check" size={14} color={COLORS.textMain} />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Sort Menu Dropdown */}
                {showSortMenu && (
                    <View style={styles.sortMenu}>
                        {SORT_OPTION_KEYS.map(option => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.sortMenuItem,
                                    sortBy === option.id && styles.sortMenuItemActive
                                ]}
                                onPress={() => handleSortChange(option.id)}
                            >
                                <Text style={[
                                    styles.sortMenuItemText,
                                    sortBy === option.id && styles.sortMenuItemTextActive
                                ]}>
                                    {t(option.labelKey)}
                                </Text>
                                {sortBy === option.id && (
                                    <MaterialIcons name="check" size={16} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Sort & Write Review Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setShowSortMenu(!showSortMenu)}
                    >
                        <MaterialIcons name="sort" size={18} color={COLORS.gray500} />
                        <Text style={styles.sortButtonText}>
                            {t(SORT_OPTION_KEYS.find(o => o.id === sortBy)?.labelKey || 'reviews.sortRecent')}
                        </Text>
                        <MaterialIcons
                            name={showSortMenu ? "expand-less" : "expand-more"}
                            size={16}
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.writeReviewButton}
                        onPress={() => router.push(`/write-review/${professionalId}`)}
                    >
                        <MaterialIcons name="edit" size={18} color={COLORS.textMain} />
                        <Text style={styles.writeReviewText}>{t('reviews.writeReview')}</Text>
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
                        {t('reviews.endMessage')}
                    </Text>
                </View>

                {/* Bottom Padding for Navigation */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>{t('reviews.navChats')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos")}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>{t('reviews.navDirectory')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>{t('reviews.navFavorites')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/settings")}>
                    <MaterialIcons name="settings" size={24} color={COLORS.gray500} />
                    <Text style={styles.navLabel}>{t('reviews.navSettings')}</Text>
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
        color: "#b45309", // amber-700 for better contrast
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
    // Sort Menu Dropdown
    sortMenu: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 12,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sortMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    sortMenuItemActive: {
        backgroundColor: COLORS.gray100,
    },
    sortMenuItemText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    sortMenuItemTextActive: {
        color: COLORS.textMain,
        fontWeight: "bold",
    },
    // Professional Reply Styles
    replyContainer: {
        marginTop: 16,
        padding: 14,
        backgroundColor: "rgba(249, 245, 6, 0.08)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(249, 245, 6, 0.2)",
    },
    replyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    replyAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    replyOwner: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    ownerLabel: {
        color: COLORS.amber500,
        fontWeight: "normal",
    },
    replyText: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 20,
    },
    // Owner Reply Form Styles
    replyFormContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
    },
    replyFormHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    replyFormTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    replyInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 80,
        textAlignVertical: "top",
    },
    replyFormActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 16,
        marginTop: 12,
    },
    replyCancelButton: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    replySendButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    replySendButtonDisabled: {
        opacity: 0.5,
    },
    replySendButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    replyButtonOwner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        marginTop: 12,
        paddingVertical: 8,
    },
    replyButtonOwnerText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.gray500,
    },
});
