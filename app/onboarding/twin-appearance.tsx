import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, API_HOST, API_PORT } from "../../api";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#0B1121",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1F2937",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    accentBlue: "#3B82F6",
    accentPurple: "#6366F1",
    accentGreen: "#10B981",
    headerStart: "#0f172a",
    headerMiddle: "#1e3a8a",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function TwinAppearanceScreen() {
    const { user, token, refreshUser } = useAuth();
    const [videoType, setVideoType] = useState<"predefined" | "trained">("trained");
    const [voiceType, setVoiceType] = useState<"standard" | "cloned">("cloned");
    const [isLoading, setIsLoading] = useState(false);

    const avatarUrl = getAvatarUrl(user?.avatar);

    function handleBack() {
        router.back();
    }

    async function handleContinue() {
        setIsLoading(true);
        try {
            if (token) {
                await userApi.updateUser(token, {
                    digitalTwin: {
                        appearance: {
                            videoType,
                            videoId: null, // Will be set after upload
                            voiceType,
                            voiceId: null, // Will be set after upload
                        }
                    }
                });

                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/twin-behavior");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepText}>PASO 1 DE 3</Text>
                        <View style={styles.stepDots}>
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View style={styles.stepDot} />
                            <View style={styles.stepDot} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.helpButton}>
                        <Text style={styles.helpText}>Ayuda</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Apariencia y Voz</Text>
                    <Text style={styles.headerSubtitle}>Configura la presencia de tu Gemelo Digital.</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Preview Card */}
                <View style={styles.previewCard}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.previewImage} />
                    ) : (
                        <View style={[styles.previewImage, styles.previewPlaceholder]}>
                            <MaterialIcons name="person" size={80} color={COLORS.gray400} />
                        </View>
                    )}

                    {/* Preview Badge */}
                    <View style={styles.previewBadge}>
                        <View style={styles.previewDot} />
                        <Text style={styles.previewBadgeText}>VISTA PREVIA</Text>
                    </View>

                    {/* Bottom controls */}
                    <View style={styles.previewBottom}>
                        <TouchableOpacity style={styles.playButton}>
                            <MaterialIcons name="play-arrow" size={28} color="#000000" />
                        </TouchableOpacity>
                        <View style={styles.voiceInfo}>
                            <View style={styles.waveform}>
                                {[2, 4, 3, 5, 3, 2, 2, 2].map((h, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.waveBar,
                                            { height: h * 4, opacity: i < 6 ? 1 : 0.3 + (0.2 * (6 - i)) }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.voiceLabel}>
                                Voz: <Text style={styles.voiceName}>Estándar (Profesional)</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Settings Card */}
                <View style={styles.settingsCard}>
                    {/* Appearance Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>APARIENCIA</Text>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>RECOMENDADO</Text>
                            </View>
                        </View>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    videoType === "predefined" && styles.optionCardSelected
                                ]}
                                onPress={() => setVideoType("predefined")}
                            >
                                <View style={[styles.optionIcon, videoType === "predefined" && styles.optionIconSelected]}>
                                    <MaterialIcons name="face" size={18} color={videoType === "predefined" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, videoType === "predefined" && styles.optionTitleSelected]}>Avatar Predefinido</Text>
                                <Text style={styles.optionSubtitle}>Importar Live Avatar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    videoType === "trained" && styles.optionCardSelected
                                ]}
                                onPress={() => setVideoType("trained")}
                            >
                                {videoType === "trained" && <View style={styles.activeDot} />}
                                <View style={[styles.optionIcon, videoType === "trained" && styles.optionIconSelected]}>
                                    <MaterialIcons name="videocam" size={18} color={videoType === "trained" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, videoType === "trained" && styles.optionTitleSelected]}>Entrenar con Video</Text>
                                <Text style={styles.optionSubtitle}>Máxima autenticidad</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Voice Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>VOZ DEL PROFESIONAL</Text>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    voiceType === "standard" && styles.optionCardSelected
                                ]}
                                onPress={() => setVoiceType("standard")}
                            >
                                <View style={[styles.optionIcon, voiceType === "standard" && styles.optionIconSelected]}>
                                    <MaterialIcons name="graphic-eq" size={18} color={voiceType === "standard" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, voiceType === "standard" && styles.optionTitleSelected]}>Voz Estándar</Text>
                                <Text style={styles.optionSubtitle}>Seleccionar tono</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    voiceType === "cloned" && styles.optionCardSelectedPurple
                                ]}
                                onPress={() => setVoiceType("cloned")}
                            >
                                {voiceType === "cloned" && (
                                    <View style={styles.engagementBadge}>
                                        <Text style={styles.engagementText}>+ Engagement</Text>
                                    </View>
                                )}
                                <View style={[styles.optionIcon, voiceType === "cloned" && styles.optionIconPurple]}>
                                    <MaterialIcons name="mic" size={18} color={voiceType === "cloned" ? COLORS.accentPurple : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, voiceType === "cloned" && styles.optionTitleSelected]}>Clonar mi Voz</Text>
                                <Text style={styles.optionSubtitle}>Sube audio 2 min</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Guardar y Continuar</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                        </>
                    )}
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
    header: {
        backgroundColor: COLORS.headerStart,
        paddingTop: 48,
        paddingBottom: 48,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepIndicator: {
        alignItems: "center",
    },
    stepText: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(147, 197, 253, 0.8)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    stepDots: {
        flexDirection: "row",
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(30, 58, 138, 0.5)",
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
        borderRadius: 4,
    },
    helpButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    helpText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    headerContent: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(147, 197, 253, 0.8)",
    },
    scrollView: {
        flex: 1,
        marginTop: -16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    // Preview Card
    previewCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 4,
        borderColor: "#FFFFFF",
        aspectRatio: 4 / 3,
        position: "relative",
        marginBottom: 24,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    previewPlaceholder: {
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
    },
    previewBadge: {
        position: "absolute",
        top: 16,
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6,
    },
    previewDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accentGreen,
    },
    previewBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    previewBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingTop: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: "transparent",
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    voiceInfo: {
        flex: 1,
    },
    waveform: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 24,
        gap: 3,
        marginBottom: 4,
    },
    waveBar: {
        width: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    voiceLabel: {
        fontSize: 11,
        color: COLORS.gray400,
    },
    voiceName: {
        color: "#FFFFFF",
    },
    // Settings Card
    settingsCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    recommendedBadge: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    recommendedText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.accentGreen,
    },
    optionsGrid: {
        flexDirection: "row",
        gap: 12,
    },
    optionCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        position: "relative",
    },
    optionCardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: "rgba(253, 224, 71, 0.05)",
    },
    optionCardSelectedPurple: {
        borderWidth: 2,
        borderColor: COLORS.accentPurple,
        backgroundColor: "rgba(99, 102, 241, 0.05)",
    },
    activeDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    engagementBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    engagementText: {
        fontSize: 8,
        fontWeight: "bold",
        color: COLORS.accentPurple,
    },
    optionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    optionIconSelected: {
        backgroundColor: "rgba(253, 224, 71, 0.2)",
    },
    optionIconPurple: {
        backgroundColor: "rgba(99, 102, 241, 0.2)",
    },
    optionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray700,
        marginBottom: 2,
    },
    optionTitleSelected: {
        fontWeight: "bold",
        color: COLORS.gray900,
    },
    optionSubtitle: {
        fontSize: 10,
        color: COLORS.gray400,
    },
    // Footer
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 24,
        backgroundColor: "transparent",
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
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
});
