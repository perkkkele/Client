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
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#6B7280",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue200: "#bfdbfe",
    blue600: "#2563eb",
    blue800: "#1e40af",
    purple50: "#faf5ff",
    purple600: "#9333ea",
    orange50: "#fff7ed",
    orange600: "#ea580c",
    white: "#FFFFFF",
};

interface MinutePackage {
    id: string;
    minutes: number;
    price: number;
    isPopular?: boolean;
}

const MINUTE_PACKAGES: MinutePackage[] = [
    { id: "1", minutes: 100, price: 15 },
    { id: "2", minutes: 300, price: 39, isPopular: true },
];

export default function PlansCreditsScreen() {
    const remainingMinutes = 124;
    const totalMinutes = 300;
    const percentUsed = ((totalMinutes - remainingMinutes) / totalMinutes) * 100;

    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Planes y créditos</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Active Plan Card */}
                <View style={styles.planCard}>
                    <View style={styles.planGlow1} />
                    <View style={styles.planGlow2} />
                    <View style={styles.planContent}>
                        <View style={styles.planHeader}>
                            <View>
                                <View style={styles.planBadge}>
                                    <Text style={styles.planBadgeText}>PLAN ACTIVO</Text>
                                </View>
                                <Text style={styles.planName}>Plan Pro</Text>
                                <Text style={styles.planPrice}>300 minutos/mes por 49€</Text>
                            </View>
                            <View style={styles.verifiedIcon}>
                                <MaterialIcons name="verified" size={24} color={COLORS.white} />
                            </View>
                        </View>

                        <View style={styles.minutesSection}>
                            <View style={styles.minutesHeader}>
                                <View style={styles.minutesValue}>
                                    <Text style={styles.minutesNumber}>{remainingMinutes}</Text>
                                    <Text style={styles.minutesUnit}>min</Text>
                                </View>
                                <Text style={styles.minutesTotal}>Restantes de {totalMinutes}</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${100 - percentUsed}%` }]} />
                            </View>
                        </View>

                        <View style={styles.renewalInfo}>
                            <MaterialIcons name="update" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.renewalText}>Se renueva el 1 de Noviembre</Text>
                        </View>
                    </View>
                </View>

                {/* Buy Extra Minutes */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Comprar Minutos Extra</Text>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>Recarga inmediata</Text>
                        </View>
                    </View>

                    <View style={styles.packagesGrid}>
                        {MINUTE_PACKAGES.map((pkg) => (
                            <View
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    pkg.isPopular && styles.packageCardPopular
                                ]}
                            >
                                {pkg.isPopular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                                    </View>
                                )}
                                <View style={[
                                    styles.packageIcon,
                                    pkg.isPopular && styles.packageIconPopular
                                ]}>
                                    <MaterialIcons
                                        name={pkg.isPopular ? "bolt" : "timer"}
                                        size={24}
                                        color={pkg.isPopular ? COLORS.primary : COLORS.gray700}
                                    />
                                </View>
                                <View style={styles.packageMinutes}>
                                    <Text style={styles.packageMinutesNumber}>{pkg.minutes}</Text>
                                    <Text style={styles.packageMinutesUnit}>min</Text>
                                </View>
                                <View style={styles.packageFooter}>
                                    <Text style={styles.packagePrice}>{pkg.price}€</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.buyButton,
                                            pkg.isPopular && styles.buyButtonPopular
                                        ]}
                                    >
                                        <Text style={[
                                            styles.buyButtonText,
                                            pkg.isPopular && styles.buyButtonTextPopular
                                        ]}>
                                            Comprar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Management Section */}
                <View style={styles.section}>
                    <Text style={styles.managementTitle}>GESTIÓN</Text>

                    <TouchableOpacity style={styles.managementItem}>
                        <View style={styles.managementItemLeft}>
                            <View style={[styles.managementIcon, { backgroundColor: COLORS.purple50 }]}>
                                <MaterialIcons name="history" size={20} color={COLORS.purple600} />
                            </View>
                            <View>
                                <Text style={styles.managementLabel}>Historial de Compras</Text>
                                <Text style={styles.managementHint}>Recargas y paquetes anteriores</Text>
                            </View>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.gray400} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.managementItem}>
                        <View style={styles.managementItemLeft}>
                            <View style={[styles.managementIcon, { backgroundColor: COLORS.orange50 }]}>
                                <MaterialIcons name="receipt-long" size={20} color={COLORS.orange600} />
                            </View>
                            <View>
                                <Text style={styles.managementLabel}>Ver Facturas Anteriores</Text>
                                <Text style={styles.managementHint}>Descargar en PDF</Text>
                            </View>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    planCard: {
        margin: 16,
        marginTop: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 24,
        overflow: "hidden",
        position: "relative",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    planGlow1: {
        position: "absolute",
        top: -32,
        right: -32,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    planGlow2: {
        position: "absolute",
        bottom: -32,
        left: -32,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    planContent: {
        position: "relative",
        zIndex: 1,
    },
    planHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
    },
    planBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
    },
    planBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.white,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    planName: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.white,
    },
    planPrice: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginTop: 4,
    },
    verifiedIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    minutesSection: {
        marginBottom: 8,
    },
    minutesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 8,
    },
    minutesValue: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    minutesNumber: {
        fontSize: 40,
        fontWeight: "bold",
        color: COLORS.white,
    },
    minutesUnit: {
        fontSize: 18,
        fontWeight: "500",
        color: "rgba(255,255,255,0.8)",
    },
    minutesTotal: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255,255,255,0.8)",
    },
    progressBar: {
        height: 12,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 6,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 6,
    },
    renewalInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 12,
    },
    renewalText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    sectionBadge: {
        backgroundColor: COLORS.blue50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    sectionBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    packagesGrid: {
        flexDirection: "row",
        gap: 16,
    },
    packageCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    packageCardPopular: {
        borderColor: COLORS.blue200,
        borderWidth: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    popularBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 10,
    },
    popularBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    packageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    packageIconPopular: {
        backgroundColor: COLORS.blue50,
    },
    packageMinutes: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    packageMinutesNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    packageMinutesUnit: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    packageFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        gap: 12,
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    buyButton: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    buyButtonPopular: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    buyButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    buyButtonTextPopular: {
        color: COLORS.white,
    },
    managementTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    managementItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    managementItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    managementIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    managementLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    managementHint: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
});
