import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { API_HOST, API_PORT, chatApi, professionalApi } from "../../api";
import type { Chat } from "../../api/chat";
import type { Professional } from "../../api/professional";
import { useAuth } from "../../context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Colores del tema TwinPro
const COLORS = {
  primary: "#f9f506",
  backgroundLight: "#f8f8f5",
  backgroundDark: "#23220f",
  cardDark: "#1a190b",
  black: "#000000",
  white: "#ffffff",
  gray: "#64748b",
  grayLight: "#94a3b8",
};

// Categorías disponibles
const CATEGORIES = [
  { id: "todos", label: "Todos", emoji: "" },
  { id: "legal", label: "Legal", emoji: "⚖️" },
  { id: "salud", label: "Salud", emoji: "🩺" },
  { id: "hogar", label: "Hogar", emoji: "🔧" },
  { id: "educacion", label: "Educación", emoji: "🎓" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
];

// Colores por categoría para los badges
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  legal: { bg: "#f1f5f9", text: "#475569" },
  salud: { bg: "#dbeafe", text: "#1d4ed8" },
  hogar: { bg: "#fef3c7", text: "#b45309" },
  educacion: { bg: "#dcfce7", text: "#15803d" },
  fitness: { bg: "#ffedd5", text: "#c2410c" },
  otros: { bg: "#f3e8ff", text: "#7e22ce" },
};

// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

