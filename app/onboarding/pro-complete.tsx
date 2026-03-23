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
    backgroundStart: "#020617",
    backgroundEnd: "#1e3a8a",
    surfaceCard: "rgba(255, 255, 255, 0.08)",
    accentBlue: "#3B82F6",
    accentCyan: "#22d3ee",
    textWhite: "#FFFFFF",
    textBlue100: "#dbeafe",
    textBlue200: "#bfdbfe",
};

export default function ProCompleteScreen() {
    const { t } = useTranslation('onboarding');
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -20,
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
    }, [floatAnim]);

    function handleContinue() {
        router.push("/onboarding/twin-appearance");
    }

    return (
        <View style={styles.container}>
            {/* Background blurs */}
            <View style={styles.bgBlur1} />
            <View style={styles.bgBlur2} />
            <View style={styles.bgBlur3} />

            <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
                {/* Main content */}
                <View style={styles.mainContent}>
                    {/* Badge */}
                    <View style={styles.badge}>
                        <MaterialIcons name="check-circle" size={14} color={COLORS.textBlue200} />
                        <Text style={styles.badgeText}>{t('proComplete.badge')}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {t('proComplete.title')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('proComplete.subtitle')}
                    </Text>

                    {/* Animation */}
                    <View style={styles.animationContainer}>
                        {/* Orbits */}
                        <View style={styles.orbitOuter} />
                        <View style={styles.orbitMiddle} />
                        <View style={styles.orbitInner} />

                        <Animated.View
                            style={[
                                styles.iconsContainer,
                                { transform: [{ translateY: floatAnim }] }
                            ]}
                        >
                            {/* Human icon */}
                            <View style={styles.humanIcon}>
                                <MaterialIcons name="person" size={36} color="#9CA3AF" />
                            </View>

                            {/* Connection line */}
                            <View style={styles.connectionLine} />

                            {/* AI icon */}
                            <View style={styles.aiIcon}>
                                <MaterialIcons name="smart-toy" size={36} color="#FFFFFF" />
                                <View style={styles.aiOnlineDot} />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitCard}>
                            <View style={[styles.benefitIcon, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                                <MaterialIcons name="schedule" size={24} color={COLORS.textBlue200} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{t('proComplete.benefitTimeTitle')}</Text>
                                <Text style={styles.benefitSubtitle}>{t('proComplete.benefitTimeSubtitle')}</Text>
                            </View>
                        </View>

                        <View style={styles.benefitCard}>
                            <View style={[styles.benefitIcon, { backgroundColor: "rgba(34, 211, 238, 0.2)" }]}>
                                <MaterialIcons name="all-inclusive" size={24} color={COLORS.accentCyan} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={styles.benefitTitle}>{t('proComplete.benefitContinuousTitle')}</Text>
                                <Text style={styles.benefitSubtitle}>{t('proComplete.benefitContinuousSubtitle')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.continueButtonText}>{t('proComplete.continueButton')}</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.stepIndicator}>{t('proComplete.stepIndicator')}</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundStart,
    },
    bgBlur1: {
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: 500,
        height: 500,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderRadius: 250,
    },
    bgBlur2: {
        position: "absolute",
        bottom: "-10%",
        left: "-10%",
        width: 400,
        height: 400,
        backgroundColor: "rgba(34, 211, 238, 0.1)",
        borderRadius: 200,
    },
    bgBlur3: {
        position: "absolute",
        top: "40%",
        left: "50%",
        marginLeft: -150,
        width: 300,
        height: 300,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderRadius: 150,
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
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.3)",
        marginBottom: 16,
        gap: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textBlue100,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.textWhite,
        textAlign: "center",
        lineHeight: 36,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textBlue200,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 280,
        opacity: 0.9,
    },
    animationContainer: {
        width: 320,
        height: 280,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 24,
    },
    orbitOuter: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.1)",
    },
    orbitMiddle: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 1,
        borderColor: "rgba(34, 211, 238, 0.2)",
    },
    orbitInner: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
    },
    iconsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    humanIcon: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: "rgba(55, 65, 81, 0.8)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    connectionLine: {
        width: 64,
        height: 2,
        backgroundColor: "rgba(96, 165, 250, 0.5)",
    },
    aiIcon: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: COLORS.accentBlue,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.accentBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    aiOnlineDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#4ADE80",
        shadowColor: "#4ADE80",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    benefitsContainer: {
        width: "100%",
        gap: 12,
    },
    benefitCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceCard,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        gap: 16,
    },
    benefitIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textWhite,
    },
    benefitSubtitle: {
        fontSize: 12,
        color: "rgba(191, 219, 254, 0.7)",
        marginTop: 2,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: "center",
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        width: "100%",
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
    stepIndicator: {
        fontSize: 10,
        color: "#6B7280",
        marginTop: 16,
    },
});
