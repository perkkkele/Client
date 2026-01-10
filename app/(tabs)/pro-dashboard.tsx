import { router } from "expo-router";
import { useCallback, useState, useEffect } from "react";;
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context";
import { userApi, analyticsApi, getAssetUrl } from "../../api";
import { ProfileBlock, TwinBlock, StatsBlock, AppointmentsBlock, EarningsBlock } from "../../components/dashboard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    gray100: "#e5e7eb",
    gray200: "#d1d5db",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    green400: "#4ade80",
    green500: "#22c55e",
    green600: "#16a34a",
    green50: "#f0fdf4",
    purple600: "#9333ea",
    purple50: "#faf5ff",
    orange600: "#ea580c",
    orange50: "#fff7ed",
    blue50: "#eff6ff",
    blue600: "#2563eb",
    yellow50: "#fefce8",
    yellow600: "#ca8a04",
    indigo50: "#eef2ff",
    indigo600: "#4f46e5",
    teal50: "#f0fdfa",
    teal600: "#0d9488",
    rose50: "#fff1f2",
    rose600: "#e11d48",
    cyan50: "#ecfeff",
    cyan600: "#0891b2",
    red50: "#fef2f2",
    red600: "#dc2626",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

interface MenuItem {
    icon: string;
    label: string;
    iconBg: string;
    iconColor: string;
    onPress?: () => void;
    isLogout?: boolean;
    isActive?: boolean;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

export default function ProDashboardScreen() {
    const { user, logout, token, refreshUser } = useAuth();
    const [geminiActive, setGeminiActive] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Escalation state
    const [escalation, setEscalation] = useState({
        enabled: false,
        triggers: {
            clientRequest: true,
            twinUnable: true,
            keywords: false,
        },
        keywords: ["urgente", "emergencia", "queja"],
    });

    // Load escalation from user on mount
    useEffect(() => {
        if (user?.escalation) {
            setEscalation({
                enabled: user.escalation.enabled ?? false,
                triggers: {
                    clientRequest: user.escalation.triggers?.clientRequest ?? true,
                    twinUnable: user.escalation.triggers?.twinUnable ?? true,
                    keywords: user.escalation.triggers?.keywords ?? false,
                },
                keywords: user.escalation.keywords || ["urgente", "emergencia", "queja"],
            });
        }
    }, [user?.escalation]);

    // Analytics state
    const [analytics, setAnalytics] = useState({
        profileViews: 0,
        totalConversationSeconds: 0,
        appointmentsBooked: 0,
        phoneCalls: 0,
    });
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    // Load analytics data
    const loadAnalytics = useCallback(async () => {
        if (!token || !user?._id) return;
        try {
            const summary = await analyticsApi.getSummary(token, user._id);
            if (summary) {
                setAnalytics(summary);
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [token, user?._id]);

    // Load analytics on mount
    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    // ===== DASHBOARD CUSTOMIZATION =====
    const DEFAULT_BLOCK_ORDER = ['profile', 'twin', 'appointments', 'earnings', 'stats'];
    const DASHBOARD_LAYOUT_KEY = `dashboard_layout_${user?._id}`;

    const [editMode, setEditMode] = useState(false);
    const [blockOrder, setBlockOrder] = useState<string[]>(DEFAULT_BLOCK_ORDER);

    // Load saved block order on mount
    useEffect(() => {
        const loadBlockOrder = async () => {
            if (!user?._id) return;
            try {
                const saved = await SecureStore.getItemAsync(DASHBOARD_LAYOUT_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        // Include any new blocks that weren't in the saved order
                        const newBlocks = DEFAULT_BLOCK_ORDER.filter(b => !parsed.includes(b));
                        // Filter out any blocks that no longer exist
                        const validSaved = parsed.filter((b: string) => DEFAULT_BLOCK_ORDER.includes(b));
                        // Merge: saved order + new blocks at the end
                        const mergedOrder = [...validSaved, ...newBlocks];
                        if (mergedOrder.length === DEFAULT_BLOCK_ORDER.length) {
                            setBlockOrder(mergedOrder);
                        }
                    }
                }
            } catch (error) {
                console.log("Error loading dashboard layout:", error);
            }
        };
        loadBlockOrder();
    }, [user?._id]);

    // Toggle edit mode and save on exit
    const handleToggleEditMode = async () => {
        if (editMode) {
            try {
                await SecureStore.setItemAsync(DASHBOARD_LAYOUT_KEY, JSON.stringify(blockOrder));
            } catch (error) {
                console.log("Error saving dashboard layout:", error);
            }
        }
        setEditMode(!editMode);
    };

    // Move block up or down
    const moveBlock = (blockId: string, direction: 'up' | 'down') => {
        const currentIndex = blockOrder.indexOf(blockId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= blockOrder.length) return;

        const newOrder = [...blockOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
        setBlockOrder(newOrder);
    };

    // Wrapper function for block with edit controls
    const renderBlockWithControls = (blockId: string, content: React.ReactNode) => {
        const blockIndex = blockOrder.indexOf(blockId);
        const isFirst = blockIndex === 0;
        const isLast = blockIndex === blockOrder.length - 1;

        return (
            <View key={blockId} style={styles.blockWrapper}>
                {editMode && (
                    <>
                        <View style={styles.editModeOverlay} pointerEvents="none" />
                        <View style={styles.blockEditControls}>
                            <TouchableOpacity
                                style={[styles.blockEditButton, isFirst && styles.blockEditButtonDisabled]}
                                onPress={() => !isFirst && moveBlock(blockId, 'up')}
                                disabled={isFirst}
                            >
                                <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.blockEditButton, isLast && styles.blockEditButtonDisabled]}
                                onPress={() => !isLast && moveBlock(blockId, 'down')}
                                disabled={isLast}
                            >
                                <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
                {content}
            </View>
        );
    };
    // ===== END DASHBOARD CUSTOMIZATION =====

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname || user?.email?.split("@")[0] || "Profesional";
    const fullName = user?.firstname && user?.lastname
        ? `${user.firstname} ${user.lastname}`
        : displayName;

    function handleMenuPress() {
        setMenuVisible(true);
    }

    function handleCloseMenu() {
        setMenuVisible(false);
    }

    function handleConfigureGemini() {
        router.push("/onboarding/twin-appearance");
    }

    function handleEditProfile() {
        setMenuVisible(false);
        router.push("/(settings)/edit-profile");
    }

    function handleLogout() {
        setMenuVisible(false);
        router.push("/(tabs)/logout-confirm");
    }

    async function handleToggleAppointments(value: boolean) {
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                appointmentsEnabled: value,
                appointmentHours: value ? { start: "09:00", end: "18:00" } : undefined,
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error toggling appointments:", error);
        }
    }

    async function handleToggleAutoConfirm(value: boolean) {
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                autoConfirmAppointments: value,
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error toggling auto-confirm:", error);
        }
    }

    async function handleTogglePaymentRequired(value: boolean) {
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                requirePaymentOnBooking: value,
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error toggling payment required:", error);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAnalytics();
        setRefreshing(false);
    }, [loadAnalytics]);

    // Handle escalation config change
    async function handleEscalationChange(newConfig: typeof escalation) {
        setEscalation(newConfig);
        if (!token) return;

        try {
            await userApi.updateUser(token, {
                escalation: newConfig,
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error("Error updating escalation config:", error);
        }
    }

    // Menu sections data
    const menuSections: MenuSection[] = [
        {
            title: "Mi Negocio",
            items: [
                { icon: "dashboard", label: "Área personal Pro", iconBg: COLORS.primary, iconColor: COLORS.textMain, isActive: true, onPress: () => { setMenuVisible(false); } },
                { icon: "public", label: "Mi perfil público", iconBg: COLORS.blue50, iconColor: COLORS.blue600, onPress: () => { setMenuVisible(false); router.push(`/professional/${user?._id}`); } },
                { icon: "reviews", label: "Gestión de reseñas", iconBg: COLORS.yellow50, iconColor: COLORS.yellow600 },
                { icon: "schedule", label: "Mi horario laboral", iconBg: COLORS.purple50, iconColor: COLORS.purple600, onPress: () => { setMenuVisible(false); router.push("/(settings)/work-schedule"); } },
                { icon: "forum", label: "Mis chats Pro", iconBg: COLORS.green50, iconColor: COLORS.green600, onPress: () => { setMenuVisible(false); router.push("/(settings)/pro-chats" as any); } },
            ],
        },
        {
            title: "Agenda",
            items: [
                { icon: "calendar-month", label: "Gestión de citas", iconBg: COLORS.orange50, iconColor: COLORS.orange600, onPress: () => { setMenuVisible(false); router.push("/(settings)/manage-appointments"); } },
            ],
        },
        {
            title: "Tu Gemelo Digital IA",
            items: [
                { icon: "chat-bubble", label: "Respuestas del gemelo", iconBg: COLORS.indigo50, iconColor: COLORS.indigo600 },
                { icon: "history", label: "Historial de conversaciones", iconBg: COLORS.teal50, iconColor: COLORS.teal600, onPress: () => { setMenuVisible(false); router.push("/(settings)/twin-history"); } },
                { icon: "analytics", label: "Rendimiento del gemelo", iconBg: COLORS.rose50, iconColor: COLORS.rose600 },
                { icon: "tune", label: "Alcance y límites", iconBg: COLORS.cyan50, iconColor: COLORS.cyan600 },
            ],
        },
        {
            title: "Cuenta",
            items: [
                { icon: "credit-card", label: "Planes y créditos", iconBg: COLORS.gray100, iconColor: COLORS.gray600, onPress: () => { setMenuVisible(false); router.push("/(settings)/plans-credits"); } },
                { icon: "notifications", label: "Notificaciones", iconBg: COLORS.gray100, iconColor: COLORS.gray600 },
                { icon: "logout", label: "Cerrar Sesión", iconBg: COLORS.red50, iconColor: COLORS.red600, isLogout: true, onPress: handleLogout },
            ],
        },
        {
            title: "Ayuda y Comentarios",
            items: [
                { icon: "help", label: "Centro de ayuda", iconBg: COLORS.blue50, iconColor: COLORS.blue600, onPress: () => { setMenuVisible(false); router.push("/(settings)/help-center"); } },
                { icon: "support-agent", label: "Contactar con soporte", iconBg: COLORS.orange50, iconColor: COLORS.orange600, onPress: () => { setMenuVisible(false); router.push("/(settings)/contact-support"); } },
                { icon: "feedback", label: "Enviar comentarios", iconBg: COLORS.green50, iconColor: COLORS.green600, onPress: () => { setMenuVisible(false); router.push("/(settings)/send-feedback"); } },
                { icon: "policy", label: "Condiciones y Política de privacidad", iconBg: COLORS.gray100, iconColor: COLORS.gray600, onPress: () => { setMenuVisible(false); router.push("/(settings)/terms-privacy"); } },
            ],
        },
    ];

    // Render menu item
    const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.menuItem,
                !isLast && styles.menuItemBorder,
                item.isLogout && styles.menuItemLogout,
                item.isActive && styles.menuItemActive,
            ]}
            onPress={item.onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: item.iconBg }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <Text style={[
                    styles.menuItemLabel,
                    item.isLogout && styles.menuItemLabelLogout,
                    item.isActive && styles.menuItemLabelActive
                ]}>
                    {item.label}
                </Text>
            </View>
            {!item.isLogout && !item.isActive && (
                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
                    <MaterialIcons name="menu" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Área Personal Pro</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <TouchableOpacity style={styles.greetingProfileButton} onPress={handleEditProfile}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.greetingProfileAvatar} />
                        ) : (
                            <View style={styles.greetingProfileAvatarPlaceholder}>
                                <MaterialIcons name="person" size={24} color={COLORS.gray400} />
                            </View>
                        )}
                        <View style={styles.greetingOnlineIndicator} />
                    </TouchableOpacity>
                    <View style={styles.greetingTextContainer}>
                        <View style={styles.greetingRow}>
                            <Text style={styles.greetingText}>Hola, {displayName}</Text>
                            <MaterialIcons name="waving-hand" size={24} color={COLORS.primary} />
                        </View>
                    </View>
                </View>

