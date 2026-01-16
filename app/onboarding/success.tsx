import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Animated,
    Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    backgroundDark: "#101922",
    cardLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#637588",
    success: "#22C55E",
};

export default function SuccessScreen() {
    // Pulse animation for central icon
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Create pulsing animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, [pulseAnim]);

    function handleExplore() {
        // Navegar a la pantalla principal
        router.replace("/(tabs)");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
            {/* Decorative backgrounds */}
            <View style={styles.decorBg1} />
            <View style={styles.decorBg2} />
            <View style={styles.gridPattern} />

            {/* Main content */}
            <View style={styles.content}>
                {/* Success icon */}
                <View style={styles.successBadge}>
                    <MaterialIcons name="check-circle" size={28} color={COLORS.success} />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    ¡Felicidades,{"\n"}tu perfil está listo!
                </Text>

                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    {/* Outer border decoration */}
                    <View style={styles.outerBorderDecor} />

                    {/* Decorative dots */}
                    <View style={styles.decorDots}>
                        <View style={styles.decorDot1} />
                        <View style={styles.decorDot2} />
                    </View>

                    {/* Main illustration frame */}
                    <View style={styles.illustrationFrame}>
                        <View style={styles.illustration}>
                            {/* Left side - AI Avatar */}
                            <View style={styles.leftPanel}>
                                <Image
                                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgvvz52P6zKeYUB_443iT4PbGllqDrFWuhwIM8jpf-Smb4QXgaHYxIU8GTouYh9hF3OEK6aJ92f3Qk2epceFEM6hXSjnu90znhkwhlCMKSGAhaBIrGm3ffL3zIUJFGQ8Ffvm-oKwv1psH_nzTYvIZGLhe7YuCGASn67fYvbdbsCPQMa4cSH905U465--XCXfgadizVHC_nMVHTzYQFF2EQPCy8K_xj-B3NQs9UFaTsUcsOhWglF-RlzJj2hqZv587_VV3vxpDjVg" }}
                                    style={styles.panelImage}
                                />
                                <View style={styles.leftOverlay} />
                                <View style={styles.leftGradient} />

                                {/* AI Avatar label */}
                                <View style={styles.leftLabel}>
                                    <Text style={styles.labelTitleBold}>AVATARES IA ÚLTIMA GENERACIÓN</Text>
                                    <Text style={styles.labelSubtitle}>Entrenados y personalizados</Text>
                                </View>
                            </View>

                            {/* Right side - Human Professional */}
                            <View style={styles.rightPanel}>
                                <Image
                                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6poAtSxJ112iYVWeMTD3bI0_hXR1LkssBydLQe9ApQbKTCi0TN0sGw0UPNSvRpo7UxlsVDy5gbPFXAvQSC23CvyEhmxQy87Zddpxja-mpOpnKGpAQ6G9nKLVJCkGCAMfRmroQ-dWQ-qwuMMsLKOabfGPLT320OBhxw2dratj25wmHiK0UpdlUctt1RCblMhGWtPcbGnKTTWODOgBXx_Z0S_70lG8201SjbGKQ3QZc_4tMweNoiwmCoKvLTQpRJDX9Qm5dH5aO2Q" }}
                                    style={styles.panelImage}
                                />
                                <View style={styles.rightOverlay} />

                                {/* Human support label - top */}
                                <View style={styles.rightLabelTop}>
                                    <Text style={styles.labelTitleBold}>SOPORTE HUMANO REAL PROFESIONAL</Text>
                                </View>
                            </View>

                            {/* Diagonal divider line - no skew, positioned diagonally */}
                            <View style={styles.dividerLine} />

                            {/* Central icon with pulse animation */}
                            <Animated.View style={[styles.centralIcon, { transform: [{ scale: pulseAnim }] }]}>
                                <MaterialIcons name="graphic-eq" size={24} color={COLORS.primary} />
                            </Animated.View>
                        </View>
                    </View>
                </View>

                {/* Subtitle */}
                <View style={styles.subtitleContainer}>
                    <View style={styles.subtitleLineLeft} />
                    <Text style={styles.subtitleBadge}>SINCRONIZACIÓN TOTAL</Text>
                    <View style={styles.subtitleLineRight} />
                </View>

                <Text style={styles.description}>
                    Ahora puedes empezar a conectar con expertos y disfrutar de todas las ventajas de TwinPro.
                </Text>

                {/* Spacer to push button to bottom */}
                <View style={{ flex: 1 }} />

                {/* CTA Button */}
                <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={handleExplore}
                    activeOpacity={0.9}
                >
                    <Text style={styles.exploreButtonText}>Empezar a explorar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    decorBg1: {
        position: "absolute",
        top: "-5%",
        right: "-20%",
        width: 450,
        height: 450,
        borderRadius: 225,
        backgroundColor: "rgba(19, 127, 236, 0.05)",
    },
    decorBg2: {
        position: "absolute",
        bottom: "10%",
        left: "-10%",
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: "rgba(37, 99, 235, 0.05)",
    },
    gridPattern: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
    },
    content: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    successBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(34, 197, 94, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 36,
        marginBottom: 20,
    },
    illustrationContainer: {
        width: "100%",
        aspectRatio: 1,
        maxWidth: 300,
        marginBottom: 20,
        position: "relative",
    },
    outerBorderDecor: {
        position: "absolute",
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: "rgba(19, 127, 236, 0.2)",
    },
    decorDots: {
        position: "absolute",
        top: 32,
        right: -16,
        gap: 12,
    },
    decorDot1: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(19, 127, 236, 0.4)",
        marginBottom: 12,
    },
    decorDot2: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(19, 127, 236, 0.2)",
    },
    illustrationFrame: {
        flex: 1,
        borderRadius: 32,
        padding: 8,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 12,
    },
    illustration: {
        flex: 1,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: COLORS.backgroundDark,
        flexDirection: "row",
    },
    leftPanel: {
        width: "55%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
    },
    rightPanel: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "55%",
        overflow: "hidden",
    },
    panelImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    leftOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(19, 127, 236, 0.15)",
    },
    leftGradient: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "25%",
        backgroundColor: "rgba(16, 25, 34, 0.4)",
    },
    rightOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    leftLabel: {
        position: "absolute",
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: "rgba(16, 25, 34, 0.9)",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
    },
    rightLabelTop: {
        position: "absolute",
        top: "18%",
        right: 8,
        left: 16,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    labelTitleBold: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 0.5,
        textAlign: "center",
        textTransform: "uppercase",
    },
    labelSubtitle: {
        fontSize: 8,
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 2,
    },
    dividerLine: {
        position: "absolute",
        top: -10,
        bottom: -10,
        left: "48%",
        width: 2,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        transform: [{ rotate: "5deg" }],
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    centralIcon: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 56,
        height: 56,
        marginLeft: -28,
        marginTop: -28,
        borderRadius: 28,
        backgroundColor: "rgba(16, 25, 34, 0.9)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    subtitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        marginTop: 8,
    },
    subtitleLineLeft: {
        width: 32,
        height: 1,
        backgroundColor: "transparent",
        borderTopWidth: 1,
        borderTopColor: "rgba(19, 127, 236, 0.5)",
    },
    subtitleLineRight: {
        width: 32,
        height: 1,
        backgroundColor: "transparent",
        borderTopWidth: 1,
        borderTopColor: "rgba(19, 127, 236, 0.5)",
    },
    subtitleBadge: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.primary,
        letterSpacing: 2,
        marginHorizontal: 12,
        opacity: 0.7,
    },
    description: {
        fontSize: 15,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    exploreButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        gap: 12,
        width: "100%",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    exploreButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "600",
    },
});
