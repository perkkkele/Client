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
    Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context";
import { useSubscription } from "../../hooks/useSubscription";
import UpgradeModal from "../../components/UpgradeModal";
import { getAssetUrl, userApi } from "../../api";
import { useAlert } from "../../components/TwinProAlert";

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

type EmbedType = 'script' | 'iframe';

export default function WidgetSettingsScreen() {
    const { user, token, refreshUser } = useAuth();
    const { showAlert } = useAlert();
    const { canAccess } = useSubscription();

    const [config, setConfig] = useState<WidgetConfig>({
        position: "bottom-right",
        primaryColor: "#f9f506",
        buttonSize: 60,
        useAvatar: true,
    });

    const [copied, setCopied] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [embedType, setEmbedType] = useState<EmbedType>('script');

    // Widget channel configuration
    const [textEnabled, setTextEnabled] = useState(true);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [widgetTheme, setWidgetTheme] = useState<'dark' | 'light'>('dark');

    // Sync channel state and theme from user data
    useEffect(() => {
        if (user?.digitalTwin?.widgetChannels) {
            setTextEnabled(user.digitalTwin.widgetChannels.text ?? true);
            setVoiceEnabled(user.digitalTwin.widgetChannels.voice ?? true);
        }
        if (user?.digitalTwin?.widgetTheme) {
            setWidgetTheme(user.digitalTwin.widgetTheme);
        }
    }, [user?.digitalTwin?.widgetChannels, user?.digitalTwin?.widgetTheme]);

    // Save channel config to backend
    const handleChannelToggle = async (channel: 'text' | 'voice', value: boolean) => {
        // Prevent disabling both channels
        if (channel === 'text' && !value && !voiceEnabled) {
            showAlert({
                type: 'warning',
                title: 'Al menos un canal',
                message: 'Debes mantener al menos un canal de comunicación habilitado.',
                buttons: [{ text: 'Entendido' }],
            });
            return;
        }
        if (channel === 'voice' && !value && !textEnabled) {
            showAlert({
                type: 'warning',
                title: 'Al menos un canal',
                message: 'Debes mantener al menos un canal de comunicación habilitado.',
                buttons: [{ text: 'Entendido' }],
            });
            return;
        }

        // Update local state
        if (channel === 'text') setTextEnabled(value);
        else setVoiceEnabled(value);

        // Save to backend
        if (!token) return;
        try {
            await userApi.updateUser(token, {
                digitalTwin: {
                    widgetChannels: {
                        text: channel === 'text' ? value : textEnabled,
                        voice: channel === 'voice' ? value : voiceEnabled,
                    },
                },
            });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error('Error saving widget channels:', error);
            // Revert on error
            if (channel === 'text') setTextEnabled(!value);
            else setVoiceEnabled(!value);
        }
    };

    // Generate embed code based on type
    const generateEmbedCode = () => {
        if (embedType === 'iframe') {
            return generateIframeCode();
        }
        return generateScriptCode();
    };

    const generateScriptCode = () => {
        const avatarUrl = config.useAvatar ? getAssetUrl(user?.avatar) : null;

        let code = `<script src="${WIDGET_BASE_URL}/widget.js"
    data-professional-id="${user?.username || user?._id}"
    data-position="${config.position}"
    data-primary-color="${config.primaryColor}"
    data-button-size="${config.buttonSize}"
    data-widget-theme="${widgetTheme}"`;

        if (avatarUrl) {
            code += `
    data-avatar-url="${avatarUrl}"`;
        }

        code += `>
</script>`;

        return code;
    };

    const generateIframeCode = () => {
        const username = user?.username || user?._id;
        return `<iframe
    src="${WIDGET_BASE_URL}/embed/${username}?theme=${widgetTheme}"
    width="400"
    height="700"
    allow="microphone; camera"
    style="border: none; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">
</iframe>`;
    };

    const handleCopyCode = async () => {
        if (!canAccess('widget')) {
            setShowUpgradeModal(true);
            return;
        }

        const code = generateEmbedCode();
        Clipboard.setString(code);
        setCopied(true);
        showAlert({
            type: 'info',
            title: '¡Código copiado!',
            message: 'Pega este código justo antes de </body> en tu sitio web.',
            buttons: [{ text: "Entendido" }]
        });

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
                    <View style={{ height: 8 }} />
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={async () => {
                            const newTheme = widgetTheme === 'dark' ? 'light' : 'dark';
                            setWidgetTheme(newTheme);
                            if (!token) return;
                            try {
                                await userApi.updateUser(token, {
                                    digitalTwin: { widgetTheme: newTheme },
                                });
                                if (refreshUser) await refreshUser();
                            } catch (error) {
                                console.error('Error saving widget theme:', error);
                                setWidgetTheme(widgetTheme); // revert
                            }
                        }}
                    >
                        <View style={styles.toggleInfo}>
                            <MaterialIcons
                                name={widgetTheme === 'dark' ? 'dark-mode' : 'light-mode'}
                                size={20}
                                color={COLORS.textMain}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>
                                    Modo {widgetTheme === 'dark' ? 'Oscuro' : 'Claro'}
                                </Text>
                                <Text style={styles.toggleDescription}>
                                    Cambia la apariencia del widget
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, widgetTheme === 'light' && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, widgetTheme === 'light' && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Channel Configuration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CANALES DE COMUNICACIÓN</Text>
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => handleChannelToggle('text', !textEnabled)}
                    >
                        <View style={styles.toggleInfo}>
                            <MaterialIcons name="chat" size={20} color={COLORS.textMain} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>Chat de texto</Text>
                                <Text style={styles.toggleDescription}>
                                    Permite interactuar por escrito
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, textEnabled && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, textEnabled && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                    <View style={{ height: 8 }} />
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => handleChannelToggle('voice', !voiceEnabled)}
                    >
                        <View style={styles.toggleInfo}>
                            <MaterialIcons name="mic" size={20} color={COLORS.textMain} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>Conversación de voz</Text>
                                <Text style={styles.toggleDescription}>
                                    Permite hablar con tu gemelo digital
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, voiceEnabled && styles.toggleActive]}>
                            <View style={[styles.toggleThumb, voiceEnabled && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Embed Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CÓDIGO DE INTEGRACIÓN</Text>

                    {/* Tab selector */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, embedType === 'script' && styles.tabActive]}
                            onPress={() => setEmbedType('script')}
                        >
                            <MaterialIcons
                                name="code"
                                size={16}
                                color={embedType === 'script' ? COLORS.blue500 : COLORS.gray400}
                            />
                            <Text style={[styles.tabText, embedType === 'script' && styles.tabTextActive]}>
                                Script
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, embedType === 'iframe' && styles.tabActive]}
                            onPress={() => setEmbedType('iframe')}
                        >
                            <MaterialIcons
                                name="web"
                                size={16}
                                color={embedType === 'iframe' ? COLORS.blue500 : COLORS.gray400}
                            />
                            <Text style={[styles.tabText, embedType === 'iframe' && styles.tabTextActive]}>
                                Iframe
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <Text style={styles.embedDescription}>
                        {embedType === 'script'
                            ? 'Burbuja flotante que se abre al hacer clic. Recomendado para la mayoría de webs.'
                            : 'Chat integrado directamente en tu página. Ideal para páginas de contacto o landing pages.'}
                    </Text>

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
        flex: 1,
    },
    toggleLabel: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    toggleDescription: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
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
    tabRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.gray100,
        borderWidth: 2,
        borderColor: "transparent",
    },
    tabActive: {
        backgroundColor: COLORS.blue50,
        borderColor: COLORS.blue500,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600" as const,
        color: COLORS.gray400,
    },
    tabTextActive: {
        color: COLORS.blue500,
    },
    embedDescription: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 17,
        marginBottom: 12,
    },
});
