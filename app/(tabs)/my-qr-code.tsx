import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Image,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context";
import { API_HOST, API_PORT } from "../../api";

// Colores del tema TwinPro
const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    textDark: "#181811",
    white: "#ffffff",
    gray100: "#f3f4f6",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    cardDark: "#2f2e16",
    borderDark: "#3a391d",
};

// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function MyQRCodeScreen() {
    const { user } = useAuth();

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname
        ? `${user.firstname}${user.lastname ? ` ${user.lastname}` : ""}`
        : user?.email?.split("@")[0] || "Usuario";
    const profession = user?.profession || "Profesional";
    const isVerified = user?.userType === "userpro";

    // Generar URL del código QR usando API pública
    const qrData = `twinpro://user/${user?._id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData)}&format=png&margin=10`;

    async function handleShare() {
        try {
            await Share.share({
                message: `Conéctate conmigo en TwinPro: ${displayName}\n\nDescarga TwinPro para chatear directamente conmigo.`,
                // url: qrCodeUrl, // iOS only
            });
        } catch (error) {
            console.log("Error sharing:", error);
        }
    }

    async function handleDownload() {
        // TODO: Implementar descarga de imagen QR
        console.log("Guardar QR");
    }

    async function handlePrint() {
        // TODO: Implementar impresión
        console.log("Imprimir QR");
    }

    function handleRefresh() {
        // TODO: Implementar regeneración de QR
        console.log("Actualizar QR");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Código QR</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Contenido principal */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Tarjeta QR */}
                <View style={styles.qrCard}>
                    {/* Sección de perfil */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={40} color={COLORS.gray400} />
                                </View>
                            )}
                            {isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <MaterialIcons name="verified" size={16} color={COLORS.textDark} />
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{displayName}</Text>
                            <Text style={styles.profileProfession}>{profession} • TwinPro</Text>
                        </View>
                    </View>

                    {/* Código QR */}
                    <View style={styles.qrContainer}>
                        <Image
                            source={{ uri: qrCodeUrl }}
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                        {/* Logo central */}
                        <View style={styles.qrLogoContainer}>
                            <View style={styles.qrLogo}>
                                <MaterialIcons name="chat-bubble" size={20} color={COLORS.textDark} />
                            </View>
                        </View>
                    </View>

                    {/* Texto de ayuda */}
                    <View style={styles.helperTextContainer}>
                        <Text style={styles.helperText}>
                            Escanea este código para conectar conmigo directamente en{" "}
                            <Text style={styles.helperTextBrand}>TwinPro</Text>
                        </Text>
                    </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <MaterialIcons name="share" size={22} color={COLORS.textDark} />
                        <Text style={styles.shareButtonText}>Compartir Código QR</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActionsRow}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
                            <MaterialIcons name="download" size={20} color={COLORS.textDark} />
                            <Text style={styles.secondaryButtonText}>Guardar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handlePrint}>
                            <MaterialIcons name="print" size={20} color={COLORS.textDark} />
                            <Text style={styles.secondaryButtonText}>Imprimir</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Enlace de actualización */}
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <MaterialIcons name="refresh" size={18} color={COLORS.gray500} />
                    <Text style={styles.refreshButtonText}>Actualizar mi código QR</Text>
                </TouchableOpacity>
            </ScrollView>
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
        color: COLORS.textDark,
        flex: 1,
        textAlign: "center",
        marginRight: 40, // Compensar el botón de atrás
    },
    headerSpacer: {
        width: 0,
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    // Tarjeta QR
    qrCard: {
        backgroundColor: COLORS.white,
        borderRadius: 32,
        padding: 24,
        alignItems: "center",
        gap: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },

    // Sección de perfil
    profileSection: {
        alignItems: "center",
        gap: 12,
        width: "100%",
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: COLORS.backgroundLight,
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.backgroundLight,
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    profileInfo: {
        alignItems: "center",
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textDark,
    },
    profileProfession: {
        fontSize: 14,
        color: COLORS.gray500,
        fontWeight: "500",
        marginTop: 4,
    },

    // Código QR
    qrContainer: {
        position: "relative",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 4,
        width: 260,
        height: 260,
        alignItems: "center",
        justifyContent: "center",
    },
    qrImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    qrLogoContainer: {
        position: "absolute",
        backgroundColor: COLORS.white,
        padding: 4,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    qrLogo: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    // Texto de ayuda
    helperTextContainer: {
        paddingHorizontal: 16,
    },
    helperText: {
        fontSize: 15,
        color: COLORS.textDark,
        textAlign: "center",
        lineHeight: 22,
    },
    helperTextBrand: {
        fontWeight: "bold",
        color: COLORS.primary,
    },

    // Botones de acción
    actionsContainer: {
        marginTop: 24,
        gap: 12,
    },
    shareButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        height: 56,
        paddingHorizontal: 24,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textDark,
        letterSpacing: 0.5,
    },
    secondaryActionsRow: {
        flexDirection: "row",
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
    },

    // Botón de actualización
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
        paddingVertical: 12,
    },
    refreshButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
});
