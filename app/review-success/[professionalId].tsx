import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, getAssetUrl } from "../../api";
import { User } from "../../api/user";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#000000",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray700: "#374151",
    slate900: "#0F172A",
    green500: "#22C55E",
    yellow50: "#FEFCE8",
    yellow800: "#854D0E",
    blue100: "#DBEAFE",
    blue600: "#2563EB",
    white: "#FFFFFF",
};

export default function ReviewSuccessScreen() {
    const { professionalId, rating, comment, tags } = useLocalSearchParams<{
        professionalId: string;
        rating: string;
        comment: string;
        tags: string;
    }>();
    const { token } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Animation values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeUpAnim = useRef(new Animated.Value(0)).current;
    const starPopAnim = useRef(new Animated.Value(0)).current;
    const thumbPopAnim = useRef(new Animated.Value(0)).current;

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

    useEffect(() => {
        // Start animations
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeUpAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.spring(starPopAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 60,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(thumbPopAnim, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const getAvatarUrl = (avatar: string | null | undefined) => {
        return getAssetUrl(avatar ?? undefined);
    };

    const handleClose = () => {
        router.back();
    };

    const handleExplore = () => {
        router.replace("/(tabs)/category-results?category=todos");
    };

    const handleGoHome = () => {
        router.replace("/(tabs)");
    };

    const renderStars = (ratingValue: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <MaterialIcons
                    key={i}
                    name="star"
                    size={16}
                    color={i <= ratingValue ? COLORS.primary : COLORS.gray300}
                />
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

    const avatarUrl = getAvatarUrl(professional?.avatar);
    const displayName = professional?.publicName ||
        `${professional?.firstname || ""} ${professional?.lastname || ""}`.trim() ||
        professional?.email?.split("@")[0] || "Profesional";
    const ratingValue = parseInt(rating || "0", 10);
    const selectedTags = tags ? tags.split(",") : [];
    const reviewComment = comment || "";

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <MaterialIcons name="close" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Success Icon */}
                <Animated.View style={[
                    styles.successIconContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                    }
                ]}>
                    <View style={styles.glowBackground} />
                    <View style={styles.successIconOuter}>
                        <View style={styles.successIconInner}>
                            <MaterialIcons name="check" size={48} color={COLORS.white} />
                        </View>
                        {/* Star decoration */}
                        <Animated.View style={[
                            styles.starDecoration,
                            {
                                transform: [{ scale: starPopAnim }],
                            }
                        ]}>
                            <MaterialIcons name="star" size={18} color={COLORS.textMain} />
                        </Animated.View>
                        {/* Thumb decoration */}
                        <Animated.View style={[
                            styles.thumbDecoration,
                            {
                                transform: [{ scale: thumbPopAnim }],
                            }
                        ]}>
                            <MaterialIcons name="thumb-up" size={14} color={COLORS.blue600} />
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Success Message */}
                <Animated.View style={[
                    styles.messageContainer,
                    {
                        opacity: fadeUpAnim,
                        transform: [{
                            translateY: fadeUpAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            })
                        }]
                    }
                ]}>
                    <Text style={styles.successTitle}>¡Reseña Publicada!</Text>
                    <Text style={styles.successMessage}>
                        Gracias por tu valiosa opinión. Tu reseña ayuda a otros usuarios de nuestra comunidad a tomar mejores decisiones.
                    </Text>

                    {/* Points Badge */}
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsEmoji}>🎉</Text>
                        <Text style={styles.pointsText}>+50 Puntos ganados</Text>
                    </View>
                </Animated.View>

                {/* Review Preview Card */}
                <Animated.View style={[
                    styles.reviewPreviewCard,
                    {
                        opacity: fadeUpAnim,
                        transform: [{
                            translateY: fadeUpAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            })
                        }]
                    }
                ]}>
                    <View style={styles.reviewPreviewHeader}>
                        <View style={styles.professionalAvatar}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={24} color={COLORS.gray400} />
                                </View>
                            )}
                            <View style={styles.verifiedBadgeSmall}>
                                <MaterialIcons name="check" size={8} color={COLORS.textMain} />
                            </View>
                        </View>
                        <View style={styles.professionalInfo}>
                            <Text style={styles.professionalName}>{displayName}</Text>
                            <View style={styles.starsRow}>
                                {renderStars(ratingValue)}
                            </View>
                        </View>
                    </View>

                    {selectedTags.length > 0 && (
                        <View style={styles.tagsRow}>
                            {selectedTags.slice(0, 2).map((tag, index) => (
                                <View key={index} style={styles.tagBadge}>
                                    <Text style={styles.tagBadgeText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {reviewComment && (
                        <Text style={styles.reviewPreviewText}>
                            "{reviewComment.length > 80 ? reviewComment.substring(0, 80) + "..." : reviewComment}"
                        </Text>
                    )}
                </Animated.View>
            </View>

            {/* Bottom Buttons */}
            <Animated.View style={[
                styles.buttonsContainer,
                {
                    opacity: fadeUpAnim,
                }
            ]}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleExplore}>
                    <Text style={styles.primaryButtonText}>Explorar más profesionales</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                    <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
                </TouchableOpacity>
            </Animated.View>
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
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    closeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        marginTop: -40,
    },
    successIconContainer: {
        position: "relative",
        marginBottom: 32,
    },
    glowBackground: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: COLORS.primary,
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    successIconOuter: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 4,
        borderColor: COLORS.gray100,
    },
    successIconInner: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.green500,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.green500,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    starDecoration: {
        position: "absolute",
        top: -8,
        right: -8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    thumbDecoration: {
        position: "absolute",
        bottom: 8,
        left: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.blue100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    messageContainer: {
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    successMessage: {
        fontSize: 16,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 16,
    },
    pointsBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.yellow50,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${COLORS.primary}33`,
        gap: 8,
    },
    pointsEmoji: {
        fontSize: 18,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.yellow800,
    },
    reviewPreviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    reviewPreviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    professionalAvatar: {
        position: "relative",
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    verifiedBadgeSmall: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    professionalInfo: {
        flex: 1,
    },
    professionalName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: "row",
    },
    tagsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    tagBadge: {
        backgroundColor: `${COLORS.primary}33`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${COLORS.primary}33`,
    },
    tagBadgeText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.yellow800,
    },
    reviewPreviewText: {
        fontSize: 12,
        color: COLORS.gray500,
        fontStyle: "italic",
    },
    buttonsContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.slate900,
        height: 56,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    secondaryButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
});