// Helper to format relative time
function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) {
    // Mostrar hora del día
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function TwinProHomeScreen() {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [featuredProfessionals, setFeaturedProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [chatsData, professionalsData] = await Promise.all([
        chatApi.getChats(token),
        professionalApi.getFeaturedProfessionals(token),
      ]);
      setChats(chatsData);
      setFeaturedProfessionals(professionalsData);
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  function getChatPartner(chat: Chat) {
    const p1 = chat.participant_one;
    const p2 = chat.participant_two;
    const p1Id = typeof p1 === "string" ? p1 : p1?._id;
    const p2Id = typeof p2 === "string" ? p2 : p2?._id;

    if (p1Id !== user?._id && typeof p1 !== "string") {
      return p1;
    }
    if (p2Id !== user?._id && typeof p2 !== "string") {
      return p2;
    }
    return null;
  }

  function getUserDisplayName() {
    if (user?.firstname) return user.firstname;
    if (user?.email) return user.email.split("@")[0];
    return "Usuario";
  }

  // Renderizar profesional destacado (carrusel horizontal)
  function renderFeaturedProfessional({ item }: { item: Professional }) {
    const avatarUrl = getAvatarUrl(item.avatar);
    const isOnline = item.isOnline;

    return (
      <TouchableOpacity
        style={styles.featuredItem}
        onPress={() => {
          // TODO: Navegar a chat con profesional
        }}
      >
        <View style={styles.featuredAvatarContainer}>
          <View style={[styles.featuredAvatarBorder, isOnline && styles.featuredAvatarBorderActive]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.featuredAvatar} />
            ) : (
              <View style={styles.featuredAvatarPlaceholder}>
                <MaterialIcons name="person" size={28} color={COLORS.gray} />
              </View>
            )}
          </View>
          {isOnline !== undefined && (
            <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? "#22c55e" : "#f59e0b" }]} />
          )}
        </View>
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.firstname || item.email?.split("@")[0]}
        </Text>
        <Text style={styles.featuredProfession} numberOfLines={1}>
          {item.profession || "Profesional"}
        </Text>
      </TouchableOpacity>
    );
  }

  // Renderizar chat reciente
  function renderRecentChat({ item }: { item: Chat }) {
    const partner = getChatPartner(item);
    const avatarUrl = getAvatarUrl(partner?.avatar);
    const categoryColors = CATEGORY_COLORS[partner?.category || "otros"] || CATEGORY_COLORS.otros;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/${item._id}`)}
        activeOpacity={0.95}
      >
        <View style={styles.chatAvatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.chatAvatar} />
          ) : (
            <View style={styles.chatAvatarPlaceholder}>
              <MaterialIcons name="person" size={28} color={COLORS.gray} />
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>
              {partner?.firstname
                ? `${partner.firstname}${partner.lastname ? ` ${partner.lastname.charAt(0)}.` : ""}`
                : partner?.email || "Usuario"}
            </Text>
            <Text style={styles.chatTime}>{formatRelativeTime(item.last_message_date)}</Text>
          </View>

          <View style={styles.chatMeta}>
            {partner?.profession && (
              <View style={[styles.professionBadge, { backgroundColor: categoryColors.bg }]}>
                <Text style={[styles.professionBadgeText, { color: categoryColors.text }]}>
                  {partner.profession.toUpperCase()}
                </Text>
              </View>
            )}
            {partner?.rating !== undefined && partner.rating > 0 && (
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={12} color="#fbbf24" />
                <Text style={styles.ratingText}>{partner.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.last_message || "Toca para ver mensajes..."}
          </Text>
        </View>

        <View style={styles.chatActions}>
          {/* Badge de mensajes no leídos - placeholder */}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header negro con bordes redondeados */}
      <View style={styles.headerContainer}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="group" size={24} color={COLORS.black} />
            </View>
            <View>
              <Text style={styles.logoTitle}>TwinPro</Text>
              <Text style={styles.logoSubtitle}>Professional Chat</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={28} color={COLORS.grayLight} />
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Saludo */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hola, {getUserDisplayName()}</Text>
          <Text style={styles.greetingSubtext}>¿Qué profesional necesitas hoy?</Text>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={22} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar abogado, médico..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterButton}>
              <MaterialIcons name="tune" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros de categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat.id && styles.categoryButtonTextActive,
                ]}
              >
                {cat.emoji ? `${cat.emoji} ` : ""}
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido principal */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Profesionales Destacados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROFESIONALES DESTACADOS</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featuredProfessionals.length > 0 ? (
              featuredProfessionals.map((prof) => (
                <View key={prof._id}>{renderFeaturedProfessional({ item: prof })}</View>
              ))
            ) : (
              <>
                {/* Placeholder explore button */}
                <TouchableOpacity style={styles.featuredItem}>
                  <View style={styles.featuredAvatarContainer}>
                    <View style={styles.explorePlaceholder}>
                      <MaterialIcons name="add" size={24} color={COLORS.gray} />
                    </View>
                  </View>
                  <Text style={styles.featuredName}>Explorar</Text>
                  <Text style={styles.featuredProfession}>Más</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Always show explore button */}
            <TouchableOpacity style={styles.featuredItem}>
              <View style={styles.featuredAvatarContainer}>
                <View style={styles.explorePlaceholder}>
                  <MaterialIcons name="add" size={24} color={COLORS.gray} />
                </View>
              </View>
              <Text style={styles.featuredName}>Explorar</Text>
              <Text style={styles.featuredProfession}>Más</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECIENTES</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Marcar leídos</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            // Filtrar chats donde el partner sea un profesional (userpro)
            const professionalChats = chats.filter((chat) => {
              const partner = getChatPartner(chat);
              return partner?.userType === 'userpro';
            });

            return professionalChats.length > 0 ? (
              professionalChats.map((chat) => <View key={chat._id}>{renderRecentChat({ item: chat })}</View>)
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.grayLight} />
                <Text style={styles.emptyText}>No tienes chats con profesionales</Text>
                <Text style={styles.emptySubtext}>Explora profesionales para iniciar una conversación</Text>
              </View>
            );
          })()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navItemActive}>
            <MaterialIcons name="chat-bubble" size={24} color={COLORS.black} />
          </View>
          <Text style={styles.navLabelActive}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/two")}>
          <MaterialIcons name="diversity-2" size={24} color={COLORS.gray} />
          <Text style={styles.navLabel}>Directorio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="favorite" size={24} color={COLORS.gray} />
          <Text style={styles.navLabel}>Favoritos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/profile")}>
          <MaterialIcons name="settings" size={24} color={COLORS.gray} />
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

  // Header
  headerContainer: {
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  logoSubtitle: {
    fontSize: 11,
    color: COLORS.grayLight,
  },
  profileButton: {
    position: "relative",
  },
  proBadge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    backgroundColor: "#22c55e",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.black,
  },

  // Greeting
  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
  },
  greetingSubtext: {
    fontSize: 14,
    color: COLORS.grayLight,
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
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
    color: COLORS.white,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Categories
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryButton: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(71, 85, 105, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: COLORS.black,
    fontWeight: "bold",
  },

  // Main content
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.gray,
    letterSpacing: 1,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Featured professionals
  featuredList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredItem: {
    alignItems: "center",
    width: 72,
  },
  featuredAvatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  featuredAvatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(249, 245, 6, 0.3)",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredAvatarBorderActive: {
    borderColor: COLORS.primary,
  },
  featuredAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  featuredAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.backgroundLight,
  },
  featuredName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  featuredProfession: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: "center",
  },
  explorePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  // Chat cards
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chatAvatarContainer: {
    marginRight: 12,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  chatTime: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "600",
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  professionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  professionBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.gray,
  },
  chatPreview: {
    fontSize: 13,
    color: COLORS.gray,
  },
  chatActions: {
    marginLeft: 8,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: "center",
    marginTop: 4,
  },

  // Bottom navigation
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
    color: COLORS.gray,
    fontWeight: "500",
  },
  navLabelActive: {
    fontSize: 11,
    color: COLORS.black,
    fontWeight: "bold",
  },
});
