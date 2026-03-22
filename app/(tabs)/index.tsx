import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getAssetUrl, chatApi, professionalApi } from "../../api";
import type { Chat, EscalatedChat } from "../../api/chat";
import type { Professional } from "../../api/professional";
import { useAuth } from "../../context";
import { useTranslation } from 'react-i18next';
import BottomNavBar from "../../components/BottomNavBar";
import { LOCALE_MAP, type SupportedLanguage } from '../../services/i18n';
import { getCategoriesWithEmoji, getCategoryLabel, CATEGORY_COLORS } from '../../utils/categoryUtils';

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
  slate400: "#94a3b8",
  slate800: "#1e293b",
};


// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
  return getAssetUrl(avatarPath);
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
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation('home');
  const ALL_CATEGORIES = useMemo(() => getCategoriesWithEmoji(t), [t]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [featuredProfessionals, setFeaturedProfessionals] = useState<Professional[]>([]);
  const [escalatedChats, setEscalatedChats] = useState<EscalatedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Professional[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Context menu state
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedChatForMenu, setSelectedChatForMenu] = useState<Chat | null>(null);
  const [hiddenChatPartners, setHiddenChatPartners] = useState<string[]>([]);

  const HIDDEN_CHATS_KEY = `hidden_chats_${user?._id}`;

  // Load hidden chats from storage
  useEffect(() => {
    const loadHiddenChats = async () => {
      if (!user?._id) return;
      try {
        const stored = await SecureStore.getItemAsync(HIDDEN_CHATS_KEY);
        if (stored) {
          setHiddenChatPartners(JSON.parse(stored));
        }
      } catch (error) {
        console.log("Error loading hidden chats:", error);
      }
    };
    loadHiddenChats();
  }, [user?._id]);

  const loadData = useCallback(async () => {
    if (!token || !user) return;
    try {
      const [chatsData, professionalsData, escalatedData] = await Promise.all([
        chatApi.getChats(token),
        professionalApi.getFeaturedProfessionals(token),
        chatApi.getMyEscalatedChats(token).catch(() => [] as EscalatedChat[]),
      ]);

      // Group chats by unique contact (participant) and keep only the most recent per contact
      const uniqueContactChats = new Map<string, typeof chatsData[0]>();

      for (const chat of chatsData) {
        // Determine partner ID
        const p1 = chat.participant_one;
        const p2 = chat.participant_two;
        const p1Id = typeof p1 === "string" ? p1 : p1?._id;
        const p2Id = typeof p2 === "string" ? p2 : p2?._id;
        const partnerId = p1Id === user._id ? p2Id : p1Id;

        if (!partnerId) continue;

        // Keep only the most recent chat per partner (chats are sorted by last_message_date desc from backend)
        if (!uniqueContactChats.has(partnerId)) {
          uniqueContactChats.set(partnerId, chat);
        }
      }

      const filteredChats = Array.from(uniqueContactChats.values());
      console.log('[loadData] Chats:', chatsData.length, '-> Unique contacts:', filteredChats.length);

      setChats(filteredChats);
      setFeaturedProfessionals(professionalsData);
      setEscalatedChats(escalatedData);
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  // Navigate to Directorio with search query
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    // Navigate to category-results (Directorio) with the search query
    router.push(`/(tabs)/category-results?category=todos&search=${encodeURIComponent(searchQuery.trim())}`);
    // Clear local search state
    setSearchQuery("");
  }, [searchQuery]);

  // Clear search and go back to normal view
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  // Context menu handlers
  const handleLongPressChat = (chat: Chat) => {
    setSelectedChatForMenu(chat);
    setContextMenuVisible(true);
  };

  const handleHideChat = async () => {
    if (!selectedChatForMenu) return;

    const partner = getChatPartner(selectedChatForMenu);
    if (!partner?._id) return;

    const newHiddenList = [...hiddenChatPartners, partner._id];
    setHiddenChatPartners(newHiddenList);

    try {
      await SecureStore.setItemAsync(HIDDEN_CHATS_KEY, JSON.stringify(newHiddenList));
    } catch (error) {
      console.log("Error saving hidden chats:", error);
    }

    setContextMenuVisible(false);
    setSelectedChatForMenu(null);
  };

  const handleViewProfile = () => {
    if (!selectedChatForMenu) return;

    const partner = getChatPartner(selectedChatForMenu);
    if (partner?._id) {
      setContextMenuVisible(false);
      setSelectedChatForMenu(null);
      router.push(`/professional/${partner._id}`);
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    setSelectedChatForMenu(null);
  };

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

  function getUserAvatar() {
    return getAvatarUrl(user?.avatar);
  }

  // Renderizar profesional destacado
  function renderFeaturedProfessional({ item }: { item: Professional }) {
    const avatarUrl = getAvatarUrl(item.avatar);
    const isOnline = item.isOnline;

    return (
      <TouchableOpacity
        style={styles.featuredItem}
        onPress={() => {
          if (item._id) {
            router.push(`/avatar-chat/${item._id}`);
          }
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
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: isOnline ? "#22c55e" : item.isOnline === false ? "#9ca3af" : "#f59e0b" }
            ]} />
          )}
        </View>
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.firstname || item.email?.split("@")[0]}
        </Text>
        <Text style={styles.featuredProfession} numberOfLines={1}>
          {item.profession || t('defaultProfessional')}
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
        onPress={() => {
          // Navigate to avatar-chat using the partner's ID to unify chat rooms
          if (partner?._id) {
            router.push(`/avatar-chat/${partner._id}`);
          }
        }}
        onLongPress={() => handleLongPressChat(item)}
        delayLongPress={500}
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
                : partner?.email || t('defaultUser')}
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
            {item.last_message || t('tapToSeeMessages')}
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

  const userAvatarUrl = getUserAvatar();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header negro con bordes redondeados */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={["top"]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <MaterialIcons name="group" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.logoTitle}>TwinPro</Text>
                <Text style={styles.logoSubtitle}>Professional Chat</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.qrButton} onPress={() => router.push("/(tabs)/qr-scanner")}>
              <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

        {/* Saludo con avatar */}
        <View style={styles.greetingContainer}>
          <TouchableOpacity style={styles.userAvatarButton} onPress={() => router.push("/(tabs)/settings")}>
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <MaterialIcons name="person" size={28} color={COLORS.slate400} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingText}>{t('greeting', { name: getUserDisplayName() })}</Text>
            <Text style={styles.greetingSubtext}>{t('greetingSubtext')}</Text>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={22} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.trim() ? (
              <TouchableOpacity style={styles.filterButton} onPress={hasSearched ? clearSearch : handleSearch}>
                <MaterialIcons
                  name={hasSearched ? "close" : "arrow-forward"}
                  size={20}
                  color={hasSearched ? COLORS.gray : COLORS.primary}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.filterButton}>
                <MaterialIcons name="tune" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros de categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {/* Filtrar categorías basándose en los intereses del usuario */}
          {ALL_CATEGORIES.filter(cat =>
            cat.id === "todos" ||
            !user?.interests?.length ||
            user.interests.includes(cat.id)
          ).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => {
                if (cat.id === "todos") {
                  router.push("/(tabs)/all-categories");
                } else {
                  router.push(`/(tabs)/category-results?category=${cat.id}`);
                }
              }}
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
        </SafeAreaView>
      </View>

      {/* Contenido principal */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Search Results Section */}
        {hasSearched ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                RESULTADOS PARA "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.sectionLink}>{t('clear')}</Text>
              </TouchableOpacity>
            </View>

            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.searchLoadingText}>{t('searching')}</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptySearchContainer}>
                <MaterialIcons name="search-off" size={48} color={COLORS.gray} />
                <Text style={styles.emptySearchTitle}>{t('noResults')}</Text>
                <Text style={styles.emptySearchSubtitle}>
                  {t('noResultsMessage', { query: searchQuery })}
                </Text>
              </View>
            ) : (
              <View style={styles.searchResultsGrid}>
                {searchResults.map((professional) => (
                  <TouchableOpacity
                    key={professional._id}
                    style={styles.searchResultCard}
                    onPress={() => router.push(`/avatar-chat/${professional._id}`)}
                  >
                    {getAvatarUrl(professional.avatar) ? (
                      <Image
                        source={{ uri: getAvatarUrl(professional.avatar)! }}
                        style={styles.searchResultAvatar}
                      />
                    ) : (
                      <View style={styles.searchResultAvatarPlaceholder}>
                        <MaterialIcons name="person" size={28} color={COLORS.slate400} />
                      </View>
                    )}
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {professional.firstname} {professional.lastname}
                      </Text>
                      <Text style={styles.searchResultProfession} numberOfLines={1}>
                        {professional.profession}
                      </Text>
                      <View style={styles.searchResultMeta}>
                        {professional.rating > 0 && (
                          <View style={styles.searchResultRating}>
                            <MaterialIcons name="star" size={14} color="#f59e0b" />
                            <Text style={styles.searchResultRatingText}>
                              {professional.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.searchResultCategoryBadge,
                          { backgroundColor: CATEGORY_COLORS[professional.category as keyof typeof CATEGORY_COLORS]?.bg || CATEGORY_COLORS.otros.bg }
                        ]}>
                          <Text style={[
                            styles.searchResultCategoryText,
                            { color: CATEGORY_COLORS[professional.category as keyof typeof CATEGORY_COLORS]?.text || CATEGORY_COLORS.otros.text }
                          ]}>
                            {getCategoryLabel(t, professional.category || 'otro')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Mis Consultas — Escalated chats section */}
            {escalatedChats.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="support-agent" size={14} color="#EA580C" />
                    <Text style={styles.sectionTitle}>{t('myConsultations')}</Text>
                  </View>
                  {escalatedChats.length > 3 && (
                    <TouchableOpacity onPress={() => router.push('/my-escalated-chats')}>
                      <Text style={styles.sectionLink}>{t('seeAll')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
                >
                  {escalatedChats.map((item) => {
                    const avatarUrl = getAvatarUrl(item.professional.avatar);
                    const isResponded = item.escalation.status === 'accepted' && item.isLastFromProfessional;

                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.escalatedCard}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (item.professional._id) {
                            router.push(`/escalated-chat/${item._id}` as any);
                          }
                        }}
                        onLongPress={() => {
                          Alert.alert(
                            'Eliminar consulta',
                            '¿Quieres eliminar esta consulta escalada?',
                            [
                              { text: t('common:cancel'), style: 'cancel' },
                              {
                                text: t('common:delete'),
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    if (token) {
                                      await chatApi.deleteChat(token, item._id);
                                      setEscalatedChats(prev => prev.filter(c => c._id !== item._id));
                                    }
                                  } catch (err) {
                                    console.error('[Home] Error deleting escalated chat:', err);
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        delayLongPress={600}
                      >
                        <View style={styles.escalatedCardHeader}>
                          <View style={styles.escalatedAvatar}>
                            {avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={styles.escalatedAvatarImage} />
                            ) : (
                              <MaterialIcons name="person" size={20} color={COLORS.gray} />
                            )}
                          </View>
                          <View style={[
                            styles.escalatedStatusDot,
                            { backgroundColor: isResponded ? '#22c55e' : '#f97316' }
                          ]} />
                        </View>
                        <Text style={styles.escalatedName} numberOfLines={1}>
                          {item.professional.name}
                        </Text>
                        <View style={[
                          styles.escalatedStatusPill,
                          { backgroundColor: isResponded ? '#DCFCE7' : '#FFF7ED' }
                        ]}>
                          <Text style={[
                            styles.escalatedStatusText,
                            { color: isResponded ? '#16A34A' : '#EA580C' }
                          ]}>
                            {isResponded ? t('responded') : t('pending')}
                          </Text>
                        </View>
                        <Text style={styles.escalatedPreview} numberOfLines={1}>
                          {item.lastMessage || t('noMessagesYet')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Recientes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('recent')}</Text>
              </View>
              {/* Mostrar contenido de bienvenida SOLO si no hay ningún chat */}
              {chats.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  {/* Welcome Message - Centered Icon Layout */}
                  <View style={styles.welcomeContainer}>
                    <View style={styles.welcomeIconContainer}>
                      <MaterialIcons name="waving-hand" size={36} color={COLORS.primary} />
                    </View>
                    <Text style={styles.welcomeTitle}>{t('welcome.title')}</Text>
                    <Text style={styles.welcomeSubtitle}>
                      {t('welcome.subtitle')}
                    </Text>

                    {/* Compact Feature highlights - horizontal */}
                    <View style={styles.featuresRow}>
                      <View style={styles.featureChip}>
                        <MaterialIcons name="smart-toy" size={14} color="#0284c7" />
                        <Text style={styles.featureChipText}>{t('welcome.ai247')}</Text>
                      </View>
                      <View style={styles.featureChip}>
                        <MaterialIcons name="verified" size={14} color="#16a34a" />
                        <Text style={styles.featureChipText}>{t('welcome.verified')}</Text>
                      </View>
                      <View style={styles.featureChip}>
                        <MaterialIcons name="bolt" size={14} color="#ca8a04" />
                        <Text style={styles.featureChipText}>{t('welcome.fast')}</Text>
                      </View>
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                      style={styles.welcomeButton}
                      onPress={() => router.push("/(tabs)/category-results?category=todos")}
                    >
                      <Text style={styles.welcomeButtonText}>{t('welcome.exploreProfessionals')}</Text>
                      <MaterialIcons name="arrow-forward" size={18} color={COLORS.black} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Mostrar lista de chats recientes cuando hay chats */
                (() => {
                  // Filter out hidden chats first
                  const visibleChats = chats.filter((chat) => {
                    const partner = getChatPartner(chat);
                    return partner?._id && !hiddenChatPartners.includes(partner._id);
                  });

                  const professionalChats = visibleChats.filter((chat) => {
                    const partner = getChatPartner(chat);
                    return partner?.userType === 'userpro';
                  });

                  return professionalChats.length > 0 ? (
                    professionalChats.map((chat) => <View key={chat._id}>{renderRecentChat({ item: chat })}</View>)
                  ) : visibleChats.length > 0 ? (
                    visibleChats.map((chat) => <View key={chat._id}>{renderRecentChat({ item: chat })}</View>)
                  ) : (
                    <View style={styles.emptyStateContainer}>
                      <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeTitle}>{t('noVisibleChats')}</Text>
                        <Text style={styles.welcomeSubtitle}>
                          {t('noVisibleChatsMessage')}
                        </Text>
                      </View>
                    </View>
                  );
                })()
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavBar activeTab="chats" />

      {/* Context Menu Modal */}
      <Modal
        visible={contextMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseContextMenu}
      >
        <TouchableOpacity
          style={styles.contextMenuOverlay}
          activeOpacity={1}
          onPress={handleCloseContextMenu}
        >
          <View style={styles.contextMenuContainer}>
            <View style={styles.contextMenuHeader}>
              <Text style={styles.contextMenuTitle}>{t('contextMenu.title')}</Text>
            </View>

            <TouchableOpacity style={styles.contextMenuItem} onPress={handleViewProfile}>
              <MaterialIcons name="person" size={22} color={COLORS.black} />
              <Text style={styles.contextMenuItemText}>{t('contextMenu.viewProfile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contextMenuItem} onPress={handleHideChat}>
              <MaterialIcons name="visibility-off" size={22} color="#ef4444" />
              <Text style={[styles.contextMenuItemText, { color: "#ef4444" }]}>{t('contextMenu.hideChat')}</Text>
            </TouchableOpacity>

            <View style={styles.contextMenuDivider} />

            <TouchableOpacity style={styles.contextMenuItem} onPress={handleCloseContextMenu}>
              <MaterialIcons name="close" size={22} color={COLORS.gray} />
              <Text style={[styles.contextMenuItemText, { color: COLORS.gray }]}>{t('common:cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: COLORS.black,
    borderWidth: 3,
    borderColor: COLORS.primary,
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
    color: COLORS.slate400,
    fontWeight: "500",
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },

  // Greeting with avatar
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  userAvatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: "hidden",
    backgroundColor: "#1e293b",
  },
  userAvatar: {
    width: "100%",
    height: "100%",
  },
  userAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
  },
  greetingSubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate800,
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
    paddingBottom: 8,
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
    fontWeight: "bold",
    color: "#a16207",
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

  // Empty state container
  emptyStateContainer: {
    marginTop: -8,
  },

  // Featured section in empty state
  featuredSection: {
    marginBottom: 24,
  },
  featuredSectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  featuredScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  exploreMoreButton: {
    alignItems: "center",
    width: 72,
  },
  exploreMoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249, 245, 6, 0.1)",
    marginBottom: 8,
  },
  exploreMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
  },

  // Welcome container - centered layout
  welcomeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 0,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate800,
    textAlign: "center",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 16,
  },

  // Compact feature chips - horizontal row
  featuresRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.slate800,
  },

  // Welcome button
  welcomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.black,
  },


  // Search Results Styles
  searchLoadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  emptySearchContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.slate800,
    marginTop: 12,
  },
  emptySearchSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  searchResultsGrid: {
    gap: 8,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.backgroundLight,
  },
  searchResultAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slate800,
  },
  searchResultProfession: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  searchResultMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  searchResultRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  searchResultRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
  },
  searchResultCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  searchResultCategoryText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Context Menu Styles
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 300,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  contextMenuHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  contextMenuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    textAlign: "center",
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  contextMenuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.black,
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 20,
  },
  // Escalated Chats ("Mis Consultas") Cards
  escalatedCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  escalatedCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  escalatedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
  escalatedAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  escalatedStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  escalatedName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.black,
    marginBottom: 6,
  },
  escalatedStatusPill: {
    alignSelf: "flex-start" as const,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  escalatedStatusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  escalatedPreview: {
    fontSize: 11,
    color: COLORS.gray,
    lineHeight: 14,
  },
});
