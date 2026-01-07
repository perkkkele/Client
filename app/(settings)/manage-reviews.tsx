import { router } from "expo-router";
import { useState } from "react";
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
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
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
    purple100: "#f3e8ff",
    purple600: "#9333ea",
    blue100: "#dbeafe",
    blue600: "#2563eb",
    pink100: "#fce7f3",
    pink600: "#db2777",
    teal100: "#ccfbf1",
    teal600: "#0d9488",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

interface Review {
    id: string;
    initials: string;
    name: string;
    date: string;
    rating: number;
    comment: string;
    tags: string[];
    bgColor: string;
    textColor: string;
    hasResponse?: boolean;
    response?: string;
}

const MOCK_REVIEWS: Review[] = [
    {
        id: "1",
        initials: "JP",
        name: "Juan Pérez",
        date: "Hace 2 días",
        rating: 5.0,
        comment: "Excelente atención, el gemelo digital respondió todas mis dudas antes de la cita. Me sentí muy cómodo y la información fue precisa.",
        tags: ["Amabilidad", "Respuesta rápida"],
        bgColor: COLORS.orange100,
        textColor: COLORS.orange600,
    },
    {
        id: "2",
        initials: "MG",
        name: "María Gómez",
        date: "Hace 1 semana",
        rating: 5.0,
        comment: "Muy profesional y atenta. La plataforma funciona de maravilla y pude agendar mi cita sin complicaciones.",
        tags: ["Profesionalismo"],
        bgColor: COLORS.purple100,
        textColor: COLORS.purple600,
        hasResponse: true,
        response: "¡Muchas gracias María! Me alegra saber que la plataforma te ha sido útil.",
    },
    {
        id: "3",
        initials: "RC",
        name: "Roberto Castillo",
        date: "Hace 2 semanas",
        rating: 4.0,
        comment: "Buena experiencia en general, aunque la respuesta del avatar demoró un poco en cargar al principio.",
        tags: ["Claridad"],
        bgColor: COLORS.blue100,
        textColor: COLORS.blue600,
    },
    {
        id: "4",
        initials: "AL",
        name: "Ana López",
        date: "Hace 3 semanas",
        rating: 5.0,
        comment: "¡Me encantó! La doctora Bárbara siempre es muy atenta y su versión digital captura muy bien su esencia.",
        tags: ["Empatía", "Eficacia"],
        bgColor: COLORS.pink100,
        textColor: COLORS.pink600,
    },
    {
        id: "5",
        initials: "CR",
        name: "Carlos Ruiz",
        date: "Hace 1 mes",
        rating: 5.0,
        comment: "Excelente servicio. Recomendado 100%.",
        tags: [],
        bgColor: COLORS.teal100,
        textColor: COLORS.teal600,
    },
];

const FILTERS = ["Más recientes", "Calificación más alta", "Calificación más baja", "Con fotos"];

export default function ManageReviewsScreen() {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState(0);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.publicName || user?.firstname || "Profesional";

    function handleBack() {
        router.back();
    }

    function renderStars(rating: number) {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                        key={star}
                        name="star"
                        size={18}
                        color={star <= rating ? COLORS.yellow400 : COLORS.gray200}
                    />
                ))}
            </View>
        );
    }

    function getRatingBadgeStyle(rating: number) {
        if (rating >= 4.5) return { bg: COLORS.green50, text: COLORS.green700 };
        if (rating >= 4.0) return { bg: COLORS.lime50, text: COLORS.lime700 };
        return { bg: COLORS.gray100, text: COLORS.gray500 };
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Reseñas</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                            <Text style={styles.ratingValue}>4.9</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <MaterialIcons key={star} name="star" size={20} color={COLORS.yellow400} />
                                ))}
                            </View>
                        </View>
                        <Text style={styles.reviewCount}>Basado en 124 reseñas</Text>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.filterButton,
                                activeFilter === index && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveFilter(index)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === index && styles.filterTextActive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Reviews List */}
                <View style={styles.reviewsList}>
                    {MOCK_REVIEWS.map((review) => {
                        const badgeStyle = getRatingBadgeStyle(review.rating);
                        return (
                            <View key={review.id} style={styles.reviewCard}>
                                {/* Review Header */}
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewUser}>
                                        <View style={[styles.userInitials, { backgroundColor: review.bgColor }]}>
                                            <Text style={[styles.initialsText, { color: review.textColor }]}>
                                                {review.initials}
                                            </Text>
                                        </View>
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
                                                <View style={[styles.responseAvatar, styles.avatarPlaceholder]}>
                                                    <MaterialIcons name="person" size={12} color={COLORS.gray400} />
                                                </View>
                                            )}
                                            <Text style={styles.responseOwner}>
                                                {displayName} <Text style={styles.ownerLabel}>(Propietario)</Text>
                                            </Text>
                                        </View>
                                        <Text style={styles.responseText}>{review.response}</Text>
                                    </View>
                                ) : replyingTo === review.id ? (
                                    <View style={styles.replyContainer}>
                                        <View style={styles.replyHeader}>
                                            <MaterialIcons name="reply" size={20} color={COLORS.primary} />
                                            <Text style={styles.replyTitle}>Responder a la reseña</Text>
                                        </View>
                                        <TextInput
                                            style={styles.replyInput}
                                            placeholder="Escribe tu respuesta aquí..."
                                            placeholderTextColor={COLORS.gray400}
                                            multiline
                                            value={replyText}
                                            onChangeText={setReplyText}
                                        />
                                        <View style={styles.replyActions}>
                                            <TouchableOpacity onPress={() => { setReplyingTo(null); setReplyText(""); }}>
                                                <Text style={styles.cancelButton}>Cancelar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.sendButton}>
                                                <Text style={styles.sendButtonText}>Enviar Respuesta</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.replyFooter}>
                                        <TouchableOpacity
                                            style={styles.replyButton}
                                            onPress={() => setReplyingTo(review.id)}
                                        >
                                            <MaterialIcons name="reply" size={20} color={COLORS.gray500} />
                                            <Text style={styles.replyButtonText}>Responder</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
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
        borderRadius: 34,
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
    reviewCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
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
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    responseContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "rgba(19, 127, 236, 0.05)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(19, 127, 236, 0.1)",
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
        color: COLORS.primary,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    sendButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    replyFooter: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        alignItems: "flex-end",
    },
    replyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    replyButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
});
