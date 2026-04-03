import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const COLORS = {
    primary: "#FFEA00",
    primaryHover: "#FFD600",
    backgroundLight: "#FDFDF8",
    surfaceLight: "#FFFFFF",
    textMain: "#0F172A",
    textMuted: "#64748B",
    gray400: "#94A3B8",
    yellow100: "#FEF9C3",
    yellow900: "#713F12",
};

export default function DeleteAccountSuccessScreen() {
    const { t } = useTranslation("settings");

    function handleCreateNewAccount() {
        router.replace("/onboarding/language");
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.backgroundGradient} />

            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconWrapper}>
                    <View style={styles.iconGlow} />
                    <View style={styles.iconContainer}>
                        <View style={styles.checkCircle}>
                            <MaterialIcons name="check" size={32} color="#FFFFFF" />
                        </View>
                    </View>
                    <View style={styles.deleteIconBadge}>
                        <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                    </View>
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        {t("deleteAccountSuccess.title")}
                    </Text>
                    <Text style={styles.description}>
                        {t("deleteAccountSuccess.description")}
                    </Text>
                    <Text style={styles.subDescription}>
                        {t("deleteAccountSuccess.thanks")}
                    </Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleCreateNewAccount}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.primaryButtonText}>{t("deleteAccountSuccess.createNewAccount")}</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.textMain} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>
                            {t("deleteAccountSuccess.seeYouSoon")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer logo */}
            <View style={styles.footer}>
                <Text style={styles.footerLogo}>TwinPro</Text>
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    backgroundGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "50%",
        backgroundColor: "rgba(254, 249, 195, 0.3)",
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapper: {
        position: "relative",
        marginBottom: 40,
    },
    iconGlow: {
        position: "absolute",
        top: -24,
        left: -24,
        width: 176,
        height: 176,
        borderRadius: 88,
        backgroundColor: "rgba(255, 234, 0, 0.1)",
    },
    iconContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 4,
        borderColor: COLORS.yellow100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 8,
    },
    checkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteIconBadge: {
        position: "absolute",
        bottom: -8,
        right: -8,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.textMain,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.backgroundLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    textContent: {
        alignItems: "center",
        gap: 16,
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textMain,
        textAlign: "center",
        lineHeight: 36,
    },
    description: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 320,
    },
    subDescription: {
        fontSize: 14,
        color: COLORS.gray400,
        textAlign: "center",
    },
    buttonContainer: {
        width: "100%",
        gap: 24,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "rgba(255, 234, 0, 0.5)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    secondaryButton: {
        alignItems: "center",
        paddingVertical: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    footer: {
        paddingBottom: 48,
        alignItems: "center",
    },
    footerLogo: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.gray400,
        letterSpacing: 1,
    },
});
