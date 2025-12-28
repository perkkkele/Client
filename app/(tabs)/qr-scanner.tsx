import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Colores del tema TwinPro
const COLORS = {
    primary: "#f9f506",
    backgroundDark: "#23220f",
    black: "#000000",
    white: "#ffffff",
    slate300: "#cbd5e1",
    slate700: "#334155",
    slate800: "#1e293b",
};

export default function QRScannerScreen() {
    const scanLineAnim = useRef(new Animated.Value(0)).current;

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
        outputRange: [0, 280], // Altura del marco de escaneo
    });

    return (
        <View style={styles.container}>
            {/* Fondo oscuro simulando cámara */}
            <View style={styles.cameraBackground}>
                <View style={styles.cameraOverlay} />
            </View>

            {/* Header */}
            <SafeAreaView style={styles.header} edges={["top"]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escanear Código QR</Text>
                <View style={styles.headerSpacer} />
            </SafeAreaView>

            {/* Contenido principal */}
            <View style={styles.mainContent}>
                {/* Marco de escaneo */}
                <View style={styles.scanFrame}>
                    {/* Esquinas del marco */}
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />

                    {/* Overlay interno */}
                    <View style={styles.scanFrameOverlay} />

                    {/* Línea de escaneo animada */}
                    <Animated.View
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY: scanLineTranslateY }] },
                        ]}
                    />

                    {/* Icono QR placeholder */}
                    <View style={styles.qrIconContainer}>
                        <MaterialIcons name="qr-code-2" size={100} color="rgba(255,255,255,0.1)" />
                    </View>
                </View>

                {/* Texto informativo */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>Escanear código</Text>
                    <Text style={styles.infoDescription}>
                        Apunta tu cámara al código QR de un profesional para iniciar el chat automáticamente.
                    </Text>
                </View>
            </View>

            {/* Botones de acción */}
            <SafeAreaView style={styles.actionsContainer} edges={["bottom"]}>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIconContainer}>
                            <MaterialIcons name="flashlight-on" size={24} color={COLORS.white} />
                        </View>
                        <Text style={styles.actionLabel}>Linterna</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIconContainer}>
                            <MaterialIcons name="image" size={24} color={COLORS.white} />
                        </View>
                        <Text style={styles.actionLabel}>Galería</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/my-qr-code")}>
                        <View style={styles.actionIconContainer}>
                            <MaterialIcons name="qr-code" size={24} color={COLORS.white} />
                        </View>
                        <Text style={styles.actionLabel}>Mi Código</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.black,
    },

    // Fondo de cámara
    cameraBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#111827",
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },

    // Header
    header: {
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
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
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

    // Contenido principal
    mainContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        zIndex: 10,
    },

    // Marco de escaneo
    scanFrame: {
        width: 288,
        height: 288,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.2)",
        position: "relative",
        overflow: "hidden",
    },
    scanFrameOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.05)",
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
        left: 0,
        right: 0,
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

    // Icono QR placeholder
    qrIconContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },

    // Texto informativo
    infoContainer: {
        marginTop: 32,
        alignItems: "center",
        maxWidth: 280,
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
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.slate300,
    },
});
