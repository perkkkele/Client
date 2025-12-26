import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";

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
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

interface MenuItem {
    icon: string;
    label: string;
    iconBg: string;
    iconColor: string;
    onPress?: () => void;
    isLogout?: boolean;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

export default function ProDashboardScreen() {
    const { user, logout } = useAuth();
    const [geminiActive, setGeminiActive] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

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
        // TODO: Navigate to gemini configuration
    }

    function handleEditProfile() {
        setMenuVisible(false);
        router.push("/(settings)/edit-profile");
    }

    function handleLogout() {
        setMenuVisible(false);
        logout();
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Menu sections data
    const menuSections: MenuSection[] = [
        {
            title: "Mi Negocio",
            items: [
                { icon: "public", label: "Mi perfil público", iconBg: COLORS.blue50, iconColor: COLORS.blue600 },
                { icon: "reviews", label: "Gestión de reseñas", iconBg: COLORS.yellow50, iconColor: COLORS.yellow600 },
                { icon: "schedule", label: "Mi horario laboral", iconBg: COLORS.purple50, iconColor: COLORS.purple600 },
                { icon: "forum", label: "Mis chats Pro", iconBg: COLORS.green50, iconColor: COLORS.green600 },
            ],
        },
        {
            title: "Agenda",
            items: [
                { icon: "calendar-month", label: "Gestión de citas", iconBg: COLORS.orange50, iconColor: COLORS.orange600 },
            ],
        },
        {
            title: "Tu Gemelo Digital IA",
            items: [
                { icon: "chat-bubble", label: "Respuestas del gemelo", iconBg: COLORS.indigo50, iconColor: COLORS.indigo600 },
                { icon: "history", label: "Historial de conversaciones", iconBg: COLORS.teal50, iconColor: COLORS.teal600 },
                { icon: "analytics", label: "Rendimiento del gemelo", iconBg: COLORS.rose50, iconColor: COLORS.rose600 },
                { icon: "tune", label: "Alcance y límites", iconBg: COLORS.cyan50, iconColor: COLORS.cyan600 },
            ],
        },
        {
            title: "Cuenta",
            items: [
                { icon: "credit-card", label: "Planes y créditos", iconBg: COLORS.gray100, iconColor: COLORS.gray600 },
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
            ]}
            onPress={item.onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: item.iconBg }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <Text style={[styles.menuItemLabel, item.isLogout && styles.menuItemLabelLogout]}>
                    {item.label}
                </Text>
            </View>
            {!item.isLogout && (
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
                <TouchableOpacity style={styles.profileButton} onPress={handleEditProfile}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
                    ) : (
                        <View style={styles.profileAvatarPlaceholder}>
                            <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                        </View>
                    )}
                    <View style={styles.onlineIndicator} />
                </TouchableOpacity>
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
                {/* Greeting & Edit Button */}
                <View style={styles.greetingSection}>
                    <View style={styles.greetingLeft}>
                        <View style={styles.greetingRow}>
                            <Text style={styles.greetingText}>Hola, {displayName}</Text>
                            <MaterialIcons name="waving-hand" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.greetingSubtext}>Gestiona tu negocio y tu IA</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                        <MaterialIcons name="edit" size={18} color={COLORS.textMain} />
                        <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                {/* Mi Negocio Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>MI NEGOCIO</Text>
                    <View style={styles.menuCard}>
                        {menuSections[0].items.map((item, i) => renderMenuItem(item, i, i === menuSections[0].items.length - 1))}
                    </View>
                </View>

                {/* Agenda Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>AGENDA</Text>
                    <View style={styles.menuCard}>
                        {menuSections[1].items.map((item, i) => renderMenuItem(item, i, true))}
                    </View>
                </View>

                {/* Tu Gemelo Digital IA Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>TU GEMELO DIGITAL IA</Text>

                    {/* AI Control Panel Button */}
                    <TouchableOpacity style={styles.aiControlButton} onPress={handleConfigureGemini}>
                        <View style={styles.aiControlLeft}>
                            <View style={styles.aiControlIcon}>
                                <MaterialIcons name="smart-toy" size={24} color="#FFFFFF" />
                            </View>
                            <View>
                                <Text style={styles.aiControlTitle}>Panel de Control</Text>
                                <Text style={styles.aiControlSubtitle}>Configura tu asistente de IA</Text>
                            </View>
                        </View>
                        <View style={styles.aiControlArrow}>
                            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.menuCard}>
                        {menuSections[2].items.map((item, i) => renderMenuItem(item, i, i === menuSections[2].items.length - 1))}
                    </View>
                </View>

                {/* Cuenta Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>CUENTA</Text>
                    <View style={styles.menuCard}>
                        {menuSections[3].items.map((item, i) => renderMenuItem(item, i, i === menuSections[3].items.length - 1))}
                    </View>
                </View>

                {/* Ayuda Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>AYUDA Y COMENTARIOS</Text>
                    <View style={styles.menuCard}>
                        {menuSections[4].items.map((item, i) => renderMenuItem(item, i, i === menuSections[4].items.length - 1))}
                    </View>
                </View>
            </ScrollView>

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
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.blue50 }]}>
                                            <MaterialIcons name="public" size={20} color={COLORS.blue600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Mi perfil público</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.yellow50 }]}>
                                            <MaterialIcons name="rate-review" size={20} color={COLORS.yellow600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Gestión de reseñas</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.purple50 }]}>
                                            <MaterialIcons name="schedule" size={20} color={COLORS.purple600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Mi horario laboral</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
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
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.orange50 }]}>
                                            <MaterialIcons name="calendar-month" size={20} color={COLORS.orange600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Gestión de citas</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Tu Gemelo Digital IA Section */}
                            <View style={styles.sideMenuSection}>
                                <Text style={styles.sideMenuSectionTitle}>TU GEMELO DIGITAL IA</Text>
                                {/* AI Control Panel Button */}
                                <TouchableOpacity style={styles.sideMenuAiButton}>
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
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
                                        <View style={[styles.sideMenuCardIcon, { backgroundColor: COLORS.teal50 }]}>
                                            <MaterialIcons name="history" size={20} color={COLORS.teal600} />
                                        </View>
                                        <Text style={styles.sideMenuCardLabel}>Historial de conversaciones</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                    <View style={styles.sideMenuCardDivider} />
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
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
                                    <TouchableOpacity style={styles.sideMenuCardItem}>
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
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
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
    sideMenuCardDivider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginLeft: 62,
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
});