                {/* Edit Mode Banner */}
                {editMode && (
                    <View style={styles.editModeBanner}>
                        <Text style={styles.editModeBannerText}>
                            📐 Modo edición: usa las flechas para reordenar
                        </Text>
                    </View>
                )}

                {/* Dynamically Rendered Blocks */}
                {blockOrder.map((blockId) => {
                    switch (blockId) {
                        case 'profile':
                            return renderBlockWithControls('profile',
                                <ProfileBlock userId={user?._id} />
                            );
                        case 'twin':
                            return renderBlockWithControls('twin',
                                <TwinBlock
                                    user={user || undefined}
                                    geminiActive={geminiActive}
                                    onGeminiChange={setGeminiActive}
                                    onConfigureGemini={handleConfigureGemini}
                                    escalation={escalation}
                                    onEscalationChange={handleEscalationChange}
                                />
                            );
                        case 'appointments':
                            return renderBlockWithControls('appointments',
                                <AppointmentsBlock
                                    user={user || undefined}
                                    onToggleAppointments={handleToggleAppointments}
                                    onToggleAutoConfirm={handleToggleAutoConfirm}
                                    onTogglePaymentRequired={handleTogglePaymentRequired}
                                />
                            );
                        case 'earnings':
                            return renderBlockWithControls('earnings',
                                <EarningsBlock token={token} />
                            );
                        case 'stats':
                            return renderBlockWithControls('stats',
                                <StatsBlock analytics={analytics} />
                            );
                        default:
                            return null;
                    }
                })}
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.gray400} />
                    <Text style={styles.navLabel}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos")}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.gray400} />
                    <Text style={styles.navLabel}>Directorio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.gray400} />
                    <Text style={styles.navLabel}>Favoritos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <View style={styles.navItemActive}>
                        <MaterialIcons name="badge" size={24} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.navLabelActive}>Perfil Pro</Text>
                </TouchableOpacity>
            </View>

            {/* FAB - Toggle Edit Mode */}
            <TouchableOpacity
                style={[styles.fab, editMode && styles.fabEditMode]}
                onPress={handleToggleEditMode}
            >
                <MaterialIcons
                    name={editMode ? "check" : "dashboard-customize"}
                    size={28}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            {/* Side Menu Modal */}
            <Modal
                visible={menuVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseMenu}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={handleCloseMenu} activeOpacity={1} />
                    <View style={styles.sideMenu}>
                        {/* Menu Header */}
                        <View style={styles.sideMenuHeader}>
                            <View style={styles.sideMenuUser}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.sideMenuAvatar} />
                                ) : (
                                    <View style={[styles.sideMenuAvatar, styles.sideMenuAvatarPlaceholder]}>
                                        <MaterialIcons name="person" size={28} color={COLORS.gray400} />
                                    </View>
                                )}
                                <View>
                                    <Text style={styles.sideMenuName}>{fullName}</Text>
                                    <Text style={styles.sideMenuBadge}>Pro Member</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleCloseMenu}>
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sideMenuDivider} />

                        {/* Scrollable Menu Content */}
                        <ScrollView style={styles.sideMenuScroll} showsVerticalScrollIndicator={false}>
                            {/* Mi Negocio Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>MI NEGOCIO</Text>
                                <View style={styles.sideMenuCard}>
                                    {/* Área personal Pro - Active item */}
                                    <TouchableOpacity
                                        style={[styles.sideMenuCardItem, styles.sideMenuCardItemActive]}
                                        onPress={handleCloseMenu}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.primary }]}>
                                            <MaterialIcons name="dashboard" size={20} color={COLORS.textMain} />
                                        </View>
                                        <Text style={[styles.sideMenuCardLabel, styles.sideMenuCardLabelActive]}>Área personal Pro</Text>
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    {/* Mi perfil público - Parent with subitems */}
                                    <View style={styles.sideMenuParentItem}>
                                        {/* Parent header - clickable to view full profile */}
                                        <TouchableOpacity
                                            style={styles.sideMenuParentHeader}
                                            onPress={() => { setMenuVisible(false); router.push(`/professional/${user?._id}`); }}
                                        >
                                            <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.blue50 }]}>
                                                <MaterialIcons name="public" size={20} color={COLORS.blue600} />
                                            </View>
                                            <Text style={styles.sideMenuParentLabel}>Mi perfil público</Text>
                                            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                        </TouchableOpacity>
                                        {/* Sub-items - indented */}
                                        <View style={styles.sideMenuSubItems}>
                                            <TouchableOpacity
                                                style={styles.sideMenuSubItem}
                                                onPress={() => { setMenuVisible(false); router.push("/(settings)/edit-pro-profile"); }}
                                            >
                                                <View style={[styles.sideMenuSubIcon, { backgroundColor: COLORS.purple50 }]}>
                                                    <MaterialIcons name="work" size={16} color={COLORS.purple600} />
                                                </View>
                                                <Text style={styles.sideMenuSubLabel}>Perfil profesional</Text>
                                                <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.sideMenuSubItem}
                                                onPress={() => { setMenuVisible(false); router.push("/(settings)/contact-info"); }}
                                            >
                                                <View style={[styles.sideMenuSubIcon, { backgroundColor: COLORS.green50 }]}>
                                                    <MaterialIcons name="contact-phone" size={16} color={COLORS.green600} />
                                                </View>
                                                <Text style={styles.sideMenuSubLabel}>Datos de contacto</Text>
                                                <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.sideMenuSubItem}
                                                onPress={() => { setMenuVisible(false); router.push("/(tabs)/my-qr-code"); }}
                                            >
                                                <View style={[styles.sideMenuSubIcon, { backgroundColor: COLORS.teal50 }]}>
                                                    <MaterialIcons name="qr-code-2" size={16} color={COLORS.teal600} />
                                                </View>
                                                <Text style={styles.sideMenuSubLabel}>Mi Código QR</Text>
                                                <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/manage-reviews"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.yellow50 }]}>
                                            <MaterialIcons name="rate-review" size={20} color={COLORS.yellow600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Gestión de reseñas</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/pro-chats"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.green50 }]}>
                                            <MaterialIcons name="forum" size={20} color={COLORS.green600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Mis chats Pro</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Agenda Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>AGENDA</Text>
                                <View style={styles.sideMenuCard}>
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/manage-appointments"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.orange50 }]}>
                                            <MaterialIcons name="calendar-month" size={20} color={COLORS.orange600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Gestión de citas</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/appointment-pricing"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.yellow50 }]}>
                                            <MaterialIcons name="euro" size={20} color={COLORS.yellow600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Tarifas de citas</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/work-schedule"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.purple50 }]}>
                                            <MaterialIcons name="schedule" size={20} color={COLORS.purple600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Mi horario laboral</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Tu Gemelo Digital IA Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>TU GEMELO DIGITAL IA</Text>
                                {/* AI Control Panel Button */}
                                <TouchableOpacity
                                    style={styles.sideMenuAiButton}
                                    onPress={() => { setMenuVisible(false); router.push("/(settings)/twin-control-panel"); }}
                                >
                                    <View style={styles.sideMenuAiLeft}>
                                        <View style={styles.sideMenuAiIcon}>
                                            <MaterialIcons name="smart-toy" size={24} color="#FFFFFF" />
                                        </View>
                                        <View>
                                            <Text style={styles.sideMenuAiTitle}>Panel de Control</Text>
                                            <Text style={styles.sideMenuAiSubtitle}>Configura tu asistente de IA</Text>
                                        </View>
                                    </View>
                                    <View style={styles.sideMenuAiArrow}>
                                        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.sideMenuCard}>
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.indigo50 }]}>
                                            <MaterialIcons name="chat-bubble" size={20} color={COLORS.indigo600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Respuestas del gemelo</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/twin-history"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.teal50 }]}>
                                            <MaterialIcons name="history" size={20} color={COLORS.teal600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Historial de conversaciones</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/twin-performance"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.rose50 }]}>
                                            <MaterialIcons name="analytics" size={20} color={COLORS.rose600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Rendimiento del gemelo</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.cyan50 }]}>
                                            <MaterialIcons name="tune" size={20} color={COLORS.cyan600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Alcance y límites</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Cuenta Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>CUENTA</Text>
                                <View style={styles.sideMenuCard}>
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/my-earnings"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.green50 }]}>
                                            <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.green600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Mis Ingresos</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/stripe-onboarding"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.indigo50 }]}>
                                            <MaterialIcons name="account-balance" size={20} color={COLORS.indigo600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Configurar Pagos</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity
                                        style={styles.sideMenuCardItem}
                                        onPress={() => { setMenuVisible(false); router.push("/(settings)/plans-credits"); }}
                                    >
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.gray100 }]}>
                                            <MaterialIcons name="credit-card" size={20} color={COLORS.gray600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Planes y créditos</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.gray100 }]}>
                                            <MaterialIcons name="notifications" size={20} color={COLORS.gray600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Notificaciones</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={[styles.sideMenuCardItem, { backgroundColor: COLORS.red50 }]} onPress={handleLogout}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.red50 }]}>
                                            <MaterialIcons name="logout" size={20} color={COLORS.red600} />
                                        </View>
                                        <Text style={[styles.sideMenuCardLabel, { color: COLORS.red600 }]}>Cerrar Sesión</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Ayuda y Comentarios Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>AYUDA Y COMENTARIOS</Text>
                                <View style={styles.sideMenuCard}>
                                    <TouchableOpacity style={styles.sideMenuCardItem} onPress={() => { handleCloseMenu(); router.push("/(settings)/help-center"); }}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.blue50 }]}>
                                            <MaterialIcons name="help" size={20} color={COLORS.blue600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Centro de ayuda</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem} onPress={() => { handleCloseMenu(); router.push("/(settings)/contact-support"); }}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.orange50 }]}>
                                            <MaterialIcons name="support-agent" size={20} color={COLORS.orange600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Contactar con soporte</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem} onPress={() => { handleCloseMenu(); router.push("/(settings)/send-feedback"); }}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.green50 }]}>
                                            <MaterialIcons name="feedback" size={20} color={COLORS.green600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Enviar comentarios</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem} onPress={() => { handleCloseMenu(); router.push("/(settings)/terms-privacy"); }}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.gray100 }]}>
                                            <MaterialIcons name="policy" size={20} color={COLORS.gray600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Condiciones y Política</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerPlaceholder: {
        width: 40,
        height: 40,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        overflow: "hidden",
    },
    profileAvatar: {
        width: "100%",
        height: "100%",
    },
    profileAvatarPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
    },
    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    // Greeting
    greetingSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
        gap: 12,
    },
    greetingProfileButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.gray200,
        overflow: "hidden",
    },
    greetingProfileAvatar: {
        width: "100%",
        height: "100%",
    },
    greetingProfileAvatarPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.gray200,
    },
    greetingOnlineIndicator: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: COLORS.surfaceLight,
    },
    greetingTextContainer: {
        flex: 1,
    },
    greetingLeft: {
        flex: 1,
    },
    greetingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    greetingSubtext: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 4,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Profile Preview Card
    profilePreviewCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#3b82f6",
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    profilePreviewGlow: {
        position: "absolute",
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    profilePreviewContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    profilePreviewLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    profilePreviewIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    profilePreviewText: {
        gap: 2,
    },
    profilePreviewTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    profilePreviewSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
    },
    profilePreviewArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    // Section
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    menuCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    menuItemLogout: {
        backgroundColor: COLORS.red50,
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    menuItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    menuItemLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
        flex: 1,
    },
    menuItemLabelLogout: {
        color: COLORS.red600,
    },
    menuItemActive: {
        backgroundColor: "rgba(253, 224, 71, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(253, 224, 71, 0.3)",
    },
    menuItemLabelActive: {
        color: COLORS.textMain,
        fontWeight: "bold",
    },
    // AI Control Button
    aiControlButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    aiControlLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    aiControlIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    aiControlTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    aiControlSubtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    aiControlArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    // Side Menu Modal
    modalOverlay: {
        flex: 1,
        flexDirection: "row",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(20, 20, 20, 0.4)",
    },
    sideMenu: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.83,
        maxWidth: 320,
        backgroundColor: COLORS.surfaceLight,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    sideMenuHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
    },
    sideMenuUser: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    sideMenuAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    sideMenuAvatarPlaceholder: {
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    sideMenuName: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    sideMenuBadge: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    sideMenuDivider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginHorizontal: 16,
    },
    sideMenuItems: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 8,
    },
    sideMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    sideMenuItemActive: {
        backgroundColor: COLORS.backgroundLight,
        borderWidth: 1,
        borderColor: "rgba(19, 127, 236, 0.1)",
    },
    sideMenuItemText: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    sideMenuItemTextActive: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    sideMenuFooter: {
        position: "absolute",
        bottom: 32,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    sideMenuLogout: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    sideMenuLogoutText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.red600,
    },
    // New side menu styles
    sideMenuScroll: {
        flex: 1,
    },
    sideMenuSection: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sideMenuSectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    sideMenuCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    sideMenuCardItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 12,
    },
    sideMenuCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    sideMenuCardLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    sideMenuCardItemActive: {
        backgroundColor: "rgba(253, 224, 71, 0.15)",
    },
    sideMenuCardLabelActive: {
        fontWeight: "bold",
    },
    sideMenuCardDivider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginLeft: 62,
    },
    // Hierarchical parent-child menu styles
    sideMenuParentItem: {
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    sideMenuParentHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
    },
    sideMenuParentLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    sideMenuSubItems: {
        marginLeft: 48,
        marginTop: 4,
        paddingLeft: 0,
    },
    sideMenuSubItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingRight: 8,
    },
    sideMenuSubItemLine: {
        position: "absolute",
        left: -14,
        width: 12,
        height: 2,
        backgroundColor: COLORS.gray200,
    },
    sideMenuSubIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    sideMenuSubLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    sideMenuAiButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    sideMenuAiLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    sideMenuAiIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    sideMenuAiTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    sideMenuAiSubtitle: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    sideMenuAiArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    // Dashboard Twin Card
    twinCard: {
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: COLORS.primary,
        padding: 20,
        position: "relative",
    },
    twinCardGlow1: {
        position: "absolute",
        top: -16,
        right: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    twinCardGlow2: {
        position: "absolute",
        bottom: -16,
        left: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    twinCardContent: {
        position: "relative",
        zIndex: 1,
    },
    twinHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    twinHeaderTouchable: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
    },
    twinIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    twinInfo: {
        flex: 1,
        marginLeft: 16,
    },
    twinTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    twinStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#4ade80",
        shadowColor: "#4ade80",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    statusDotInactive: {
        backgroundColor: "#9CA3AF",
        shadowColor: "#9CA3AF",
        shadowOpacity: 0,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
    },
    testHint: {
        fontSize: 10,
        fontWeight: "500",
        color: "rgba(255,255,255,0.6)",
        marginTop: 4,
        fontStyle: "italic",
    },
    configureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
    },
    configureButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    configureButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    // Dashboard Stats
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    sectionLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    sectionLinkText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        width: "48%",
        gap: 12,
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: COLORS.green50,
    },
    statBadgeText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.green600,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    // Dashboard Alerts
    alertsList: {
        gap: 12,
    },
    alertCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    alertDescription: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 4,
    },
    alertTime: {
        fontSize: 10,
        color: COLORS.gray400,
        marginTop: 8,
    },
    // FAB
    fab: {
        position: "absolute",
        bottom: 100,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.textMain,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 30,
    },
    // Bottom Navigation
    bottomNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    navItem: {
        alignItems: "center",
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        color: COLORS.gray400,
        fontWeight: "500",
    },
    navItemActive: {
        width: 40,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(19, 127, 236, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    navLabelActive: {
        fontSize: 10,
        color: COLORS.textMain,
        fontWeight: "bold",
    },

    // Appointments Toggle inside Twin Card
    appointmentsDivider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        marginTop: 12,
        marginBottom: 12,
    },
    appointmentsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    appointmentsIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    appointmentsInfo: {
        flex: 1,
    },
    appointmentsLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    appointmentsHint: {
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: 2,
    },

    // Dashboard customization styles
    blockWrapper: {
        position: "relative",
    },
    editModeOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(19, 127, 236, 0.08)",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: "dashed",
        zIndex: 1,
    },
    blockEditControls: {
        position: "absolute",
        top: 8,
        right: 8,
        flexDirection: "row",
        gap: 4,
        zIndex: 10,
    },
    blockEditButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    blockEditButtonDisabled: {
        backgroundColor: COLORS.gray300,
        opacity: 0.6,
    },
    editModeBanner: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 10,
    },
    editModeBannerText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    fabEditMode: {
        backgroundColor: COLORS.green500,
    },
});
