import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import Svg, { Circle, Rect, G, Text as SvgText, Path } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";

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
    black: "#000000",
};

// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

// TwinPro Logo component for QR center - matches main app logo
const TwinProLogo = () => (
    <View style={{
        width: 56,
        height: 56,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        backgroundColor: COLORS.black,
        borderWidth: 3,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    }}>
        <MaterialIcons name="group" size={28} color={COLORS.primary} />
    </View>
);

export default function MyQRCodeScreen() {
    const { user } = useAuth();
    const qrRef = useRef<any>(null);
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);

    const avatarUrl = getAvatarUrl(user?.avatar);
    const displayName = user?.firstname
        ? `${user.firstname}${user.lastname ? ` ${user.lastname}` : ""}`
        : user?.email?.split("@")[0] || "Usuario";
    const profession = user?.profession || "Profesional";
    const isVerified = user?.userType === "userpro";

    // Generar URL del código QR
    // Usar username si existe, sino usar el ID
    const qrData = user?.username
        ? `https://twinpro.app/@${user.username}`
        : `https://twinpro.app/user/${user?._id}`;

    async function handleShare() {
        if (isSharing) return;
        setIsSharing(true);

        try {
            // Check if sharing is available
            const isSharingAvailable = await Sharing.isAvailableAsync();

            if (isSharingAvailable && viewShotRef.current) {
                // Capture the QR card as image
                const uri = await (viewShotRef.current as any).capture();

                // Share the image
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Compartir mi código QR',
                });
            } else {
                // Fallback to text share if image sharing not available
                const shareMessage = `✨ *${displayName}* ✨
${profession}

🔗 Conéctate conmigo en TwinPro:
${qrData}

📱 Escanea mi código QR o haz clic en el enlace para chatear con mi gemelo digital.`;

                await Share.share({
                    message: shareMessage,
                });
            }
        } catch (error) {
            console.log("Error sharing:", error);
            // Fallback to text share on error
            try {
                await Share.share({
                    message: `Conéctate conmigo en TwinPro: ${displayName}\n\n${qrData}`,
                });
            } catch (e) {
                console.log("Fallback share error:", e);
            }
        } finally {
            setIsSharing(false);
        }
    }

    async function handleDownload() {
        try {
            // Request media library permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    "Permiso Requerido",
                    "Necesitamos acceso a tu galería para guardar el código QR."
                );
                return;
            }

            if (!viewShotRef.current) {
                Alert.alert("Error", "No se pudo capturar la imagen");
                return;
            }

            // Capture the QR card as image
            const uri = await (viewShotRef.current as any).capture();

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync("TwinPro", asset, false);

            Alert.alert(
                "¡Guardado!",
                "Tu código QR se ha guardado en la galería (álbum TwinPro)"
            );
        } catch (error) {
            console.error("Error saving QR:", error);
            Alert.alert("Error", "No se pudo guardar el código QR");
        }
    }

    async function handlePrint() {
        try {
            if (!viewShotRef.current) {
                Alert.alert("Error", "No se pudo capturar la imagen para imprimir");
                return;
            }

            // Capture the QR card as image
            const uri = await (viewShotRef.current as any).capture();

            // Read the image as base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Create HTML with the QR image for printing
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                            box-sizing: border-box;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        .container {
                            text-align: center;
                        }
                        .title {
                            font-family: Arial, sans-serif;
                            font-size: 24px;
                            margin-bottom: 20px;
                            color: #181811;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="title">Mi Código QR - TwinPro</h1>
                        <img src="data:image/png;base64,${base64}" />
                    </div>
                </body>
                </html>
            `;

            // Open print dialog
            await Print.printAsync({ html });
        } catch (error) {
            console.error("Error printing QR:", error);
            Alert.alert("Error", "No se pudo imprimir el código QR");
        }
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
                {/* Tarjeta QR - envuelta en ViewShot para captura */}
                <ViewShot
                    ref={viewShotRef}
                    options={{
                        format: "png",
                        quality: 1,
                        result: "tmpfile"
                    }}
                    style={styles.viewShotContainer}
                >
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

                        {/* Código QR Corporativo TwinPro */}
                        <View style={styles.qrContainer}>
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={qrData}
                                    size={240}
                                    backgroundColor={COLORS.primary}
                                    color={COLORS.black}
                                    logo={undefined}
                                    logoSize={70}
                                    logoBackgroundColor="transparent"
                                    logoMargin={0}
                                    logoBorderRadius={12}
                                    quietZone={15}
                                    getRef={(ref) => (qrRef.current = ref)}
                                    ecl="M" // Medium error correction to allow logo
                                />
                                {/* Logo overlay in center */}
                                <View style={styles.logoOverlay}>
                                    <TwinProLogo />
                                </View>
                            </View>
                        </View>

                        {/* Texto de ayuda */}
                        <View style={styles.helperTextContainer}>
                            <Text style={styles.helperText}>
                                Escanea este código para conectar conmigo directamente en{" "}
                                <Text style={styles.helperTextBrand}>TwinPro</Text>
                            </Text>
                            {/* URL discreta para escribir en navegador */}
                            <Text style={styles.urlText}>{qrData.replace('https://', '')}</Text>
                        </View>
                    </View>
                </ViewShot>

                {/* Botones de acción */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
                        onPress={handleShare}
                        disabled={isSharing}
                    >
                        {isSharing ? (
                            <ActivityIndicator size="small" color={COLORS.textDark} />
                        ) : (
                            <MaterialIcons name="share" size={22} color={COLORS.textDark} />
                        )}
                        <Text style={styles.shareButtonText}>
                            {isSharing ? "Preparando imagen..." : "Compartir Código QR"}
                        </Text>
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
        marginRight: 40,
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

    // ViewShot container
    viewShotContainer: {
        backgroundColor: COLORS.backgroundLight,
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
        alignItems: "center",
        justifyContent: "center",
    },
    qrWrapper: {
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        // Add subtle border to match the premium look
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    logoOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        color: COLORS.textDark,
    },
    urlText: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "center",
        marginTop: 8,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        letterSpacing: 0.5,
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
    shareButtonDisabled: {
        opacity: 0.7,
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
