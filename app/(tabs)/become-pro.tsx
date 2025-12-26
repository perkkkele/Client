import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    black: "#000000",
    slate400: "#94a3b8",
    slate500: "#64748b",
    slate800: "#1e293b",
    blue100: "#dbeafe",
    blue600: "#2563eb",
    purple100: "#f3e8ff",
    purple600: "#9333ea",
};

interface FeatureItem {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
}

const FEATURES: FeatureItem[] = [
    {
        icon: "dashboard",
        iconBg: "rgba(249, 245, 6, 0.2)",
        iconColor: "#a16207",
        title: "Dashboard de Gestión",
        description: "Administra tus chats, citas y ganancias desde un panel de control intuitivo y completo.",
    },
    {
        icon: "diversity-3",
        iconBg: COLORS.blue100,
        iconColor: COLORS.blue600,
        title: "Conecta con Clientes",
        description: "Accede a una base de usuarios que buscan activamente tus servicios profesionales.",
    },
    {
        icon: "smart-toy",
        iconBg: COLORS.purple100,
        iconColor: COLORS.purple600,
        title: "Gemelo Digital 24/7",
        description: "Tu avatar entrenado responde consultas básicas y cualifica leads mientras duermes.",
    },
];

export default function BecomeProScreen() {
    function handleBecomePro() {
        // Navigate to the existing professional profile onboarding flow
        router.push("/onboarding/pro-profile");
    }

    function handleMaybeLater() {
        router.back();
    }

    function handleNavigation(tab: string) {
        switch (tab) {
            case "chats":
                router.push("/(tabs)" as any);
                break;
            case "directory":
                router.push("/(tabs)/category-results?category=todos");
                break;
            case "favorites":
                router.push("/(tabs)/favorites");
                break;
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Hero Header - More compact */}
            <View style={styles.heroContainer}>
                <View style={styles.heroHeader}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <MaterialIcons name="group" size={24} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.logoTitle}>TwinPro</Text>
                            <Text style={styles.logoSubtitle}>Professional Chat</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.heroContent}>
                    <View style={styles.rocketIcon}>
                        <MaterialIcons name="rocket-launch" size={56} color={COLORS.primary} />
                    </View>
                    <Text style={styles.heroTitle}>¡Desbloquea tu{"\n"}Perfil Pro!</Text>
                    <Text style={styles.heroSubtitle}>
                        Únete a miles de expertos y lleva tus servicios al siguiente nivel.
                    </Text>
                </View>
            </View>

            {/* Features & CTA - All visible without scroll */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.featuresContainer}>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureCard}>
                            <View style={[styles.featureIcon, { backgroundColor: feature.iconBg }]}>
                                <MaterialIcons name={feature.icon as any} size={22} color={feature.iconColor} />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* CTA Buttons */}
                <View style={styles.ctaContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleBecomePro}>
                        <Text style={styles.primaryButtonText}>Crear mi Perfil Pro Ahora</Text>
                        <MaterialIcons name="arrow-forward" size={20} color={COLORS.black} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleMaybeLater}>
                        <Text style={styles.secondaryButtonText}>No, gracias. Quizás más tarde.</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation("chats")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation("directory")}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Directorio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation("favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Favoritos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <View style={styles.navItemActive}>
                        <MaterialIcons name="badge" size={24} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.navLabelActive}>Perfil Pro</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Hero - Compact
    heroContainer: {
        backgroundColor: COLORS.black,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: 8,
        paddingBottom: 24,
        overflow: "hidden",
    },
    heroHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        backgroundColor: COLORS.black,
        borderWidth: 3,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    logoTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    logoSubtitle: {
        fontSize: 11,
        color: COLORS.slate400,
        fontWeight: "500",
    },
    heroContent: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    rocketIcon: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: COLORS.slate800,
        borderWidth: 4,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: COLORS.slate400,
        textAlign: "center",
        maxWidth: 280,
    },
    // Features - Compact
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 24,
        paddingBottom: 100,
    },
    featuresContainer: {
        gap: 12,
    },
    featureCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 12,
        color: COLORS.slate500,
        lineHeight: 18,
    },
    // CTA - Compact
    ctaContainer: {
        marginTop: 24,
        gap: 8,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.black,
    },
    secondaryButton: {
        alignItems: "center",
        paddingVertical: 8,
    },
    secondaryButtonText: {
        fontSize: 12,
        color: COLORS.slate400,
        fontWeight: "500",
    },
    // Bottom Nav - Compact
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    navItem: {
        alignItems: "center",
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        color: COLORS.slate400,
        fontWeight: "500",
    },
    navItemActive: {
        width: 40,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(249, 245, 6, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    navLabelActive: {
        fontSize: 10,
        color: COLORS.textMain,
        fontWeight: "bold",
    },
});
