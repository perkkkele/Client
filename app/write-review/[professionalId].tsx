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
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, getAssetUrl, reviewApi } from "../../api";
import { User } from "../../api/user";
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
    white: "#FFFFFF",
};

const RATING_LABELS_KEYS = ["", "ratingLabels.1", "ratingLabels.2", "ratingLabels.3", "ratingLabels.4", "ratingLabels.5"];

const TRAIT_TAG_KEYS = [
    { id: "amable", labelKey: "traitKind" },
    { id: "experto", labelKey: "traitExpert" },
    { id: "rapido", labelKey: "traitFast" },
    { id: "claro", labelKey: "traitClear" },
    { id: "paciente", labelKey: "traitPatient" },
    { id: "divertido", labelKey: "traitFun" },
];

const MAX_COMMENT_LENGTH = 300;

export default function WriteReviewScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('reviews');
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review form state
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [comment, setComment] = useState("");
    const [customTag, setCustomTag] = useState("");

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
        return getAssetUrl(avatar ?? undefined);
    };

    const handleBack = () => {
        router.back();
    };

    const handleStarPress = (starIndex: number) => {
        setRating(starIndex);
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tagId)) {
                newSet.delete(tagId);
            } else {
                newSet.add(tagId);
            }
            return newSet;
        });
    };

    const handleSubmit = async () => {
        if (!token) {
            showAlert({ type: 'warning', title: t('writeReview.alertSessionTitle'), message: t('writeReview.alertSessionMessage') });
            return;
        }

        if (rating === 0) {
            showAlert({ type: 'warning', title: t('writeReview.alertRatingTitle'), message: t('writeReview.alertRatingMessage') });
            return;
        }

        if (comment.trim().length < 10) {
            showAlert({ type: 'warning', title: t('writeReview.alertShortTitle'), message: t('writeReview.alertShortMessage') });
            return;
        }

        setIsSubmitting(true);

        try {
            // Preparar tags incluyendo customTag si existe
            const allTags = Array.from(selectedTags);
            if (customTag.trim()) {
                allTags.push(customTag.trim().toLowerCase());
            }

            // Llamada real a la API
            await reviewApi.createReview(token, {
                professionalId,
                rating,
                comment: comment.trim(),
                tags: allTags
            });

            // Navigate to success screen with review data
            const tagsString = allTags.join(",");
            router.replace(`/review-success/${professionalId}?rating=${rating}&comment=${encodeURIComponent(comment)}&tags=${encodeURIComponent(tagsString)}`);
        } catch (error: any) {
            console.error("Error submitting review:", error);
            showAlert({ type: 'error', title: t('writeReview.alertErrorTitle'), message: error.message || t('writeReview.alertErrorMessage') });
            setIsSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleStarPress(i)}
                    style={styles.starButton}
                >
                    <MaterialIcons
                        name={i <= rating ? "star" : "star-border"}
                        size={40}
                        color={i <= rating ? COLORS.primary : COLORS.gray300}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
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
                <Text style={styles.errorText}>{t('writeReview.notFound')}</Text>
                <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
                    <Text style={styles.backButtonErrorText}>{t('writeReview.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(professional.avatar);
    const displayName = professional.publicName ||
        `${professional.firstname || ""} ${professional.lastname || ""}`.trim() ||
        professional.email?.split("@")[0];
    const firstName = displayName?.split(" ")[0];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('writeReview.headerTitle')}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Professional Info */}
                <View style={styles.professionalSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={40} color={COLORS.gray400} />
                                </View>
                            )}
                        </View>
                        <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={16} color={COLORS.textMain} />
                        </View>
                    </View>
                    <Text style={styles.professionalName}>{displayName}</Text>
                    <Text style={styles.professionalProfession}>
                        {professional.profession || t('writeReview.professionalFallback')}
                    </Text>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>{t('writeReview.yourRating')}</Text>
                    <View style={styles.starsContainer}>
                        {renderStars()}
                    </View>
                    {rating > 0 && (
                        <View style={styles.ratingLabelContainer}>
                            <Text style={styles.ratingLabel}>{t(`writeReview.ratingLabels.${rating}`)}</Text>
                        </View>
                    )}
                </View>

                {/* Trait Tags */}
                <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitleLeft}>
                        {t('writeReview.whatDefines', { name: firstName })}
                    </Text>
                    <View style={styles.tagsContainer}>
                        {TRAIT_TAG_KEYS.map((tag) => (
                            <TouchableOpacity
                                key={tag.id}
                                style={[
                                    styles.tagButton,
                                    selectedTags.has(tag.id) && styles.tagButtonSelected
                                ]}
                                onPress={() => toggleTag(tag.id)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    selectedTags.has(tag.id) && styles.tagTextSelected
                                ]}>
                                    {t(`writeReview.${tag.labelKey}`)}
                                </Text>
                                {selectedTags.has(tag.id) && (
                                    <MaterialIcons name="check" size={14} color={COLORS.textMain} />
                                )}
                            </TouchableOpacity>
                        ))}
                        {/* Custom tag input */}
                        <View style={styles.customTagContainer}>
                            <Text style={styles.customTagPrefix}>#</Text>
                            <TextInput
                                style={styles.customTagInput}
                                value={customTag}
                                onChangeText={setCustomTag}
                                placeholder=""
                                placeholderTextColor={COLORS.gray400}
                                maxLength={15}
                            />
                        </View>
                    </View>
                </View>

                {/* Comment Input */}
                <View style={styles.commentSection}>
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            value={comment}
                            onChangeText={setComment}
                            placeholder={t('writeReview.commentPlaceholder')}
                            placeholderTextColor={COLORS.gray400}
                            multiline
                            maxLength={MAX_COMMENT_LENGTH}
                            textAlignVertical="top"
                        />
                        <View style={styles.commentFooter}>
                            <View style={styles.tipContainer}>
                                <MaterialIcons name="lightbulb" size={14} color={COLORS.primary} />
                                <Text style={styles.tipText}>{t('writeReview.tipText')}</Text>
                            </View>
                            <View style={styles.charCountContainer}>
                                <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT_LENGTH}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>{t('writeReview.submitButton')}</Text>
                            <MaterialIcons name="send" size={18} color={COLORS.primary} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
    },
    professionalSection: {
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 8,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatarBorder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: COLORS.white,
        overflow: "hidden",
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: 48,
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        borderRadius: 48,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.backgroundLight,
        alignItems: "center",
        justifyContent: "center",
    },
    professionalName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 2,
    },
    professionalProfession: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    ratingSection: {
        alignItems: "center",
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    sectionTitleLeft: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
        paddingLeft: 4,
    },
    starsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingLabelContainer: {
        backgroundColor: `${COLORS.primary}33`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    ratingLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.textMain,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    tagsSection: {
        paddingVertical: 16,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tagButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    tagButtonSelected: {
        backgroundColor: COLORS.primary,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    tagTextSelected: {
        color: COLORS.textMain,
    },
    customTagContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        paddingLeft: 12,
        paddingRight: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        minWidth: 80,
    },
    customTagPrefix: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
    },
    customTagInput: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray500,
        paddingVertical: 0,
        paddingHorizontal: 4,
        minWidth: 50,
    },
    commentSection: {
        paddingVertical: 8,
        flex: 1,
    },
    commentInputContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16,
        paddingBottom: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 200,
    },
    commentInput: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 22,
        minHeight: 120,
    },
    commentFooter: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tipContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.backgroundLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    tipText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    charCountContainer: {
        backgroundColor: `${COLORS.white}80`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    charCount: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray400,
    },
    submitContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 50,
        backgroundColor: COLORS.backgroundLight,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.slate900,
        height: 48,
        borderRadius: 24,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },
});
