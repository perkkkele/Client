import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
    ActivityIndicator,    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import { getPresetForProfessional } from "../../constants/digitalTwinPresets";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from "react-i18next";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#111827",
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
    accentPurple: "#6366F1",
    accentGreen: "#10B981",
    accentRed: "#EF4444",
    headerStart: "#0f172a",
    headerMiddle: "#1e3a8a",
};

const FORMALITY_LABELS_FALLBACK = ["Muy cercano", "Profesional", "Muy formal"];
const DEPTH_LABELS_FALLBACK = ["Cortas", "Equilibradas", "Detalladas"];
const TONE_LABELS_FALLBACK = ["Empático", "Neutro", "Directo"];

// Custom segmented control component
function SegmentedControl({
    options,
    value,
    onChange
}: {
    options: string[];
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <View style={segmentStyles.container}>
            {options.map((label, i) => (
                <TouchableOpacity
                    key={i}
                    style={[
                        segmentStyles.button,
                        value === i && segmentStyles.buttonActive
                    ]}
                    onPress={() => onChange(i)}
                >
                    <Text style={[
                        segmentStyles.buttonText,
                        value === i && segmentStyles.buttonTextActive
                    ]}>
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const segmentStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        padding: 4,
        gap: 4,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.gray500,
    },
    buttonTextActive: {
        color: "#000000",
        fontWeight: "bold",
    },
});

export default function TwinBehaviorScreen() {
    const { token, refreshUser, user } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('onboarding');
    const FORMALITY_LABELS = t('twinBehavior.formalityOptions', { returnObjects: true }) as string[] || FORMALITY_LABELS_FALLBACK;
    const DEPTH_LABELS = t('twinBehavior.depthOptions', { returnObjects: true }) as string[] || DEPTH_LABELS_FALLBACK;
    const TONE_LABELS = t('twinBehavior.toneOptions', { returnObjects: true }) as string[] || TONE_LABELS_FALLBACK;
    const [formality, setFormality] = useState(1);
    const [depth, setDepth] = useState(1);
    const [tone, setTone] = useState(0);
    const [isPresetApplied, setIsPresetApplied] = useState(false);

    const [allowedActions, setAllowedActions] = useState([
        { id: "1", text: "Dar precio exacto", enabled: true },
        { id: "2", text: "Agendar citas", enabled: true },
        { id: "3", text: "Responder FAQs", enabled: true },
    ]);
    const [newAllowed, setNewAllowed] = useState("");

    const [restrictedActions, setRestrictedActions] = useState([
        { id: "1", text: "Dar consejos médicos", enabled: true },
        { id: "2", text: "Compartir info personal", enabled: true },
        { id: "3", text: "Hacer llamadas salientes", enabled: true },
    ]);
    const [newRestricted, setNewRestricted] = useState("");

    const [objective, setObjective] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Load previous configuration from user data OR apply preset
    useEffect(() => {
        console.log('[TwinBehavior] useEffect triggered');
        console.log('[TwinBehavior] User data:', {
            category: user?.category,
            profession: user?.profession,
            hasDigitalTwin: !!user?.digitalTwin,
            hasBehavior: !!user?.digitalTwin?.behavior,
            hasGuardrails: !!user?.digitalTwin?.guardrails
        });

        const behavior = user?.digitalTwin?.behavior;
        const guardrails = user?.digitalTwin?.guardrails;

        console.log('[TwinBehavior] behavior:', behavior);
        console.log('[TwinBehavior] guardrails:', guardrails);

        // Un objetivo no vacío indica que el usuario personalizó su configuración
        // o que ya se aplicó un preset anteriormente
        const hasCustomObjective = !!(behavior?.objective && behavior.objective.trim().length > 0);

        // Solo consideramos que hay config guardada si hay un objetivo personalizado
        // Los guardrails por defecto (hardcodeados) no cuentan como config personalizada
        const hasSavedConfig = hasCustomObjective;

        console.log('[TwinBehavior] hasCustomObjective:', hasCustomObjective);
        console.log('[TwinBehavior] hasSavedConfig:', hasSavedConfig);

        if (hasSavedConfig) {
            console.log('[TwinBehavior] Loading saved config...');
            // Usuario tiene configuración previa guardada - cargarla
            if (behavior) {
                if (behavior.formality !== undefined) setFormality(behavior.formality);
                if (behavior.depth !== undefined) setDepth(behavior.depth);
                if (behavior.tone !== undefined) setTone(behavior.tone);
                if (behavior.objective) setObjective(behavior.objective);
            }

            if (guardrails) {
                if (guardrails.allowed && guardrails.allowed.length > 0) {
                    setAllowedActions(
                        guardrails.allowed.map((text, index) => ({
                            id: `saved-allowed-${index}`,
                            text,
                            enabled: true
                        }))
                    );
                }
                if (guardrails.restricted && guardrails.restricted.length > 0) {
                    setRestrictedActions(
                        guardrails.restricted.map((text, index) => ({
                            id: `saved-restricted-${index}`,
                            text,
                            enabled: true
                        }))
                    );
                }
            }
        } else {
            // No hay configuración previa - aplicar preset según categoría/profesión
            console.log('[TwinBehavior] Applying preset for:', {
                category: user?.category,
                profession: user?.profession,
                hasCategory: !!user?.category,
                hasProfession: !!user?.profession
            });
            const preset = getPresetForProfessional(user?.category, user?.profession);
            console.log('[TwinBehavior] Preset applied:', preset);

            setFormality(preset.formality);
            setDepth(preset.depth);
            setTone(preset.tone);
            setObjective(preset.objective);
            setAllowedActions(
                preset.allowed.map((text, index) => ({
                    id: `preset-allowed-${index}`,
                    text,
                    enabled: true
                }))
            );
            setRestrictedActions(
                preset.restricted.map((text, index) => ({
                    id: `preset-restricted-${index}`,
                    text,
                    enabled: true
                }))
            );
            setIsPresetApplied(true);
        }
    }, [user]);

    function handleBack() {
        router.back();
    }

    function addAllowedAction() {
        if (newAllowed.trim()) {
            setAllowedActions([...allowedActions, { id: Date.now().toString(), text: newAllowed.trim(), enabled: true }]);
            setNewAllowed("");
        }
    }

    function addRestrictedAction() {
        if (newRestricted.trim()) {
            setRestrictedActions([...restrictedActions, { id: Date.now().toString(), text: newRestricted.trim(), enabled: true }]);
            setNewRestricted("");
        }
    }

    function removeAllowedAction(id: string) {
        setAllowedActions(allowedActions.filter(a => a.id !== id));
    }

    function removeRestrictedAction(id: string) {
        setRestrictedActions(restrictedActions.filter(a => a.id !== id));
    }

    async function handleContinue() {
        setIsLoading(true);
        try {
            if (token) {
                await userApi.updateUser(token, {
                    digitalTwin: {
                        behavior: {
                            formality,
                            depth,
                            tone,
                            objective
                        },
                        guardrails: {
                            allowed: allowedActions.map(a => a.text),
                            restricted: restrictedActions.map(a => a.text)
                        },
                        // Mark that context needs to be regenerated with new behavior
                        contextNeedsSync: true
                    }
                });

                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/twin-knowledge");
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message || t('twinBehavior.saveError') });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepText}>{t('twinBehavior.stepOf', { current: 2, total: 3 })}</Text>
                        <View style={styles.stepDots}>
                            <View style={styles.stepDotDone} />
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View style={styles.stepDot} />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => router.push("/onboarding/help-twin-behavior")}
                    >
                        <Text style={styles.helpText}>{t('twinBehavior.help')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('twinBehavior.headerTitle')}</Text>
                    <Text style={styles.headerSubtitle}>{t('twinBehavior.headerSubtitle')}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Objetivo del Gemelo */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="flag" size={20} color={COLORS.accentGreen} />
                        <Text style={styles.cardTitle}>{t('twinBehavior.objectiveTitle')}</Text>
                    </View>
                    <Text style={styles.objectiveDescription}>
                        {t('twinBehavior.objectiveDescription')}
                    </Text>
                    <TextInput
                        style={styles.objectiveInput}
                        placeholder={t('twinBehavior.objectivePlaceholder')}
                        placeholderTextColor={COLORS.gray400}
                        value={objective}
                        onChangeText={setObjective}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="tune" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>{t('twinBehavior.interactionTitle')}</Text>
                    </View>

                    <View style={styles.sliderGroup}>
                        <Text style={styles.sliderLabel}>{t('twinBehavior.formalityLabel')}</Text>
                        <SegmentedControl
                            options={FORMALITY_LABELS}
                            value={formality}
                            onChange={setFormality}
                        />
                    </View>

                    <View style={styles.sliderGroup}>
                        <Text style={styles.sliderLabel}>{t('twinBehavior.depthLabel')}</Text>
                        <SegmentedControl
                            options={DEPTH_LABELS}
                            value={depth}
                            onChange={setDepth}
                        />
                    </View>

                    <View style={styles.sliderGroup}>
                        <Text style={styles.sliderLabel}>{t('twinBehavior.toneLabel')}</Text>
                        <SegmentedControl
                            options={TONE_LABELS}
                            value={tone}
                            onChange={setTone}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.accentPurple} />
                        <Text style={styles.cardTitle}>Guardarraíles</Text>
                        <View style={styles.securityBadge}>
                            <Text style={styles.securityBadgeText}>SEGURIDAD IA</Text>
                        </View>
                    </View>

                    <View style={styles.rulesSection}>
                        <View style={styles.rulesSectionHeader}>
                            <View style={[styles.ruleIcon, { backgroundColor: COLORS.accentGreen }]}>
                                <MaterialIcons name="check" size={12} color="#FFFFFF" />
                            </View>
                            <Text style={styles.rulesSectionTitle}>{t('twinBehavior.allowedTitle')}</Text>
                        </View>
                        {allowedActions.map((action) => (
                            <View key={action.id} style={styles.ruleItem}>
                                <View style={styles.ruleCheckbox}>
                                    <MaterialIcons name="check-box" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.ruleText}>{action.text}</Text>
                                <TouchableOpacity onPress={() => removeAllowedAction(action.id)}>
                                    <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View style={styles.addRuleContainer}>
                            <MaterialIcons name="add" size={16} color={COLORS.gray400} />
                            <TextInput
                                style={styles.addRuleInput}
                                placeholder={t('twinBehavior.addAllowedPlaceholder')}
                                placeholderTextColor={COLORS.gray400}
                                value={newAllowed}
                                onChangeText={setNewAllowed}
                                onSubmitEditing={addAllowedAction}
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.rulesSection}>
                        <View style={styles.rulesSectionHeader}>
                            <View style={[styles.ruleIcon, { backgroundColor: COLORS.accentRed }]}>
                                <MaterialIcons name="close" size={12} color="#FFFFFF" />
                            </View>
                            <Text style={styles.rulesSectionTitle}>{t('twinBehavior.restrictedTitle')}</Text>
                        </View>
                        {restrictedActions.map((action) => (
                            <View key={action.id} style={styles.ruleItem}>
                                <View style={styles.ruleCheckbox}>
                                    <MaterialIcons name="check-box" size={20} color={COLORS.accentRed} />
                                </View>
                                <Text style={styles.ruleText}>{action.text}</Text>
                                <TouchableOpacity onPress={() => removeRestrictedAction(action.id)}>
                                    <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View style={styles.addRuleContainer}>
                            <MaterialIcons name="add" size={16} color={COLORS.gray400} />
                            <TextInput
                                style={styles.addRuleInput}
                                placeholder={t('twinBehavior.addRestrictedPlaceholder')}
                                placeholderTextColor={COLORS.gray400}
                                value={newRestricted}
                                onChangeText={setNewRestricted}
                                onSubmitEditing={addRestrictedAction}
                                returnKeyType="done"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

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
                            <Text style={styles.continueButtonText}>{t('twinBehavior.saveAndContinue')}</Text>
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
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
    },
    stepIndicator: {
        alignItems: "center",
    },
    stepText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.gray400,
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
        backgroundColor: COLORS.gray700,
    },
    stepDotDone: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(253, 224, 71, 0.4)",
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
        color: COLORS.gray400,
    },
    scrollView: {
        flex: 1,
        marginTop: -16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingBottom: 12,
        marginBottom: 16,
        gap: 8,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textMain,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        flex: 1,
    },
    securityBadge: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    securityBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.accentPurple,
    },
    sliderGroup: {
        marginBottom: 20,
    },
    sliderLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        marginBottom: 8,
    },
    objectiveDescription: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 12,
        lineHeight: 18,
    },
    objectiveInput: {
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    rulesSection: {
        marginBottom: 16,
    },
    rulesSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    ruleIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    rulesSectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray700,
    },
    ruleItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 12,
    },
    ruleCheckbox: {
        width: 20,
    },
    ruleText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.gray500,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 16,
    },
    addRuleContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginTop: 8,
        gap: 8,
    },
    addRuleInput: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textMain,
    },
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
