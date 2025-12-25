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
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, API_HOST, API_PORT, chatApi } from "../../api";
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
    gray400: "#94A3B8",
    gray500: "#64748B",
    slate900: "#0F172A",
    amber500: "#F59E0B",
    green500: "#22C55E",
    blue500: "#3B82F6",
    blue50: "#EFF6FF",
    blue700: "#1D4ED8",
    red500: "#EF4444",
    white: "#FFFFFF",
};

export default function ProfessionalProfileScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token, user } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        setIsLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);

            // Check if favorite
            const favorites = await userApi.getFavorites(token);
            setIsFavorite(favorites.some(f => f._id === professionalId));
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, professionalId]);

    useEffect(() => {
        loadProfessional();
    }, [loadProfessional]);

    const toggleFavorite = async () => {
        if (!token || !professionalId) return;

        const wasFavorite = isFavorite;
        setIsFavorite(!isFavorite);

        try {
            if (wasFavorite) {
                await userApi.removeFavorite(token, professionalId);
            } else {
                await userApi.addFavorite(token, professionalId);
            }
        } catch (error) {
            setIsFavorite(wasFavorite);
            console.error("Error toggling favorite:", error);
        }
    };

    const handleStartChat = () => {
        if (!professionalId) return;
        router.push(`/avatar-chat/${professionalId}`);
    };

    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return null;
        if (avatar.startsWith("http")) return avatar;
        return `http://${API_HOST}:${API_PORT}/${avatar}`;
    };

    const handleBack = () => {
        router.back();
    };

    const openLink = (url: string | null | undefined) => {
        if (url) {
            Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
        }
    };

    const callPhone = (phone: string | null | undefined) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const sendEmail = (email: string | null | undefined) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        }
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
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(professional.avatar);
    const displayName = professional.publicName ||
        `${professional.firstname || ""} ${professional.lastname || ""}`.trim() ||
        professional.email?.split("@")[0];
    const isOnline = professional.isOnline;

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Perfil del Profesional</Text>
                    <TouchableOpacity style={styles.headerButton} onPress={toggleFavorite}>
                        <MaterialIcons
                            name={isFavorite ? "favorite" : "favorite-border"}
                            size={24}
                            color={isFavorite ? COLORS.red500 : COLORS.gray400}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={48} color={COLORS.gray400} />
                                </View>
                            )}
                        </View>
                        {isOnline !== undefined && (
                            <View style={[
                                styles.onlineIndicator,
                                { backgroundColor: isOnline ? COLORS.green500 : COLORS.gray400 }
                            ]} />
                        )}
                    </View>

                    {/* Name and Profession */}
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.profession}>{professional.profession || "Profesional"}</Text>

                    {/* Rating and Verification */}
                    <View style={styles.badgesRow}>
                        {professional.rating !== undefined && professional.rating > 0 && (
                            <TouchableOpacity
                                style={styles.ratingBadge}
                                onPress={() => router.push(`/reviews/${professionalId}`)}
                            >
                                <MaterialIcons name="star" size={16} color={COLORS.amber500} />
                                <Text style={styles.ratingValue}>{professional.rating.toFixed(1)}</Text>
                                <Text style={styles.ratingCount}>({professional.ratingCount || 0} reseñas)</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={16} color={COLORS.gray500} />
                            <Text style={styles.verifiedText}>Verificado</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleStartChat}>
                            <MaterialIcons name="chat-bubble" size={20} color={COLORS.textMain} />
                            <Text style={styles.primaryButtonText}>Iniciar Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <MaterialIcons name="calendar-month" size={20} color={COLORS.textMain} />
                            <Text style={styles.secondaryButtonText}>Agendar Cita</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>SOBRE MÍ</Text>
                    <Text style={styles.bioText}>
                        {professional.bio || "Este profesional aún no ha añadido una descripción."}
                    </Text>

                    {professional.specialties && professional.specialties.length > 0 && (
                        <>
                            <Text style={styles.subsectionTitle}>Especialidades</Text>
                            <View style={styles.tagsContainer}>
                                {professional.specialties.map((specialty, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{specialty}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* Contact Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>DATOS DE CONTACTO</Text>

                    {professional.phone && (
                        <TouchableOpacity style={styles.contactRow} onPress={() => callPhone(professional.phone)}>
                            <View style={styles.contactIcon}>
                                <MaterialIcons name="call" size={16} color={COLORS.gray500} />
                            </View>
                            <Text style={styles.contactText}>{professional.phone}</Text>
                        </TouchableOpacity>
                    )}

                    {professional.professionalEmail && (
                        <TouchableOpacity style={styles.contactRow} onPress={() => sendEmail(professional.professionalEmail)}>
                            <View style={styles.contactIcon}>
                                <MaterialIcons name="mail" size={16} color={COLORS.gray500} />
                            </View>
                            <Text style={styles.contactText}>{professional.professionalEmail}</Text>
                        </TouchableOpacity>
                    )}

                    {professional.website && (
                        <TouchableOpacity style={styles.contactRow} onPress={() => openLink(professional.website)}>
                            <View style={styles.contactIcon}>
                                <MaterialIcons name="language" size={16} color={COLORS.gray500} />
                            </View>
                            <Text style={styles.contactText}>{professional.website}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Social Links */}
                    {professional.socialLinks && (
                        <View style={styles.socialSection}>
                            <Text style={styles.subsectionTitle}>Redes Sociales</Text>
                            <View style={styles.socialRow}>
                                {professional.socialLinks.linkedin && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: "#E0F2FE" }]}
                                        onPress={() => openLink(professional.socialLinks?.linkedin)}
                                    >
                                        <MaterialIcons name="public" size={20} color="#0369A1" />
                                    </TouchableOpacity>
                                )}
                                {professional.socialLinks.instagram && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: "#FCE7F3" }]}
                                        onPress={() => openLink(professional.socialLinks?.instagram)}
                                    >
                                        <MaterialIcons name="camera-alt" size={20} color="#BE185D" />
                                    </TouchableOpacity>
                                )}
                                {professional.socialLinks.twitter && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: "#DBEAFE" }]}
                                        onPress={() => openLink(professional.socialLinks?.twitter)}
                                    >
                                        <MaterialIcons name="tag" size={20} color="#1D4ED8" />
                                    </TouchableOpacity>
                                )}
                                {professional.socialLinks.facebook && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: "#DBEAFE" }]}
                                        onPress={() => openLink(professional.socialLinks?.facebook)}
                                    >
                                        <MaterialIcons name="facebook" size={20} color="#1D4ED8" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* Schedule Section */}
                {professional.schedule && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>HORARIO LABORAL</Text>
                        <View style={styles.scheduleGrid}>
                            {Object.entries(professional.schedule).map(([day, data]) => (
                                <View key={day} style={styles.scheduleDay}>
                                    <Text style={styles.scheduleDayName}>
                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                    </Text>
                                    <View style={[
                                        styles.scheduleDayBox,
                                        data.enabled ? styles.scheduleDayEnabled : styles.scheduleDayDisabled
                                    ]}>
                                        <Text style={[
                                            styles.scheduleDayText,
                                            data.enabled ? styles.scheduleDayTextEnabled : styles.scheduleDayTextDisabled
                                        ]}>
                                            {data.enabled ? "✓" : "✗"}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reviews Section */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push(`/reviews/${professionalId}`)}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RESEÑAS</Text>
                        <Text style={styles.seeAllLink}>Ver todas</Text>
                    </View>

                    {professional.ratingCount && professional.ratingCount > 0 ? (
                        <View style={styles.reviewPlaceholder}>
                            <MaterialIcons name="rate-review" size={32} color={COLORS.gray400} />
                            <Text style={styles.reviewPlaceholderText}>
                                {professional.ratingCount} reseñas disponibles
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.reviewPlaceholder}>
                            <MaterialIcons name="rate-review" size={32} color={COLORS.gray400} />
                            <Text style={styles.reviewPlaceholderText}>Aún no hay reseñas</Text>
                        </View>
                    )}
                </TouchableOpacity>

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
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    backButtonText: {
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
    profileSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatarBorder: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 116,
        height: 116,
        borderRadius: 58,
    },
    avatarPlaceholder: {
        width: 116,
        height: 116,
        borderRadius: 58,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: COLORS.backgroundLight,
    },
    name: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    profession: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginLeft: 4,
    },
    ratingCount: {
        fontSize: 12,
        color: COLORS.gray500,
        marginLeft: 4,
    },
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    verifiedText: {
        fontSize: 12,
        color: COLORS.gray500,
        marginLeft: 4,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    primaryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        height: 48,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
        letterSpacing: 2,
        marginBottom: 12,
    },
    seeAllLink: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    bioText: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 22,
        marginBottom: 16,
    },
    subsectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tag: {
        backgroundColor: COLORS.blue50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.blue700,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    contactIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    contactText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    socialSection: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 16,
        marginTop: 8,
    },
    socialRow: {
        flexDirection: "row",
        gap: 12,
    },
    socialButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    scheduleGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    scheduleDay: {
        alignItems: "center",
        gap: 4,
    },
    scheduleDayName: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
    },
    scheduleDayBox: {
        width: 40,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    scheduleDayEnabled: {
        backgroundColor: COLORS.primary,
    },
    scheduleDayDisabled: {
        backgroundColor: COLORS.gray100,
    },
    scheduleDayText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    scheduleDayTextEnabled: {
        color: COLORS.textMain,
    },
    scheduleDayTextDisabled: {
        color: COLORS.gray400,
    },
    reviewPlaceholder: {
        alignItems: "center",
        paddingVertical: 20,
    },
    reviewPlaceholderText: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 8,
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
