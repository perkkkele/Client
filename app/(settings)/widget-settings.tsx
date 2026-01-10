/**
 * Widget Settings Screen
 * 
 * Allows professionals to configure and get embed code for their website widget.
 * Feature gated to Professional and Premium plans.
 */

import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context";
import { useSubscription } from "../../hooks/useSubscription";
import UpgradeModal from "../../components/UpgradeModal";
import { getAssetUrl } from "../../api";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray400: "#94A3B8",
    gray500: "#6b7280",
    blue500: "#3b82f6",
    blue50: "#eff6ff",
    green500: "#22C55E",
    green50: "#f0fdf4",
    codeBg: "#1e293b",
    codeText: "#e2e8f0",
};

const WIDGET_BASE_URL = "https://widget.twinpro.app";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface WidgetConfig {
    position: WidgetPosition;
    primaryColor: string;
    buttonSize: number;
    useAvatar: boolean;
}

export default function WidgetSettingsScreen() {
    const { user, token } = useAuth();
    const { canAccess } = useSubscription();

    const [config, setConfig] = useState<WidgetConfig>({
        position: "bottom-right",
        primaryColor: "#f9f506",
        buttonSize: 60,
        useAvatar: true,
    });

    const [copied, setCopied] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Generate embed code
    const generateEmbedCode = () => {
        const avatarUrl = config.useAvatar ? getAssetUrl(user?.avatar) : null;

        let code = `<script src="${WIDGET_BASE_URL}/widget.js"
    data-professional-id="${user?.username || user?._id}"
    data-position="${config.position}"
    data-primary-color="${config.primaryColor}"
    data-button-size="${config.buttonSize}"`;

        if (avatarUrl) {
            code += `
    data-avatar-url="${avatarUrl}"`;
        }

        code += `>
</script>`;

        return code;
    };

    const handleCopyCode = async () => {
        if (!canAccess('widget')) {
            setShowUpgradeModal(true);
            return;
        }

        const code = generateEmbedCode();
        Clipboard.setString(code);
        setCopied(true);
        Alert.alert(
            "¡Código copiado!",
            "Pega este código justo antes de </body> en tu sitio web.",
            [{ text: "Entendido" }]
        );

        setTimeout(() => setCopied(false), 3000);
    };

    const handleBack = () => {
        router.back();
    };

    const positions: { id: WidgetPosition; label: string; icon: string }[] = [
        { id: "bottom-right", label: "Abajo derecha", icon: "south-east" },
        { id: "bottom-left", label: "Abajo izquierda", icon: "south-west" },
        { id: "top-right", label: "Arriba derecha", icon: "north-east" },
        { id: "top-left", label: "Arriba izquierda", icon: "north-west" },
    ];

    const colors = [
        { color: "#f9f506", name: "TwinPro Yellow" },
        { color: "#3b82f6", name: "Blue" },
        { color: "#22c55e", name: "Green" },
        { color: "#8b5cf6", name: "Purple" },
        { color: "#f97316", name: "Orange" },
        { color: "#ef4444", name: "Red" },
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Widget para Web</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoIconContainer}>
                        <MaterialIcons name="widgets" size={24} color={COLORS.blue500} />
                    </View>
                    <Text style={styles.infoTitle}>Integra tu Gemelo Digital en tu Web</Text>
                    <Text style={styles.infoDescription}>
                        Añade una burbuja de chat a tu sitio web para que tus visitantes puedan
                        comunicarse con tu gemelo digital 24/7.
                    </Text>
                </View>

                {/* Position Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>POSICIÓN DEL BOTÓN</Text>
                    <View style={styles.positionGrid}>
                        {positions.map((pos) => (
                            <TouchableOpacity
                                key={pos.id}
                                style={[
                                    styles.positionCard,
                                    config.position === pos.id && styles.positionCardActive
                                ]}
                                onPress={() => setConfig({ ...config, position: pos.id })}
                            >
                                <MaterialIcons
                                    name={pos.icon as any}
                                    size={24}
                                    color={config.position === pos.id ? COLORS.blue500 : COLORS.gray400}
                                />
                                <Text style={[
                                    styles.positionLabel,
                                    config.position === pos.id && styles.positionLabelActive
                                ]}>
                                    {pos.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Color Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>COLOR DEL BOTÓN</Text>
                    <View style={styles.colorGrid}>
                        {colors.map((c) => (
                            <TouchableOpacity
                                key={c.color}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: c.color },
                                    config.primaryColor === c.color && styles.colorOptionActive
                                ]}
                                onPress={() => setConfig({ ...config, primaryColor: c.color })}
                            >
                                {config.primaryColor === c.color && (
                                    <MaterialIcons name="check" size={20} color="#000" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Avatar Toggle */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OPCIONES</Text>
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setConfig({ ...config, useAvatar: !config.useAvatar })}
                    >
                        <View style={styles.toggleInfo}>
                            <MaterialIcons name="face" size={20} color={COLORS.textMain} />
                            <Text style={styles.toggleLabel}>Mostrar tu avatar en el botón</Text>
                        </View>
                        <View style={[styles.toggle, config.useAvatar && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, config.useAvatar && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Embed Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CÓDIGO DE INTEGRACIÓN</Text>
                    <View style={styles.codeContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.codeScrollView}
                        >
                            <Text style={styles.codeText}>
                                {generateEmbedCode()}
                            </Text>
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                        onPress={handleCopyCode}
                    >
                        <MaterialIcons
                            name={copied ? "check" : "content-copy"}
                            size={20}
                            color={copied ? COLORS.green500 : COLORS.textMain}
                        />
                        <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                            {copied ? "¡Código Copiado!" : "Copiar Código"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>Cómo Integrar</Text>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Copia el código de arriba</Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Pégalo antes de {"</body>"} en tu HTML</Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>¡Listo! Tu visitantes podrán chatear con tu gemelo</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Upgrade Modal */}
            <UpgradeModal
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Widget para Web"
                requiredPlan="professional"
            />
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
        borderBottomColor: COLORS.gray100,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    infoCard: {
        backgroundColor: COLORS.blue50,
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        marginBottom: 24,
    },
    infoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surfaceLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
        textAlign: "center",
    },
    infoDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
        letterSpacing: 1,
        marginBottom: 12,
    },
    positionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    positionCard: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    positionCardActive: {
        borderColor: COLORS.blue500,
        backgroundColor: COLORS.blue50,
    },
    positionLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 8,
    },
    positionLabelActive: {
        color: COLORS.blue500,
        fontWeight: "600",
    },
    colorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "transparent",
    },
    colorOptionActive: {
        borderColor: COLORS.textMain,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
    },
    toggleInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    toggleLabel: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray200,
        padding: 2,
    },
    toggleActive: {
        backgroundColor: COLORS.green500,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    codeContainer: {
        backgroundColor: COLORS.codeBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    codeScrollView: {
        maxHeight: 150,
    },
    codeText: {
        fontFamily: "monospace",
        fontSize: 12,
        color: COLORS.codeText,
        lineHeight: 18,
    },
    copyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    copyButtonSuccess: {
        backgroundColor: COLORS.green50,
    },
    copyButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    copyButtonTextSuccess: {
        color: COLORS.green500,
    },
    instructionsCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 16,
    },
    instructionStep: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    stepText: {
        fontSize: 14,
        color: COLORS.textMuted,
        flex: 1,
    },
});
