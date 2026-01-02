import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { API_HOST, API_PORT, userApi } from "../../api";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    textMuted: "#9CA3AF",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray800: "#1F2937",
    blue100: "#DBEAFE",
    blue600: "#2563EB",
    orange100: "#FFEDD5",
    orange600: "#EA580C",
    red100: "#FEE2E2",
    red600: "#DC2626",
    green100: "#DCFCE7",
    green600: "#16A34A",
};

interface SettingsItem {
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    value?: string;
    isDestructive?: boolean;
    onPress?: () => void;
}

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function SettingsScreen() {
    const { user, token, updateUserProfile } = useAuth();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname
        ? `${user.firstname}${user.lastname ? ` ${user.lastname}` : ""}`
        : "Usuario Anónimo";
    const username = user?.email?.split("@")[0] || "usuario";

    function handleBack() {
        router.back();
    }

    async function pickImage() {
        // Pedir permiso
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar tu foto.");
            return;
        }

        // Seleccionar imagen
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            handleChangeAvatar(result.assets[0].uri);
        }
    }

    async function handleChangeAvatar(imageUri: string) {
        if (!token) {
            Alert.alert("Error", "No hay sesión activa");
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const updatedUser = await userApi.updateAvatar(token, imageUri);
            await updateUserProfile(updatedUser);
            Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
        } catch (error: any) {
            console.error("Error updating avatar:", error.message || error);
            Alert.alert("Error", error.message || "No se pudo actualizar la foto de perfil");
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    function handleEditProfile() {
        router.push("/(settings)/edit-profile");
    }

    function handleLogout() {
        router.push("/(tabs)/logout-confirm");
    }

    function handleDeleteAccount() {
        router.push("/(tabs)/delete-account");
    }

    // Appointments section items
    const appointmentItems: SettingsItem[] = [
        {
            icon: "event-available",
            iconColor: COLORS.green600,
            iconBg: COLORS.green100,
            label: "Próximas citas",
            onPress: () => router.push("/(settings)/my-appointments?tab=upcoming"),
        },
        {
            icon: "history",
            iconColor: COLORS.green600,
            iconBg: COLORS.green100,
            label: "Historial de citas",
            onPress: () => router.push("/(settings)/my-appointments?tab=history"),
        },
    ];

    const personalizationItems: SettingsItem[] = [
        {
            icon: "language",
            iconColor: COLORS.orange600,
            iconBg: COLORS.orange100,
            label: "Idioma",
            value: "Español",
        },
    ];

    const helpItems: SettingsItem[] = [
        {
            icon: "help",
            iconColor: COLORS.blue600,
            iconBg: COLORS.blue100,
            label: "Centro de ayuda",
            onPress: () => router.push("/(settings)/help-center"),
        },
        {
            icon: "support-agent",
            iconColor: COLORS.blue600,
            iconBg: COLORS.blue100,
            label: "Contactar con soporte",
            onPress: () => router.push("/(settings)/contact-support"),
        },
        {
            icon: "feedback",
            iconColor: COLORS.blue600,
            iconBg: COLORS.blue100,
            label: "Enviar comentarios",
            onPress: () => router.push("/(settings)/send-feedback"),
        },
        {
            icon: "description",
            iconColor: COLORS.blue600,
            iconBg: COLORS.blue100,
            label: "Condiciones y Política de privacidad",
            onPress: () => router.push("/(settings)/terms-privacy"),
        },
        {
            icon: "info",
            iconColor: COLORS.blue600,
            iconBg: COLORS.blue100,
            label: "Info de la aplicación",
            onPress: () => router.push("/(settings)/app-info"),
        },
    ];

    const accountItems: SettingsItem[] = [
        {
            icon: "logout",
            iconColor: COLORS.gray600,
            iconBg: COLORS.gray100,
            label: "Cerrar sesión",
            onPress: handleLogout,
        },
        {
            icon: "delete-forever",
            iconColor: COLORS.red600,
            iconBg: COLORS.red100,
            label: "Eliminar cuenta definitivamente",
            isDestructive: true,
            onPress: handleDeleteAccount,
        },
    ];

    function renderSettingsGroup(title: string, items: SettingsItem[]) {
        return (
            <View style={styles.settingsGroup}>
                <Text style={styles.groupTitle}>{title}</Text>
                <View style={styles.groupCard}>
                    {items.map((item, index) => (
                        <View key={item.label}>
                            <TouchableOpacity
                                style={[
                                    styles.settingsItem,
                                    item.isDestructive && styles.settingsItemDestructive,
                                ]}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.settingsItemLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                                        <MaterialIcons name={item.icon as any} size={18} color={item.iconColor} />
                                    </View>
                                    <Text
                                        style={[
                                            styles.settingsItemLabel,
                                            item.isDestructive && styles.settingsItemLabelDestructive,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                </View>
                                <View style={styles.settingsItemRight}>
                                    {item.value && <Text style={styles.settingsItemValue}>{item.value}</Text>}
                                    <MaterialIcons name="chevron-right" size={18} color={COLORS.gray400} />
                                </View>
                            </TouchableOpacity>
                            {index < items.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajustes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        disabled={isUploadingAvatar}
                        activeOpacity={0.8}
                    >
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={48} color={COLORS.gray400} />
                            </View>
                        )}
                        {isUploadingAvatar && (
                            <View style={styles.avatarLoading}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        )}
                        <View style={styles.editAvatarButton}>
                            <MaterialIcons name="edit" size={14} color="#000000" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Text style={styles.username}>@{username}</Text>
                    <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                        <Text style={styles.editProfileButtonText}>Editar perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Groups */}
                {renderSettingsGroup("Mis Citas", appointmentItems)}
                {renderSettingsGroup("Personalización", personalizationItems)}
                {renderSettingsGroup("Ayuda y Comentarios", helpItems)}
                {renderSettingsGroup("Gestión de Cuenta", accountItems)}
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
        backgroundColor: COLORS.backgroundLight,
    },
    backButton: {
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    // Profile Section
    profileSection: {
        alignItems: "center",
        paddingVertical: 24,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    avatarLoading: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    editAvatarButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    displayName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 16,
    },
    editProfileButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    editProfileButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    // Settings Groups
    settingsGroup: {
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    groupCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    settingsItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    settingsItemDestructive: {
        // No additional styles needed, handled by text color
    },
    settingsItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsItemLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textMain,
        flex: 1,
    },
    settingsItemLabelDestructive: {
        color: COLORS.red600,
    },
    settingsItemRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    settingsItemValue: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginLeft: 56,
    },
});
