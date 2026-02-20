import { router } from "expo-router";
import { useState, useEffect } from "react";
import {    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import { useAlert } from "../../components/TwinProAlert";

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
    gray700: "#374151",
    blue50: "#eff6ff",
    blue600: "#2563eb",
    green50: "#f0fdf4",
    green600: "#16a34a",
    purple50: "#faf5ff",
    purple600: "#9333ea",
};

const DURATIONS = [15, 30, 45, 60, 90];

export default function AppointmentPricingScreen() {
    const { user, token, refreshUser } = useAuth();
  const { showAlert } = useAlert();
    const [saving, setSaving] = useState(false);

    // Enable/Disable appointment types
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [presencialEnabled, setPresencialEnabled] = useState(true);

    // Default durations
    const [videoDuration, setVideoDuration] = useState(60);
    const [presencialDuration, setPresencialDuration] = useState(60);

    // Prices
    const [videoPrices, setVideoPrices] = useState<Record<number, string>>({
        15: "", 30: "", 45: "", 60: "", 90: "",
    });
    const [presencialPrices, setPresencialPrices] = useState<Record<number, string>>({
        15: "", 30: "", 45: "", 60: "", 90: "",
    });

    // Load existing data
    useEffect(() => {
        if (user) {
            // Load enabled states
            if (user.appointmentTypesEnabled) {
                setVideoEnabled(user.appointmentTypesEnabled.videoconference !== false);
                setPresencialEnabled(user.appointmentTypesEnabled.presencial !== false);
            }
            // Load durations
            if (user.appointmentDurations) {
                setVideoDuration(user.appointmentDurations.videoconference || 60);
                setPresencialDuration(user.appointmentDurations.presencial || 60);
            }
            // Load prices
            if (user.appointmentPrices) {
                if (user.appointmentPrices.videoconference) {
                    const vp: Record<number, string> = {};
                    DURATIONS.forEach(d => {
                        const val = user.appointmentPrices?.videoconference?.[d];
                        vp[d] = val ? String(val) : "";
                    });
                    setVideoPrices(vp);
                }
                if (user.appointmentPrices.presencial) {
                    const pp: Record<number, string> = {};
                    DURATIONS.forEach(d => {
                        const val = user.appointmentPrices?.presencial?.[d];
                        pp[d] = val ? String(val) : "";
                    });
                    setPresencialPrices(pp);
                }
            }
        }
    }, [user]);

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const videoP: Record<number, number> = {};
            const presencialP: Record<number, number> = {};
            DURATIONS.forEach(d => {
                videoP[d] = parseFloat(videoPrices[d]) || 0;
                presencialP[d] = parseFloat(presencialPrices[d]) || 0;
            });

            await userApi.updateUser(token, {
                appointmentTypesEnabled: {
                    videoconference: videoEnabled,
                    presencial: presencialEnabled,
                },
                appointmentDurations: {
                    videoconference: videoDuration,
                    presencial: presencialDuration,
                },
                appointmentPrices: {
                    videoconference: videoP,
                    presencial: presencialP,
                },
            });

            if (refreshUser) await refreshUser();
            showAlert({ type: 'success', title: '✓ Guardado', message: 'Tarifas actualizadas correctamente' });
        } catch (error) {
            console.error("Error saving prices:", error);
            showAlert({ type: 'error', title: 'Error', message: 'No se pudieron guardar las tarifas' });
        } finally {
            setSaving(false);
        }
    };

    const renderPriceGrid = (
        prices: Record<number, string>,
        setPrice: (d: number, v: string) => void,
        selectedDuration: number,
        setDuration: (d: number) => void,
        iconColor: string,
        enabled: boolean
    ) => (
        <View style={[styles.priceGrid, !enabled && styles.priceGridDisabled]}>
            {DURATIONS.map((mins) => (
                <TouchableOpacity
                    key={mins}
                    style={[
                        styles.priceCell,
                        selectedDuration === mins && enabled && styles.priceCellSelected,
                    ]}
                    onPress={() => enabled && setDuration(mins)}
                    activeOpacity={enabled ? 0.7 : 1}
                    disabled={!enabled}
                >
                    <View style={styles.priceCellHeader}>
                        <Text style={[
                            styles.priceCellDuration,
                            selectedDuration === mins && enabled && styles.priceCellDurationSelected,
                            !enabled && styles.textDisabled
                        ]}>
                            {mins}m
                        </Text>
                        {selectedDuration === mins && enabled && (
                            <View style={[styles.defaultBadge, { backgroundColor: iconColor }]}>
                                <MaterialIcons name="check" size={10} color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={styles.priceInputWrapper}>
                        <TextInput
                            style={[styles.priceInput, !enabled && styles.textDisabled]}
                            value={prices[mins]}
                            onChangeText={(v) => setPrice(mins, v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={COLORS.gray400}
                            editable={enabled}
                        />
                        <Text style={[styles.currencySymbol, !enabled && styles.textDisabled]}>€</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tarifas de Citas</Text>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.textMain} />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <MaterialIcons name="info-outline" size={16} color={COLORS.blue600} />
                    <Text style={styles.infoBannerText}>
                        Habilita los tipos de cita que ofreces. Toca una duración para marcarla por defecto.
                    </Text>
                </View>

                {/* Videollamada Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: COLORS.blue50 }]}>
                                <MaterialIcons name="videocam" size={18} color={COLORS.blue600} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Video-cita</Text>
                                <Text style={styles.sectionHint}>Citas por videoconferencia</Text>
                            </View>
                        </View>
                        <Switch
                            value={videoEnabled}
                            onValueChange={setVideoEnabled}
                            trackColor={{ false: COLORS.gray300, true: COLORS.blue600 }}
                            thumbColor={COLORS.surfaceLight}
                        />
                    </View>
                    <View style={[styles.card, !videoEnabled && styles.cardDisabled]}>
                        {renderPriceGrid(
                            videoPrices,
                            (d, v) => setVideoPrices(prev => ({ ...prev, [d]: v })),
                            videoDuration,
                            setVideoDuration,
                            COLORS.blue600,
                            videoEnabled
                        )}
                    </View>
                </View>

                {/* Presencial Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: COLORS.green50 }]}>
                                <MaterialIcons name="person" size={18} color={COLORS.green600} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Cita presencial</Text>
                                <Text style={styles.sectionHint}>Citas en tu ubicación física</Text>
                            </View>
                        </View>
                        <Switch
                            value={presencialEnabled}
                            onValueChange={setPresencialEnabled}
                            trackColor={{ false: COLORS.gray300, true: COLORS.green600 }}
                            thumbColor={COLORS.surfaceLight}
                        />
                    </View>
                    <View style={[styles.card, !presencialEnabled && styles.cardDisabled]}>
                        {renderPriceGrid(
                            presencialPrices,
                            (d, v) => setPresencialPrices(prev => ({ ...prev, [d]: v })),
                            presencialDuration,
                            setPresencialDuration,
                            COLORS.green600,
                            presencialEnabled
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
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
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: COLORS.blue50,
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.blue600,
        lineHeight: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    sectionHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    sectionHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    cardDisabled: {
        opacity: 0.5,
    },
    priceGrid: {
        flexDirection: "row",
        gap: 8,
    },
    priceGridDisabled: {
        opacity: 0.6,
    },
    priceCell: {
        flex: 1,
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    priceCellSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "#fffef0",
    },
    priceCellHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 6,
    },
    priceCellDuration: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray600,
    },
    priceCellDurationSelected: {
        color: COLORS.textMain,
        fontWeight: "700",
    },
    textDisabled: {
        color: COLORS.gray400,
    },
    defaultBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
    },
    priceInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        width: "100%",
    },
    priceInput: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
        minWidth: 30,
        paddingVertical: 2,
    },
    currencySymbol: {
        fontSize: 13,
        color: COLORS.gray500,
        marginLeft: 2,
    },
});
