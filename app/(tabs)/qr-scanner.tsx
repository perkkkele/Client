import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context";
import * as ImagePicker from "expo-image-picker";
import { useAlert } from "../../components/TwinProAlert";
import useSubscription from "../../hooks/useSubscription";
import UpgradeModal from "../../components/UpgradeModal";
import { useTranslation } from "react-i18next";

// Colores del tema TwinPro
const COLORS = {
    primary: "#f9f506",
    backgroundDark: "#23220f",
    black: "#000000",
    white: "#ffffff",
    slate300: "#cbd5e1",
    slate700: "#334155",
    slate800: "#1e293b",
    gray400: "#9ca3af",
};

// Intentar importar expo-camera de forma segura
let CameraView: any = null;
let useCameraPermissions: any = null;

try {
    const ExpoCamera = require("expo-camera");
    CameraView = ExpoCamera.CameraView;
    useCameraPermissions = ExpoCamera.useCameraPermissions;
} catch (e) {
    console.log("expo-camera not available, using fallback");
}

// Note: Gallery QR scanning is temporarily disabled
// expo-barcode-scanner was removed due to being deprecated and causing build failures
// A future update will use jsQR or rn-qr-generator for this feature

export default function QRScannerScreen() {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const { canAccess, getRequiredPlan } = useSubscription();
    const { t } = useTranslation("settings");
    const [hasCamera, setHasCamera] = useState(CameraView !== null);
    const [permission, setPermission] = useState<any>(null);
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const isProfessional = user?.userType === 'userpro';
    const hasQrAccess = canAccess('qrCode');

    function handleMyQRCode() {
        if (!hasQrAccess) {
            setShowUpgradeModal(true);
            return;
        }
        router.push("/(tabs)/my-qr-code");
    }

    // Usar hook de permisos solo si la cámara está disponible
    const cameraPermission = useCameraPermissions ? useCameraPermissions() : [null, () => { }];
    const [permissionInfo, requestPermission] = cameraPermission;

    useEffect(() => {
        if (permissionInfo) {
            setPermission(permissionInfo);
        }
    }, [permissionInfo]);

    useEffect(() => {
        // Animación de la línea de escaneo
        const scanAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        );
        scanAnimation.start();

        return () => scanAnimation.stop();
    }, [scanLineAnim]);

    const scanLineTranslateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 280],
    });

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;

        setScanned(true);

        let username: string | null = null;

        // Check for deep link format: twinpro://user/{userId}
        if (data.startsWith("twinpro://user/")) {
            const professionalId = data.replace("twinpro://user/", "");
            showAlert({
                type: 'warning',
                title: t("qrScannerScreen.scannedTitle"),
                message: t("qrScannerScreen.scannedMessage"),
                buttons: [
                    {
                        text: t("qrScannerScreen.cancel"),
                        onPress: () => setScanned(false),
                        style: "cancel",
                    },
                    {
                        text: t("qrScannerScreen.startChat"),
                        onPress: () => {
                            router.replace(`/avatar-chat/${professionalId}`);
                        },
                    },
                ]
            });
            return;
        }

        // Check for web URL format: https://twinpro.app/@username or twinpro.app/@username
        const webUrlMatch = data.match(/(?:https?:\/\/)?twinpro\.app\/@([a-zA-Z0-9_-]+)/);
        if (webUrlMatch && webUrlMatch[1]) {
            username = webUrlMatch[1];
        }

        if (username) {
            // Fetch the professional ID by username
            try {
                const { API_URL } = require("../../api");
                const response = await fetch(`${API_URL}/users/by-username/${username}`);
                if (response.ok) {
                    const professional = await response.json();
                    // Navigate directly to chat without confirmation
                    router.replace(`/avatar-chat/${professional._id}`);
                } else {
                    showAlert({
                        type: 'info',
                        title: t("qrScannerScreen.notFoundTitle"),
                        message: '',
                        buttons: [{ text: "OK", onPress: () => setScanned(false) }]
                    });
                }
            } catch (error) {
                showAlert({
                    type: 'error',
                    title: t("qrScannerScreen.connectionError"),
                    message: t("qrScannerScreen.connectionErrorMsg"),
                    buttons: [{ text: "OK", onPress: () => setScanned(false) }]
                });
            }
        } else {
            showAlert({
                type: 'warning',
                title: t("qrScannerScreen.invalidCodeTitle"),
                message: t("qrScannerScreen.invalidCodeMsg"),
                buttons: [{ text: "OK", onPress: () => setScanned(false) }]
            });
        }
    };

    const toggleFlash = () => {
        setFlashOn(!flashOn);
    };

    // Pick image from gallery and scan QR code
    // NOTE: Gallery QR scanning is temporarily disabled
    // expo-barcode-scanner was removed due to being deprecated and causing build failures
    const pickImageFromGallery = async () => {
        showAlert({
            type: 'info',
            title: t("qrScannerScreen.galleryDisabledTitle"),
            message: t("qrScannerScreen.galleryDisabledMsg"),
            buttons: [{ text: "OK" }]
        });
    };

    // Si la cámara no está disponible (Expo Go sin development build)
    if (!hasCamera) {
        return (
            <View style={styles.container}>
                <View style={styles.fallbackOverlay}>
                    {/* Marco de escaneo simulado */}
                    <View style={styles.scanAreaFallback}>
                        <View style={[styles.corner, styles.cornerTopLeft]} />
                        <View style={[styles.corner, styles.cornerTopRight]} />
                        <View style={[styles.corner, styles.cornerBottomLeft]} />
                        <View style={[styles.corner, styles.cornerBottomRight]} />

                        {/* Línea de escaneo animada */}
                        <Animated.View
                            style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLineTranslateY }] },
                            ]}
                        />

                        {/* Icono de cámara */}
                        <View style={styles.cameraIconContainer}>
                            <MaterialIcons name="camera-alt" size={64} color={COLORS.gray400} />
                        </View>
                    </View>
                </View>

                {/* Header */}
                <SafeAreaView style={styles.header} edges={["top"]}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => router.back()}
                    >
                        <MaterialIcons name="close" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("qrScannerScreen.title")}</Text>
                    <View style={styles.headerSpacer} />
                </SafeAreaView>

                {/* Mensaje de desarrollo requerido */}
                <View style={styles.devBuildContainer}>
                    <View style={styles.devBuildCard}>
                        <MaterialIcons name="build" size={32} color={COLORS.primary} />
                        <Text style={styles.devBuildTitle}>{t("qrScannerScreen.devBuildTitle")}</Text>
                        <Text style={styles.devBuildDescription}>
                            {t("qrScannerScreen.devBuildDesc")}
                        </Text>
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeText}>npx expo run:android</Text>
                            <Text style={styles.codeTextSmall}>o</Text>
                            <Text style={styles.codeText}>npx expo run:ios</Text>
                        </View>
                    </View>
                </View>

                {/* Botones de acción */}
                <SafeAreaView style={styles.actionsContainer} edges={["bottom"]}>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={toggleFlash}>
                            <View style={[styles.actionIconContainer, flashOn && styles.actionIconActive]}>
                                <MaterialIcons
                                    name={flashOn ? "flashlight-on" : "flashlight-off"}
                                    size={24}
                                    color={flashOn ? COLORS.black : COLORS.white}
                                />
                            </View>
                            <Text style={styles.actionLabel}>{t("qrScannerScreen.flashlight")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={pickImageFromGallery}>
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="image" size={24} color={COLORS.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t("qrScannerScreen.gallery")}</Text>
                        </TouchableOpacity>

                        {isProfessional && (
                            <TouchableOpacity style={styles.actionButton} onPress={handleMyQRCode}>
                                <View style={styles.actionIconContainer}>
                                    <MaterialIcons name="qr-code" size={24} color={COLORS.white} />
                                    {!hasQrAccess && (
                                        <View style={styles.proBadge}>
                                            <Text style={styles.proBadgeText}>PRO</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.actionLabel}>{t("qrScannerScreen.myCode")}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>

                <UpgradeModal
                    visible={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    featureName={t("qrScannerScreen.qrFeatureName")}
                    requiredPlan={getRequiredPlan('qrCode') || 'professional'}
                />
            </View>
        );
    }

    // Cargando permisos
    if (!permission) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>{t("qrScannerScreen.loadingCamera")}</Text>
            </View>
        );
    }

    // Sin permisos
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionContent}>
                    <View style={styles.permissionIconContainer}>
                        <MaterialIcons name="camera-alt" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.permissionTitle}>{t("qrScannerScreen.cameraAccess")}</Text>
                    <Text style={styles.permissionDescription}>
                        {t("qrScannerScreen.cameraAccessDesc")}
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>{t("qrScannerScreen.allowAccess")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>{t("qrScannerScreen.cancel")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Cámara disponible y con permisos
    return (
        <View style={styles.container}>
            {/* Cámara */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={flashOn}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay oscuro con hueco para el marco */}
            <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                    <View style={styles.overlaySide} />
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.cornerTopLeft]} />
                        <View style={[styles.corner, styles.cornerTopRight]} />
                        <View style={[styles.corner, styles.cornerBottomLeft]} />
                        <View style={[styles.corner, styles.cornerBottomRight]} />
                        <Animated.View
                            style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLineTranslateY }] },
                            ]}
                        />
                    </View>
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            {/* Header */}
            <SafeAreaView style={styles.header} edges={["top"]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("qrScannerScreen.title")}</Text>
                <View style={styles.headerSpacer} />
            </SafeAreaView>

            {/* Texto informativo */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>{t("qrScannerScreen.scanCode")}</Text>
                <Text style={styles.infoDescription}>
                    {t("qrScannerScreen.scanCodeDesc")}
                </Text>
            </View>

            {/* Botones de acción */}
            <SafeAreaView style={styles.actionsContainer} edges={["bottom"]}>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={toggleFlash}>
                        <View style={[styles.actionIconContainer, flashOn && styles.actionIconActive]}>
                            <MaterialIcons
                                name={flashOn ? "flashlight-on" : "flashlight-off"}
                                size={24}
                                color={flashOn ? COLORS.black : COLORS.white}
                            />
                        </View>
                        <Text style={styles.actionLabel}>{t("qrScannerScreen.flashlight")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={pickImageFromGallery}>
                        <View style={styles.actionIconContainer}>
                            <MaterialIcons name="image" size={24} color={COLORS.white} />
                        </View>
                        <Text style={styles.actionLabel}>Galería</Text>
                    </TouchableOpacity>

                    {isProfessional && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleMyQRCode}>
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="qr-code" size={24} color={COLORS.white} />
                                {!hasQrAccess && (
                                    <View style={styles.proBadge}>
                                        <Text style={styles.proBadgeText}>PRO</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.actionLabel}>{t("qrScannerScreen.myCode")}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

            <UpgradeModal
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Código QR Personalizado"
                requiredPlan={getRequiredPlan('qrCode') || 'professional'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.black,
    },

    // Overlay para oscurecer los bordes
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    overlayMiddle: {
        flexDirection: "row",
    },
    overlaySide: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    scanArea: {
        width: 280,
        height: 280,
        position: "relative",
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },

    // Fallback cuando no hay cámara
    fallbackOverlay: {
        flex: 1,
        backgroundColor: COLORS.slate800,
        alignItems: "center",
        justifyContent: "center",
    },
    scanAreaFallback: {
        width: 280,
        height: 280,
        position: "relative",
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 16,
        marginTop: -60,
    },
    cameraIconContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },

    // Development build message
    devBuildContainer: {
        position: "absolute",
        bottom: 180,
        left: 24,
        right: 24,
    },
    devBuildCard: {
        backgroundColor: "rgba(30, 41, 59, 0.95)",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.slate700,
    },
    devBuildTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
        marginTop: 12,
        marginBottom: 8,
    },
    devBuildDescription: {
        fontSize: 13,
        color: COLORS.slate300,
        textAlign: "center",
        lineHeight: 18,
    },
    codeBlock: {
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        width: "100%",
        alignItems: "center",
    },
    codeText: {
        fontSize: 12,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        color: COLORS.primary,
    },
    codeTextSmall: {
        fontSize: 10,
        color: COLORS.slate300,
        marginVertical: 4,
    },

    // Esquinas del marco
    corner: {
        position: "absolute",
        width: 32,
        height: 32,
        borderColor: COLORS.primary,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 16,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 16,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 16,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 16,
    },

    // Línea de escaneo
    scanLine: {
        position: "absolute",
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: COLORS.primary,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 15,
            },
            android: {
                elevation: 8,
            },
        }),
    },

    // Header
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    headerSpacer: {
        width: 40,
    },

    // Texto informativo
    infoContainer: {
        position: "absolute",
        bottom: 180,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingHorizontal: 40,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.white,
        marginBottom: 8,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    infoDescription: {
        fontSize: 14,
        color: COLORS.slate300,
        textAlign: "center",
        lineHeight: 20,
    },

    // Botones de acción
    actionsContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        paddingBottom: 24,
        zIndex: 20,
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
    },
    actionButton: {
        alignItems: "center",
        gap: 8,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        borderWidth: 1,
        borderColor: COLORS.slate700,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.slate300,
    },
    proBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#3b82f6",
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
        minWidth: 28,
        alignItems: "center",
    },
    proBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },

    // Pantalla de permisos
    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.black,
        alignItems: "center",
        justifyContent: "center",
    },
    permissionContent: {
        alignItems: "center",
        paddingHorizontal: 40,
    },
    permissionIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "rgba(249, 245, 6, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.white,
        marginBottom: 12,
    },
    permissionDescription: {
        fontSize: 15,
        color: COLORS.slate300,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    permissionText: {
        fontSize: 16,
        color: COLORS.white,
    },
    permissionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.black,
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelButtonText: {
        fontSize: 14,
        color: COLORS.slate300,
    },
});
