import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#FFEA00",
    black: "#000000",
    white: "#FFFFFF",
    backgroundLight: "#F3F4F6",
    surfaceLight: "#FFFFFF",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    secondaryText: "#64748B",
    blue100: "#DBEAFE",
    blue400: "#60A5FA",
    blue600: "#2563EB",
    blue900: "#1E3A8A",
    yellow700: "#A16207",
    orange400: "#FB923C",
    pink400: "#F472B6",
    teal300: "#5EEAD4",
    red400: "#F87171",
    green500: "#22C55E",
};

export default function ProfileTypeScreen() {
    // Animation refs for orbits
    const orbitOuterRotation = useRef(new Animated.Value(0)).current;
    const orbitInnerRotation = useRef(new Animated.Value(0)).current;

    // Animation refs for floating badges
    const badgeLegalAnim = useRef(new Animated.Value(0)).current;
    const badgeBienestarAnim = useRef(new Animated.Value(0)).current;
    const badgeSaludAnim = useRef(new Animated.Value(0)).current;
    const badgeHeartAnim = useRef(new Animated.Value(0)).current;
    const badgeAudioAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Orbit outer rotation - slow
        Animated.loop(
            Animated.timing(orbitOuterRotation, {
                toValue: 1,
                duration: 20000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Orbit inner rotation - reverse
        Animated.loop(
            Animated.timing(orbitInnerRotation, {
                toValue: -1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Floating badge animations - gentle bounce
        const createBounceAnimation = (animValue: Animated.Value, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        createBounceAnimation(badgeLegalAnim, 2000).start();
        createBounceAnimation(badgeBienestarAnim, 2750).start();
        createBounceAnimation(badgeSaludAnim, 2250).start();
        createBounceAnimation(badgeHeartAnim, 1750).start();
        createBounceAnimation(badgeAudioAnim, 2250).start();
    }, []);

    const orbitOuterSpin = orbitOuterRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const orbitInnerSpin = orbitInnerRotation.interpolate({
        inputRange: [-1, 0],
        outputRange: ['-360deg', '0deg'],
    });

    const createBounceTranslate = (animValue: Animated.Value) => {
        return animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -8],
        });
    };

    function handleUserProfile() {
        router.push("/onboarding/register-user");
    }

    function handleProfessionalProfile() {
        router.push("/onboarding/register-pro");
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
                    {/* Animated orbits */}
                    <Animated.View
                        style={[
                            styles.orbitOuter,
                            { transform: [{ rotate: orbitOuterSpin }] }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.orbitInner,
                            { transform: [{ rotate: orbitInnerSpin }] }
                        ]}
                    />

                    <View style={styles.centralAvatar}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyx0DbJ8wfnxiUrp-BkYG_FAwEli1cnGAtVeeSPE3565wNV9QlYbfOR1j-Y6ftPHSfX34VPgQUQ_sGY3VrYUDaUKz7znsQpopVPCqECK_mRjUUL77mOw5vXtp5K3uY7gCgdLd0LffHi446kc1C2BD0l2mWoCiEOlKh3WWZIV5OsDNGfJK3j3zh07bqFPvpssN9lIetBnm6j02yYXkCoFp6korAZPBPuPm4EcPWU7yGEPa-e1F4D_6nQiOdF5wL8SwpKODiWf98QA" }}
                                style={styles.avatarImage}
                            />
                        </View>
                        <View style={styles.onlineBadge}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>On line</Text>
                        </View>
                    </View>

                    {/* Floating badges - Legal */}
                    <Animated.View
                        style={[
                            styles.floatingBadge,
                            styles.badgeLegal,
                            { transform: [{ translateY: createBounceTranslate(badgeLegalAnim) }] }
                        ]}
                    >
                        <MaterialIcons name="gavel" size={14} color={COLORS.blue400} />
                        <Text style={styles.badgeText}>Legal</Text>
                    </Animated.View>

                    {/* Floating badges - Bienestar */}
                    <Animated.View
                        style={[
                            styles.floatingBadge,
                            styles.badgeBienestar,
                            { transform: [{ translateY: createBounceTranslate(badgeBienestarAnim) }] }
                        ]}
                    >
                        <MaterialIcons name="spa" size={14} color={COLORS.orange400} />
                        <Text style={styles.badgeText}>Bienestar</Text>
                    </Animated.View>

                    {/* Floating badges - Salud (small, blurred effect) */}
                    <Animated.View
                        style={[
                            styles.floatingBadgeSmall,
                            styles.badgeSalud,
                            { transform: [{ translateY: createBounceTranslate(badgeSaludAnim) }] }
                        ]}
                    >
                        <MaterialIcons name="monitor-heart" size={12} color={COLORS.teal300} />
                        <Text style={styles.badgeTextSmall}>Salud</Text>
                    </Animated.View>

                    {/* Heart icon badge - top right */}
                    <Animated.View
                        style={[
                            styles.iconBadge,
                            styles.badgeHeart,
                            { transform: [{ translateY: createBounceTranslate(badgeHeartAnim) }] }
                        ]}
                    >
                        <MaterialIcons name="favorite" size={18} color={COLORS.pink400} />
                    </Animated.View>

                    {/* Audio wave icon badge - bottom left */}
                    <Animated.View
                        style={[
                            styles.iconBadgeLarge,
                            styles.badgeAudio,
                            { transform: [{ translateY: createBounceTranslate(badgeAudioAnim) }] }
                        ]}
                    >
                        <MaterialIcons name="graphic-eq" size={32} color={COLORS.red400} />
                    </Animated.View>
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
                            <Text style={styles.optionSubtitle} numberOfLines={1}>
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
                            <Text style={styles.optionSubtitle} numberOfLines={1}>
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
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    floatingBadgeSmall: {
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.3)",
        gap: 4,
        opacity: 0.7,
    },
    iconBadge: {
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    iconBadgeLarge: {
        position: "absolute",
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(55, 65, 81, 0.5)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    badgeLegal: {
        top: 40,
        left: 24,
    },
    badgeBienestar: {
        top: 72,
        left: 72,
    },
    badgeSalud: {
        top: 24,
        left: 88,
    },
    badgeHeart: {
        top: 48,
        right: 16,
    },
    badgeAudio: {
        bottom: 48,
        left: 40,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#E5E7EB",
    },
    badgeTextSmall: {
        fontSize: 9,
        fontWeight: "600",
        color: "#9CA3AF",
    },
    heroText: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.white,
        marginBottom: 10,
        textAlign: "center",
        letterSpacing: -0.5,
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
        paddingTop: 24,
        paddingBottom: 32,
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
        paddingVertical: 20,
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
