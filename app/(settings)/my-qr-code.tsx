import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Share,
    Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../context";
import { usernameApi } from "../../api";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    blue50: "#eff6ff",
    blue500: "#3b82f6",
    blue600: "#2563eb",
    green50: "#f0fdf4",
    green500: "#22c55e",
    green600: "#16a34a",
    red50: "#fef2f2",
    red500: "#ef4444",
    red600: "#dc2626",
    white: "#FFFFFF",
};

export default function MyQRCodeScreen() {
    const { token, user, refreshUser } = useAuth();
    const [username, setUsername] = useState(user?.username || "");
    const [isEditing, setIsEditing] = useState(!user?.username);
    const [isSaving, setIsSaving] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; reason?: string | null } | null>(null);

    const qrUrl = user?.username ? `https://twinpro.app/@${user.username}` : null;

    // Debounce username check
    useEffect(() => {
        if (!isEditing || !username || username === user?.username) {
            setAvailability(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsChecking(true);
            try {
                const result = await usernameApi.checkAvailability(username);
                setAvailability(result);
            } catch (error) {
                console.error("Error checking availability:", error);
            } finally {
                setIsChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, isEditing]);

    function handleBack() {
        router.back();
    }

    async function handleSaveUsername() {
        if (!token || !username.trim()) return;

        setIsSaving(true);
        try {
            await usernameApi.updateUsername(token, username.trim());
            if (refreshUser) await refreshUser();
            setIsEditing(false);
            Alert.alert("¡Éxito!", "Tu código QR está listo para compartir");
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo guardar el username");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleShare() {
        if (!qrUrl) return;

        try {
            await Share.share({
                message: `¡Conecta conmigo en TwinPro! ${qrUrl}`,
                url: qrUrl,
            });
        } catch (error) {
            console.error("Error sharing:", error);
        }
    }

    function handleCopyLink() {
        if (!qrUrl) return;
        Clipboard.setString(qrUrl);
        Alert.alert("¡Copiado!", "El enlace se ha copiado al portapapeles");
    }

    const isUsernameValid = /^[a-z0-9_-]{3,30}$/.test(username.toLowerCase());

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Código QR</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* QR Code Display */}
                <View style={styles.qrCard}>
                    {user?.username ? (
                        <>
                            <View style={styles.qrContainer}>
                                <QRCode
                                    value={qrUrl!}
                                    size={200}
                                    color={COLORS.textMain}
                                    backgroundColor={COLORS.white}
                                />
                            </View>
                            <Text style={styles.qrUrl}>{qrUrl}</Text>
                            <Text style={styles.qrHint}>
                                Los clientes pueden escanear este código para hablar con tu gemelo digital
                            </Text>
                        </>
                    ) : (
                        <View style={styles.noQrContainer}>
                            <View style={styles.noQrIcon}>
                                <MaterialIcons name="qr-code-2" size={48} color={COLORS.gray400} />
                            </View>
                            <Text style={styles.noQrTitle}>Configura tu código QR</Text>
                            <Text style={styles.noQrHint}>
                                Elige un nombre de usuario único para generar tu código QR personalizado
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                {user?.username && !isEditing && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.blue50 }]}>
                                <MaterialIcons name="share" size={22} color={COLORS.blue600} />
                            </View>
                            <Text style={styles.actionLabel}>Compartir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.green50 }]}>
                                <MaterialIcons name="content-copy" size={22} color={COLORS.green600} />
                            </View>
                            <Text style={styles.actionLabel}>Copiar enlace</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditing(true)}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.gray100 }]}>
                                <MaterialIcons name="edit" size={22} color={COLORS.gray600} />
                            </View>
                            <Text style={styles.actionLabel}>Editar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Username Editor */}
                {isEditing && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>NOMBRE DE USUARIO</Text>
                        <Text style={styles.sectionHint}>
                            Este nombre aparecerá en tu enlace personalizado. Solo letras, números, guiones y guiones bajos.
                        </Text>

                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabel}>
                                    <Text style={styles.inputPrefix}>twinpro.app/@</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                    placeholder="tu-nombre"
                                    placeholderTextColor={COLORS.gray400}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    maxLength={30}
                                />
                            </View>

                            {/* Availability indicator */}
                            {username.length >= 3 && (
                                <View style={styles.availabilityRow}>
                                    {isChecking ? (
                                        <ActivityIndicator size="small" color={COLORS.blue500} />
                                    ) : availability ? (
                                        <>
                                            <MaterialIcons
                                                name={availability.available ? "check-circle" : "cancel"}
                                                size={18}
                                                color={availability.available ? COLORS.green500 : COLORS.red500}
                                            />
                                            <Text style={[
                                                styles.availabilityText,
                                                { color: availability.available ? COLORS.green600 : COLORS.red600 }
                                            ]}>
                                                {availability.available ? "Disponible" : availability.reason}
                                            </Text>
                                        </>
                                    ) : null}
                                </View>
                            )}

                            {/* Character count */}
                            <Text style={styles.charCount}>
                                {username.length}/30 caracteres (mínimo 3)
                            </Text>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                (!isUsernameValid || !availability?.available || isSaving) && styles.saveButtonDisabled
                            ]}
                            onPress={handleSaveUsername}
                            disabled={!isUsernameValid || !availability?.available || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={COLORS.textMain} />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={20} color={COLORS.textMain} />
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {user?.username && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setUsername(user.username || "");
                                    setIsEditing(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: COLORS.blue50 }]}>
                            <MaterialIcons name="qr-code-scanner" size={20} color={COLORS.blue600} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Fácil de compartir</Text>
                            <Text style={styles.infoText}>Imprime el código o compártelo digitalmente</Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="smartphone" size={20} color={COLORS.green600} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Abre la app automáticamente</Text>
                            <Text style={styles.infoText}>Los clientes irán directo a tu gemelo digital</Text>
                        </View>
                    </View>
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
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
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
        padding: 16,
        paddingBottom: 40,
    },
    qrCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 16,
    },
    qrUrl: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.blue600,
        marginBottom: 8,
    },
    qrHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: "center",
        maxWidth: 250,
    },
    noQrContainer: {
        alignItems: "center",
        paddingVertical: 24,
    },
    noQrIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    noQrTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    noQrHint: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        maxWidth: 280,
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 24,
    },
    actionButton: {
        alignItems: "center",
        gap: 8,
    },
    actionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 12,
        lineHeight: 18,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputPrefix: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    input: {
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    availabilityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
    },
    availabilityText: {
        fontSize: 13,
        fontWeight: "500",
    },
    charCount: {
        fontSize: 11,
        color: COLORS.gray400,
        textAlign: "right",
        marginTop: 8,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    cancelButton: {
        alignItems: "center",
        paddingVertical: 12,
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoSection: {
        gap: 12,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        borderRadius: 12,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
});
