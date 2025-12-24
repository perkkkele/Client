import { router } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#FFEA00",
    black: "#000000",
    white: "#FFFFFF",
    backgroundLight: "#F3F4F6",
    surfaceLight: "#FFFFFF",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray900: "#111827",
    secondaryText: "#64748B",
    blue100: "#DBEAFE",
    blue600: "#2563EB",
    yellow700: "#A16207",
};

export default function ProfileTypeScreen() {
    function handleUserProfile() {
        router.push("/onboarding/register-user");
    }

    function handleProfessionalProfile() {
        // TODO: Navegar a registro de profesional
        router.push("/onboarding/register-user"); // Por ahora mismo flujo
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            {/* Header negro con ilustración */}
            <View style={styles.heroSection}>
                {/* Decorative backgrounds */}
                <View style={styles.decorBg1} />
                <View style={styles.decorBg2} />

                {/* Central avatar illustration */}
                <View style={styles.avatarSection}>
                    <View style={styles.orbitOuter} />
                    <View style={styles.orbitInner} />

                    <View style={styles.centralAvatar}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop" }}
                                style={styles.avatarImage}
                            />
                        </View>
                        <View style={styles.onlineBadge}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>On line</Text>
                        </View>
                    </View>

                    {/* Floating badges */}
                    <View style={[styles.floatingBadge, styles.badgeLegal]}>
                        <MaterialIcons name="gavel" size={14} color="#60A5FA" />
                        <Text style={styles.badgeText}>Legal</Text>
                    </View>
                    <View style={[styles.floatingBadge, styles.badgeBienestar]}>
                        <MaterialIcons name="spa" size={14} color="#FB923C" />
                        <Text style={styles.badgeText}>Bienestar</Text>
                    </View>
                    <View style={[styles.floatingBadge, styles.badgeSalud]}>
                        <MaterialIcons name="favorite" size={14} color="#EC4899" />
                        <Text style={styles.badgeText}>Salud</Text>
                    </View>
                </View>

                {/* Hero text */}
                <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Conecta con Expertos</Text>
                    <Text style={styles.heroSubtitle}>
                        Recibe ayuda instantánea con los gemelos digitales de profesionales reales.
                    </Text>
                </View>
            </View>

            {/* Content section */}
            <View style={styles.contentSection}>
                <View style={styles.questionSection}>
                    <Text style={styles.questionTitle}>¿Cómo quieres usar TwinPro?</Text>
                    <Text style={styles.questionSubtitle}>Selecciona tu perfil para comenzar</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {/* Usuario normal */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleUserProfile}
                        activeOpacity={0.95}
                    >
                        <View style={[styles.optionIcon, styles.optionIconBlue]}>
                            <MaterialIcons name="search" size={28} color={COLORS.blue600} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Necesito un profesional</Text>
                            <Text style={styles.optionSubtitle}>
                                Busco un experto de forma rápida y segura.
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray400} />
                    </TouchableOpacity>

                    {/* Usuario profesional */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleProfessionalProfile}
                        activeOpacity={0.95}
                    >
                        <View style={[styles.optionIcon, styles.optionIconYellow]}>
                            <MaterialIcons name="verified" size={28} color={COLORS.yellow700} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Soy un profesional</Text>
                            <Text style={styles.optionSubtitle}>
                                Quiero crear mi gemelo digital.
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    heroSection: {
        backgroundColor: COLORS.black,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: 32,
        paddingBottom: 32,
        paddingHorizontal: 20,
        flex: 0.62,
        overflow: "hidden",
        position: "relative",
    },
    decorBg1: {
        position: "absolute",
        top: "-20%",
        right: "-20%",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(30, 58, 138, 0.4)",
        borderRadius: 999,
        opacity: 0.3,
    },
    decorBg2: {
        position: "absolute",
        top: "20%",
        left: "-20%",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 234, 0, 0.1)",
        borderRadius: 999,
        opacity: 0.3,
    },
    avatarSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    orbitOuter: {
        position: "absolute",
        width: 256,
        height: 256,
        borderRadius: 128,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
    },
    orbitInner: {
        position: "absolute",
        width: 208,
        height: 208,
        borderRadius: 104,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.3)",
        borderStyle: "dashed",
    },
    centralAvatar: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarGlow: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255, 234, 0, 0.2)",
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        padding: 4,
        backgroundColor: "rgba(75, 85, 99, 0.8)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
        borderWidth: 4,
        borderColor: COLORS.black,
    },
    onlineBadge: {
        position: "absolute",
        bottom: -8,
        right: -32,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
        gap: 6,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22C55E",
        shadowColor: "#22C55E",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
    },
    onlineText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#E5E7EB",
    },
    floatingBadge: {
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
        gap: 6,
    },
    badgeLegal: {
        top: 20,
        left: 20,
    },
    badgeBienestar: {
        top: 60,
        left: 60,
    },
    badgeSalud: {
        top: 30,
        right: 30,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#E5E7EB",
    },
    heroText: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: "bold",
        color: COLORS.white,
        marginBottom: 8,
        textAlign: "center",
    },
    heroSubtitle: {
        fontSize: 15,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 22,
    },
    contentSection: {
        flex: 0.38,
        paddingHorizontal: 24,
        paddingVertical: 24,
        justifyContent: "center",
    },
    questionSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    questionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.gray900,
        marginBottom: 4,
    },
    questionSubtitle: {
        fontSize: 15,
        color: COLORS.secondaryText,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    optionIconBlue: {
        backgroundColor: COLORS.blue100,
    },
    optionIconYellow: {
        backgroundColor: "rgba(255, 234, 0, 0.2)",
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.gray900,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: COLORS.secondaryText,
    },
});
