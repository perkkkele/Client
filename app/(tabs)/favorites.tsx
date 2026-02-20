import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import * as userApi from "../../api/user";
import { getAssetUrl } from "../../api";
import { useAlert } from "../../components/TwinProAlert";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    slate900: "#0f172a",
    slate800: "#1e293b",
    slate700: "#334155",
    slate600: "#475569",
    slate500: "#64748b",
    slate400: "#94a3b8",
    slate200: "#e2e8f0",
    slate100: "#f1f5f9",
    gray100: "#f3f4f6",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    amber400: "#fbbf24",
    amber500: "#f59e0b",
    red500: "#ef4444",
    green500: "#22c55e",
    textMain: "#1e293b",
    white: "#FFFFFF",
};

interface Favorite {
    _id: string;
    firstname?: string;
    lastname?: string;
    publicName?: string;
    profession?: string;
    avatar?: string;
    rating?: number;
    isOnline?: boolean;
}

export default function FavoritesScreen() {
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const loadFavorites = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const data = await userApi.getFavorites(token);
            console.log('[FavoritesScreen] Loaded favorites:', data.length);
            setFavorites(data as Favorite[]);
        } catch (error: any) {
            console.error("Error loading favorites:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Reload favorites whenever the screen receives focus
    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites])
    );

    const handleRemoveFavorite = async (professionalId: string) => {
        if (!token) return;

        try {
            await userApi.removeFavorite(token, professionalId);
            setFavorites(prev => prev.filter(f => f._id !== professionalId));
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar de favoritos. Inténtalo de nuevo.' });
        }
    };

    const getAvatarUrl = (avatar?: string): string | undefined => {
        return getAssetUrl(avatar) ?? undefined;
    };

    const getDisplayName = (professional: Favorite) => {
        if (professional.publicName) return professional.publicName;
        if (professional.firstname && professional.lastname) {
            return `${professional.firstname} ${professional.lastname.charAt(0)}.`;
        }
        return professional.firstname || "Profesional";
    };

    const filteredFavorites = favorites.filter(fav => {
        if (!searchText) return true;
        const name = getDisplayName(fav).toLowerCase();
        const profession = (fav.profession || "").toLowerCase();
        const search = searchText.toLowerCase();
        return name.includes(search) || profession.includes(search);
    });

    const renderFavoriteCard = ({ item }: { item: Favorite }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.95}
            onPress={() => router.push(`/professional/${item._id}`)}
        >
            {/* Favorite button */}
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleRemoveFavorite(item._id)}
            >
                <MaterialIcons name="favorite" size={18} color={COLORS.red500} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatarBorder}>
                    {item.avatar ? (
                        <Image
                            source={{ uri: getAvatarUrl(item.avatar) }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <MaterialIcons name="person" size={32} color={COLORS.slate400} />
                        </View>
                    )}
                </View>
                {/* Online indicator */}
                <View style={[
                    styles.onlineIndicator,
                    { backgroundColor: item.isOnline ? COLORS.green500 : COLORS.gray400 }
                ]} />
            </View>

            {/* Name */}
            <Text style={styles.cardName}>{getDisplayName(item)}</Text>

            {/* Profession tag */}
            <View style={styles.professionTag}>
                <Text style={styles.professionText}>
                    {item.profession || "Profesional"}
                </Text>
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color={COLORS.amber500} />
                <Text style={styles.ratingText}>
                    {item.rating?.toFixed(1) || "0.0"}
                </Text>
            </View>

            {/* Contact button */}
            <TouchableOpacity
                style={styles.contactButton}
                onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/avatar-chat/${item._id}`);
                }}
            >
                <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MaterialIcons name="favorite-border" size={48} color={COLORS.slate400} />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
            <Text style={styles.emptySubtitle}>
                Explora el directorio y guarda tus profesionales de confianza
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push("/(tabs)/category-results")}
            >
                <Text style={styles.exploreButtonText}>Explorar Directorio</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAddCard = () => (
        <TouchableOpacity
            style={styles.addCard}
            onPress={() => router.push("/(tabs)/category-results")}
        >
            <View style={styles.addIconContainer}>
                <MaterialIcons name="add" size={32} color={COLORS.slate400} />
            </View>
            <Text style={styles.addCardText}>Explorar más profesionales</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
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
                        <TouchableOpacity style={styles.qrButton} onPress={() => router.push("/(tabs)/qr-scanner")}>
                            <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.slate400} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Mis Favoritos</Text>
                        <Text style={styles.subtitle}>
                            Tus profesionales de confianza, siempre a mano
                        </Text>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={24} color={COLORS.slate400} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar en mis favoritos..."
                            placeholderTextColor={COLORS.slate400}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </SafeAreaView>
            </View>

            {/* Content */}
            <View style={styles.main}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : favorites.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={[...filteredFavorites, { _id: "_add_card" }]}
                        renderItem={({ item }) =>
                            item._id === "_add_card"
                                ? renderAddCard()
                                : renderFavoriteCard({ item: item as Favorite })
                        }
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.grid}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Bottom Navigation */}
            <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.slate500} />
                    <Text style={styles.navLabel}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos")}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.slate500} />
                    <Text style={styles.navLabel}>Directorio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <View style={styles.navItemActive}>
                        <MaterialIcons name="favorite" size={24} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.navLabelActive}>Favoritos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => {
                    if (user?.userType === 'userpro') {
                        router.push("/(tabs)/pro-dashboard");
                    } else {
                        router.push("/(tabs)/become-pro");
                    }
                }}>
                    <MaterialIcons name="badge" size={24} color={COLORS.slate500} />
                    <Text style={styles.navLabel}>Perfil Pro</Text>
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
    header: {
        backgroundColor: COLORS.backgroundDark,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
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
        borderRadius: 12,
        borderTopRightRadius: 16,
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
        color: COLORS.white,
    },
    logoSubtext: {
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
    titleContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    title: {
        fontSize: 30,
        fontWeight: "800",
        color: COLORS.white,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.slate400,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginHorizontal: 24,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.white,
        fontWeight: "500",
    },
    main: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    grid: {
        paddingBottom: 120,
    },
    card: {
        width: "48%",
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    favoriteButton: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.slate100,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatarBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 4,
        borderWidth: 2,
        borderColor: "rgba(249, 245, 6, 0.3)",
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: 36,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.slate100,
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    cardName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
        textAlign: "center",
        marginBottom: 4,
    },
    professionTag: {
        backgroundColor: COLORS.slate100,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 8,
    },
    professionText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.slate600,
        textTransform: "uppercase",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 16,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.slate600,
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
        color: COLORS.white,
    },
    addCard: {
        width: "48%",
        minHeight: 240,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.slate200,
        borderRadius: 24,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    addIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.slate100,
        alignItems: "center",
        justifyContent: "center",
    },
    addCardText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.slate500,
        textAlign: "center",
        paddingHorizontal: 16,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.slate100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.slate500,
        textAlign: "center",
        marginBottom: 24,
    },
    exploreButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: COLORS.slate900,
        borderRadius: 12,
    },
    exploreButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
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
    navItemActive: {
        width: 48,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(249, 245, 6, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    navLabel: {
        fontSize: 11,
        color: COLORS.slate500,
        fontWeight: "500",
    },
    navLabelActive: {
        fontSize: 11,
        color: COLORS.textMain,
        fontWeight: "bold",
    },
});
