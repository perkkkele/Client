import { router } from "expo-router";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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
    function handleExplore() {
        // Navegar a la pantalla principal
        router.replace("/(tabs)");
    }

    return (
        <SafeAreaView style={styles.container}>
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
                    {/* Border decoration */}
                    <View style={styles.illustrationBorder} />

                    <View style={styles.illustration}>
                        {/* Left side - AI Avatar */}
                        <View style={styles.leftPanel}>
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=600&fit=crop" }}
                                style={styles.panelImage}
                            />
                            <View style={styles.leftOverlay} />
                            <View style={styles.leftLabel}>
                                <Text style={styles.labelTitle}>AVATARES IA ÚLTIMA GENERACIÓN</Text>
                                <Text style={styles.labelSubtitle}>Entrenados y personalizados</Text>
                            </View>
                        </View>

                        {/* Right side - Human Professional */}
                        <View style={styles.rightPanel}>
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=600&fit=crop" }}
                                style={styles.panelImage}
                            />
                            <View style={styles.rightOverlay} />
                            <View style={styles.rightLabel}>
                                <Text style={styles.labelTitle}>SOPORTE HUMANO REAL PROFESIONAL</Text>
                            </View>
                        </View>

                        {/* Divider line */}
                        <View style={styles.dividerLine} />

                        {/* Central icon */}
                        <View style={styles.centralIcon}>
                            <MaterialIcons name="graphic-eq" size={24} color={COLORS.primary} />
                        </View>
                    </View>
                </View>

                {/* Subtitle */}
                <View style={styles.subtitleContainer}>
                    <View style={styles.subtitleLine} />
                    <Text style={styles.subtitleBadge}>Sincronización Total</Text>
                    <View style={styles.subtitleLine} />
                </View>

                <Text style={styles.description}>
                    Ahora puedes empezar a conectar con expertos y disfrutar de todas las ventajas de TwinPro.
                </Text>

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
        paddingTop: 48,
        paddingBottom: 40,
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
        fontSize: 30,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 38,
        marginBottom: 24,
    },
    illustrationContainer: {
        width: "100%",
        aspectRatio: 1,
        maxWidth: 320,
        marginBottom: 24,
    },
    illustrationBorder: {
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        borderRadius: 36,
        borderWidth: 1,
        borderColor: "rgba(19, 127, 236, 0.2)",
    },
    illustration: {
        flex: 1,
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: COLORS.backgroundDark,
        flexDirection: "row",
        padding: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 10,
    },
    leftPanel: {
        flex: 1,
        borderRadius: 24,
        overflow: "hidden",
        marginRight: 4,
    },
    rightPanel: {
        flex: 1,
        borderRadius: 24,
        overflow: "hidden",
        marginLeft: 4,
    },
    panelImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    leftOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 230, 0, 0.1)",
    },
    rightOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
    leftLabel: {
        position: "absolute",
        bottom: 16,
        left: 8,
        right: 8,
        backgroundColor: "rgba(16, 25, 34, 0.9)",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    rightLabel: {
        position: "absolute",
        top: "20%",
        left: 8,
        right: 8,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    labelTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 0.5,
        textAlign: "center",
        marginBottom: 2,
    },
    labelSubtitle: {
        fontSize: 8,
        color: "#9CA3AF",
        textAlign: "center",
    },
    dividerLine: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 2,
        height: "60%",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        transform: [{ translateX: -1 }, { translateY: -30 }, { rotate: "-12deg" }],
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
        backgroundColor: "rgba(16, 25, 34, 0.8)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    subtitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    subtitleLine: {
        width: 32,
        height: 1,
        backgroundColor: "rgba(19, 127, 236, 0.5)",
    },
    subtitleBadge: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.primary,
        letterSpacing: 1,
        marginHorizontal: 12,
        textTransform: "uppercase",
    },
    description: {
        fontSize: 15,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 16,
        marginBottom: 32,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    exploreButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "600",
    },
});
