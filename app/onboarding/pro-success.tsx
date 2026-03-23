import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#111827",
    surfaceLight: "#FFFFFF",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray800: "#1F2937",
    gray900: "#111827",
    accentBlue: "#3B82F6",
    accentGreen: "#10B981",
    accentPurple: "#6366F1",
};

export default function ProSuccessScreen() {
    const { t } = useTranslation('onboarding');
    const floatAnim = useRef(new Animated.Value(0)).current;
    const popAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pop animation
        Animated.spring(popAnim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();

        // Float animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [floatAnim, popAnim]);

    function handleGoToDashboard() {
        router.replace("/(tabs)/pro-dashboard");
    }

    return (
        <View style={styles.container}>
            {/* Background blurs */}
            <View style={styles.bgBlur1} />
            <View style={styles.bgBlur2} />

            {/* Confetti effect (simplified) */}
            <View style={styles.confettiContainer}>
                {[...Array(10)].map((_, i) => (
                    <View key={i} style={[styles.confettiPiece, { left: `${10 + i * 8}%` }]} />
                ))}
            </View>

            <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
                {/* Main content */}
                <View style={styles.mainContent}>
                    {/* Trophy icon */}
                    <Animated.View
                        style={[
                            styles.trophyContainer,
                            {
                                transform: [
                                    { translateY: floatAnim },
                                    { scale: popAnim }
                                ]
                            }
                        ]}
                    >
                        <View style={styles.trophyGlow} />
                        <View style={styles.trophyInner}>
                            <MaterialIcons name="emoji-events" size={56} color={COLORS.gray900} />
                        </View>
                        <View style={styles.checkBadge}>
                            <MaterialIcons name="check-circle" size={24} color={COLORS.accentGreen} />
                        </View>

                        {/* Decorative stars */}
                        <MaterialIcons name="star" size={20} color={COLORS.accentBlue} style={styles.starLeft} />
                        <MaterialIcons name="auto-awesome" size={16} color={COLORS.accentPurple} style={styles.starRight} />
                        <MaterialIcons name="celebration" size={16} color={COLORS.primary} style={styles.starTop} />
                    </Animated.View>

                    {/* Title */}
                    <Animated.View style={{ transform: [{ scale: popAnim }], opacity: popAnim }}>
                        <Text style={styles.title}>
                            {t('proSuccess.titleLine1')}{"\n"}
                            <Text style={styles.titleHighlight}>{t('proSuccess.titleHighlight')}</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            {t('proSuccess.subtitle')}<Text style={styles.subtitleBold}>{t('proSuccess.subtitleBold')}</Text>{t('proSuccess.subtitleEnd')}
                        </Text>
                    </Animated.View>

                    {/* Benefits Card */}
                    <View style={styles.benefitsCard}>
                        <View style={styles.benefitRow}>
                            <View style={[styles.benefitIcon, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                                <MaterialIcons name="smart-toy" size={24} color={COLORS.accentBlue} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{t('proSuccess.benefitTwinTitle')}</Text>
                                <Text style={styles.benefitSubtitle}>{t('proSuccess.benefitTwinSubtitle')}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.benefitRow}>
                            <View style={[styles.benefitIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                                <MaterialIcons name="event-available" size={24} color={COLORS.accentGreen} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{t('proSuccess.benefitAppointmentsTitle')}</Text>
                                <Text style={styles.benefitSubtitle}>{t('proSuccess.benefitAppointmentsSubtitle')}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.benefitRow}>
                            <View style={[styles.benefitIcon, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
                                <MaterialIcons name="visibility" size={24} color={COLORS.accentPurple} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{t('proSuccess.benefitVisibilityTitle')}</Text>
                                <Text style={styles.benefitSubtitle}>{t('proSuccess.benefitVisibilitySubtitle')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.dashboardButton}
                        onPress={handleGoToDashboard}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.dashboardButtonText}>{t('proSuccess.goToDashboard')}</Text>
                        <View style={styles.dashboardButtonIcon}>
                            <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    bgBlur1: {
        position: "absolute",
        top: "-20%",
        right: "-20%",
        width: "80%",
        height: "50%",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderRadius: 999,
    },
    bgBlur2: {
        position: "absolute",
        bottom: "-10%",
        left: "-20%",
        width: "70%",
        height: "40%",
        backgroundColor: "rgba(253, 224, 71, 0.1)",
        borderRadius: 999,
    },
    confettiContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        overflow: "hidden",
    },
    confettiPiece: {
        position: "absolute",
        width: 10,
        height: 10,
        backgroundColor: COLORS.primary,
        top: -10,
        opacity: 0.6,
        borderRadius: 2,
    },
    content: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    trophyContainer: {
        position: "relative",
        marginBottom: 32,
    },
    trophyGlow: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(253, 224, 71, 0.2)",
        top: -16,
        left: -16,
    },
    trophyInner: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 10,
    },
    checkBadge: {
        position: "absolute",
        bottom: -8,
        right: -8,
        backgroundColor: COLORS.surfaceLight,
        padding: 4,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    starLeft: {
        position: "absolute",
        top: 0,
        left: -32,
    },
    starRight: {
        position: "absolute",
        bottom: 16,
        right: -32,
    },
    starTop: {
        position: "absolute",
        top: -24,
        right: 0,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.gray900,
        textAlign: "center",
        lineHeight: 36,
        marginBottom: 12,
    },
    titleHighlight: {
        color: COLORS.primaryDark,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 280,
        marginBottom: 32,
    },
    subtitleBold: {
        color: COLORS.accentBlue,
        fontWeight: "600",
    },
    benefitsCard: {
        width: "100%",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#FFFFFF",
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    benefitSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    dashboardButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.gray900,
        paddingVertical: 16,
        paddingLeft: 24,
        paddingRight: 8,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    dashboardButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    dashboardButtonIcon: {
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 8,
        borderRadius: 12,
    },
});
