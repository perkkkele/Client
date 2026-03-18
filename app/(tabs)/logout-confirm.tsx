import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { useTranslation } from 'react-i18next';

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    textMain: "#181811",
    textMuted: "rgba(24, 24, 17, 0.7)",
    amber900: "#78350f",
};

export default function LogoutConfirmScreen() {
    const { logout } = useAuth();
    const { t } = useTranslation('settings');

    function handleCancel() {
        router.back();
    }

    async function handleLogout() {
        await logout();
        router.replace("/(auth)/login");
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Top spacer */}
                <View style={styles.spacer} />

                {/* Main content */}
                <View style={styles.mainContent}>
                    {/* Icon */}
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="logout" size={56} color={COLORS.amber900} />
                        </View>
                    </View>

                    {/* Text */}
                    <Text style={styles.title}>{t('logout.title')}</Text>
                    <Text style={styles.description}>
                        {t('logout.description')}
                    </Text>
                </View>

                {/* Bottom spacer */}
                <View style={styles.spacer} />

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.logoutButtonText}>{t('logout.confirm')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelButtonText}>{t('logout.cancel')}</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    spacer: {
        flex: 1,
    },
    mainContent: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    iconWrapper: {
        marginBottom: 32,
        position: "relative",
    },
    iconGlow: {
        position: "absolute",
        top: -16,
        left: -16,
        right: -16,
        bottom: -16,
        backgroundColor: "rgba(249, 245, 6, 0.3)",
        borderRadius: 999,
        transform: [{ scale: 1.1 }],
    },
    iconContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 16,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 300,
    },
    buttonContainer: {
        gap: 12,
        paddingBottom: 24,
    },
    logoutButton: {
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    cancelButton: {
        height: 56,
        borderRadius: 28,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
});
