import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, liveAvatarApi } from "../../api";

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#111827",
    surfaceLight: "#FFFFFF",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    gray800: "#1F2937",
    headerStart: "#0f172a",
    headerMiddle: "#1e3a8a",
    accentBlue: "#3B82F6",
    accentGreen: "#10B981",
    accentYellow: "#F59E0B",
    accentPurple: "#6366F1",
    accentRed: "#EF4444",
};

interface KnowledgeCategory {
    id: string;
    title: string;
    icon: string;
    color: string;
    bgColor: string;
    count: number;
    url: string;
}

const INITIAL_CATEGORIES: KnowledgeCategory[] = [
    { id: "faq", title: "Preguntas Frecuentes", icon: "quiz", color: COLORS.accentBlue, bgColor: "rgba(59, 130, 246, 0.1)", count: 0, url: "" },
    { id: "services", title: "Servicios y Productos", icon: "inventory-2", color: COLORS.accentGreen, bgColor: "rgba(16, 185, 129, 0.1)", count: 0, url: "" },
    { id: "pricing", title: "Tarifa de Precios", icon: "attach-money", color: COLORS.accentYellow, bgColor: "rgba(245, 158, 11, 0.1)", count: 0, url: "" },
    { id: "policy", title: "Política de Empresa", icon: "policy", color: COLORS.accentPurple, bgColor: "rgba(99, 102, 241, 0.1)", count: 0, url: "" },
    { id: "troubleshooting", title: "Resolución de Problemas", icon: "build", color: COLORS.accentRed, bgColor: "rgba(239, 68, 68, 0.1)", count: 0, url: "" },
];

// Helper to build prompt from user data
function buildContextPrompt(user: any): string {
    const parts: string[] = [];

    // Professional info
    if (user?.publicName || user?.profession) {
        parts.push(`Eres ${user.publicName || 'un profesional'}, ${user.profession || 'experto en tu campo'}.`);
    }
    if (user?.bio) {
        parts.push(user.bio);
    }

    // Behavior settings
    const behavior = user?.digitalTwin?.behavior;
    if (behavior) {
        const formalityLabels = ["muy cercano y amigable", "profesional y equilibrado", "muy formal y respetuoso"];
        const depthLabels = ["respuestas cortas y directas", "respuestas equilibradas", "respuestas detalladas y completas"];
        const toneLabels = ["empático y comprensivo", "neutral y objetivo", "directo y conciso"];

        parts.push(`Tu estilo de comunicación es ${formalityLabels[behavior.formality || 1]}.`);
        parts.push(`Das ${depthLabels[behavior.depth || 1]}.`);
        parts.push(`Tu tono es ${toneLabels[behavior.tone || 0]}.`);
    }

    // Guardrails
    const guardrails = user?.digitalTwin?.guardrails;
    if (guardrails) {
        if (guardrails.allowed && guardrails.allowed.length > 0) {
            parts.push(`Puedes: ${guardrails.allowed.join(', ')}.`);
        }
        if (guardrails.restricted && guardrails.restricted.length > 0) {
            parts.push(`No debes: ${guardrails.restricted.join(', ')}.`);
        }
    }

    // Specialties
    if (user?.specialties && user.specialties.length > 0) {
        parts.push(`Tus especialidades incluyen: ${user.specialties.join(', ')}.`);
    }

    return parts.join(' ');
}

// Helper to build links array from categories
function buildContextLinks(categories: KnowledgeCategory[], otherUrl: string): { url: string; description: string }[] {
    const result: { url: string; description: string }[] = [];

    for (const cat of categories) {
        if (cat.url && cat.url.trim()) {
            result.push({
                url: cat.url.trim(),
                description: cat.title,
            });
        }
    }

    if (otherUrl && otherUrl.trim()) {
        result.push({
            url: otherUrl.trim(),
            description: "Documentación adicional",
        });
    }

    return result;
}

export default function TwinKnowledgeScreen() {
    const { user, token, refreshUser } = useAuth();
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [otherUrl, setOtherUrl] = useState("");
    const [trainingProgress] = useState(5); // 5% por defecto
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    function handleBack() {
        router.back();
    }

    function handleUpload(categoryId: string) {
        // TODO: Implementar subida de documentos
        Alert.alert("Próximamente", "La subida de documentos estará disponible próximamente.");
        console.log("Upload for category:", categoryId);
    }

    function handleManualAdd(categoryId: string) {
        // TODO: Implementar añadir manual
        Alert.alert("Próximamente", "La entrada manual estará disponible próximamente.");
        console.log("Manual add for category:", categoryId);
    }

    function toggleUrlInput(categoryId: string) {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    }

    function updateCategoryUrl(categoryId: string, url: string) {
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId ? { ...cat, url } : cat
        ));
    }

    // Count filled URLs
    const filledUrlCount = categories.filter(c => c.url.trim() !== "").length + (otherUrl.trim() !== "" ? 1 : 0);

    async function handleActivate() {
        setIsLoading(true);
        try {
            if (!token) {
                throw new Error("No estás autenticado");
            }

            // First, refresh user to get the latest data from previous screens
            console.log("Refreshing user data...");
            let freshUser = user;
            if (refreshUser) {
                await refreshUser();
                // Get fresh user data by fetching directly
                const userData = await userApi.getMe(token);
                freshUser = userData;
                console.log("Fresh user data:", JSON.stringify(freshUser?.digitalTwin, null, 2));
            }

            // Build links object for storage
            const linksToStore: Record<string, string> = {};
            for (const cat of categories) {
                linksToStore[cat.id] = cat.url || "";
            }
            linksToStore.other = otherUrl || "";

            // Build the context prompt with fresh user data
            const contextPrompt = buildContextPrompt(freshUser);
            console.log("Context prompt built:", contextPrompt);

            // Build the links array from URLs
            const contextLinks = buildContextLinks(categories, otherUrl);
            console.log("Context links:", JSON.stringify(contextLinks, null, 2));

            // Check if user already has a context
            const existingContextId = freshUser?.digitalTwin?.liveAvatarContextId;
            let contextId: string | null = existingContextId || null;

            // Create or update the LiveAvatar context
            const contextName = `TwinPro - ${freshUser?.publicName || freshUser?.firstname || 'Professional'}`;
            console.log("Context name:", contextName);
            console.log("Existing context ID:", existingContextId);

            try {
                if (existingContextId) {
                    // Update existing context
                    console.log("Updating existing context...");
                    const result = await liveAvatarApi.updateContext(
                        existingContextId,
                        contextName,
                        contextPrompt,
                        contextLinks
                    );
                    console.log("Update context result:", result);
                    if (result) {
                        contextId = result.id;
                    }
                } else {
                    // Create new context (always create, even without links)
                    console.log("Creating new context...");
                    console.log("Request body:", { name: contextName, prompt: contextPrompt, links: contextLinks });
                    const result = await liveAvatarApi.createContext(
                        contextName,
                        contextPrompt,
                        contextLinks
                    );
                    console.log("Create context result:", JSON.stringify(result, null, 2));
                    if (result) {
                        contextId = result.id;
                        console.log("Context created with ID:", contextId);
                    } else {
                        console.warn("Context creation returned null");
                        Alert.alert("Aviso", "No se pudo crear el contexto en LiveAvatar, pero el gemelo se activará igualmente.");
                    }
                }
            } catch (contextError: any) {
                console.error("Error with LiveAvatar context:", contextError);
                console.error("Error details:", contextError?.message, contextError?.stack);
                Alert.alert("Aviso", `Error al crear contexto: ${contextError?.message || 'Error desconocido'}. El gemelo se activará igualmente.`);
                // Continue anyway - the twin can still be activated
            }

            console.log("Final context ID:", contextId);

            // Activar gemelo digital
            await userApi.updateUser(token, {
                digitalTwin: {
                    knowledge: {
                        links: linksToStore,
                        contextPrompt: contextPrompt,
                        trainingProgress: trainingProgress,
                        trainingStatus: 'ready'
                    },
                    liveAvatarContextId: contextId,
                    isActive: true,
                    activatedAt: new Date().toISOString()
                }
            });

            if (refreshUser) {
                await refreshUser();
            }

            router.push("/onboarding/pro-success");
        } catch (error: any) {
            console.error("Error activating twin:", error);
            Alert.alert("Error", error.message || "Error al activar el gemelo");
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
                        <Text style={styles.stepText}>Paso 3 de 3</Text>
                        <View style={styles.stepDots}>
                            <View style={styles.stepDotDone} />
                            <View style={styles.stepDotDone} />
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.helpButton}>
                        <Text style={styles.helpText}>Ayuda</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Base de Conocimientos</Text>
                    <Text style={styles.headerSubtitle}>Sube documentos para entrenar a tu Gemelo Digital.</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Training Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View style={styles.progressIconContainer}>
                            <MaterialIcons name="psychology" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.progressTitle}>Estado del Entrenamiento</Text>
                            <Text style={styles.progressSubtitle}>Aprendizaje Inicial</Text>
                        </View>
                        <Text style={styles.progressPercent}>{trainingProgress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${trainingProgress}%` }]} />
                    </View>
                    <View style={styles.progressFooter}>
                        <Text style={styles.progressFooterText}>
                            {filledUrlCount > 0 ? `${filledUrlCount} URLs configuradas` : "0/5 Categorías completadas"}
                        </Text>
                        <Text style={styles.progressFooterHint}>
                            {filledUrlCount > 0 ? "URLs añadidas" : "Falta información clave"}
                        </Text>
                    </View>
                </View>

                {/* Knowledge Categories */}
                {categories.map((category) => (
                    <View key={category.id} style={styles.categoryCard}>
                        <View style={styles.categoryHeader}>
                            <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                                <MaterialIcons name={category.icon as any} size={18} color={category.color} />
                            </View>
                            <Text style={styles.categoryTitle}>{category.title}</Text>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>
                                    {category.url.trim() ? "URL" : `${category.count} Cargados`}
                                </Text>
                            </View>
                        </View>

                        {/* Original buttons */}
                        <View style={styles.categoryButtons}>
                            <TouchableOpacity
                                style={styles.categoryButton}
                                onPress={() => handleUpload(category.id)}
                            >
                                <MaterialIcons name="upload-file" size={20} color={COLORS.gray400} />
                                <Text style={styles.categoryButtonText}>
                                    {category.id === "pricing" ? "Subir Tarifas" :
                                        category.id === "services" ? "Subir Catálogo" :
                                            category.id === "policy" ? "Subir Política" :
                                                category.id === "troubleshooting" ? "Subir Guía" :
                                                    "Subir PDF/DOC"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.categoryButton}
                                onPress={() => handleManualAdd(category.id)}
                            >
                                <MaterialIcons name="edit-note" size={20} color={COLORS.gray400} />
                                <Text style={styles.categoryButtonText}>
                                    {category.id === "pricing" ? "Añadir Precios" :
                                        category.id === "services" ? "Listar Manual" :
                                            category.id === "policy" ? "Escribir Política" :
                                                category.id === "troubleshooting" ? "Añadir Solución" :
                                                    "Añadir Manual"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* URL Input Toggle */}
                        <TouchableOpacity
                            style={styles.urlToggle}
                            onPress={() => toggleUrlInput(category.id)}
                        >
                            <MaterialIcons name="link" size={16} color={COLORS.accentBlue} />
                            <Text style={styles.urlToggleText}>
                                {expandedCategory === category.id ? "Ocultar URL" : "Añadir URL"}
                            </Text>
                            <MaterialIcons
                                name={expandedCategory === category.id ? "expand-less" : "expand-more"}
                                size={18}
                                color={COLORS.accentBlue}
                            />
                        </TouchableOpacity>

                        {/* URL Input Field */}
                        {expandedCategory === category.id && (
                            <View style={styles.urlInputContainer}>
                                <MaterialIcons name="link" size={18} color={COLORS.gray400} />
                                <TextInput
                                    style={styles.urlInput}
                                    placeholder={`https://tudominio.com/${category.id}`}
                                    placeholderTextColor={COLORS.gray400}
                                    value={category.url}
                                    onChangeText={(text) => updateCategoryUrl(category.id, text)}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {category.url.trim() !== "" && (
                                    <TouchableOpacity onPress={() => updateCategoryUrl(category.id, "")}>
                                        <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                ))}

                {/* Other Documents Card */}
                <View style={styles.otherDocsCard}>
                    <View style={styles.categoryHeader}>
                        <View style={[styles.categoryIcon, { backgroundColor: COLORS.gray100 }]}>
                            <MaterialIcons name="folder-open" size={18} color={COLORS.gray500} />
                        </View>
                        <View style={styles.otherDocsTextContainer}>
                            <Text style={styles.categoryTitle}>Otros Documentos (Libre)</Text>
                            <Text style={styles.otherDocsSubtitle}>Archivos adicionales no categorizados</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.uploadZone} onPress={() => handleUpload("other")}>
                        <View style={styles.uploadIconContainer}>
                            <MaterialIcons name="cloud-upload" size={24} color={COLORS.gray400} />
                        </View>
                        <Text style={styles.uploadTitle}>Subir Documento Libre</Text>
                        <Text style={styles.uploadSubtitle}>Soporta PDF, DOCX, TXT</Text>
                    </TouchableOpacity>

                    {/* URL Input for Other Documents */}
                    <View style={styles.urlInputContainerOther}>
                        <Text style={styles.urlLabel}>O añade una URL:</Text>
                        <View style={styles.urlInputRow}>
                            <MaterialIcons name="link" size={18} color={COLORS.gray400} />
                            <TextInput
                                style={styles.urlInput}
                                placeholder="https://tudominio.com/otros"
                                placeholderTextColor={COLORS.gray400}
                                value={otherUrl}
                                onChangeText={setOtherUrl}
                                keyboardType="url"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {otherUrl.trim() !== "" && (
                                <TouchableOpacity onPress={() => setOtherUrl("")}>
                                    <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                <Text style={styles.disclaimer}>Los documentos se procesarán de forma segura.</Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.activateButton}
                    onPress={handleActivate}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <MaterialIcons name="rocket-launch" size={20} color="#000000" />
                            <Text style={styles.activateButtonText}>Activar Gemelo Digital</Text>
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
        paddingTop: 56,
        paddingBottom: 48,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
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
        fontWeight: "bold",
        color: "rgba(191, 219, 254, 0.7)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    stepDots: {
        flexDirection: "row",
        gap: 6,
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
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: "rgba(191, 219, 254, 0.7)",
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
        marginTop: -12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    progressCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "rgba(253, 224, 71, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    progressIconContainer: {
        backgroundColor: COLORS.gray800,
        padding: 6,
        borderRadius: 8,
        marginRight: 12,
    },
    progressTextContainer: {
        flex: 1,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    progressSubtitle: {
        fontSize: 10,
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    progressPercent: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.primary,
    },
    progressBar: {
        height: 12,
        backgroundColor: COLORS.gray100,
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: {
        height: "100%",
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    progressFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressFooterText: {
        fontSize: 10,
        color: COLORS.gray400,
    },
    progressFooterHint: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    categoryCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FFFFFF",
    },
    categoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 10,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    categoryBadge: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
    },
    categoryButtons: {
        flexDirection: "row",
        gap: 10,
    },
    categoryButton: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.gray50,
        gap: 6,
    },
    categoryButtonText: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.gray500,
        textAlign: "center",
    },
    urlToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        marginTop: 8,
        gap: 4,
    },
    urlToggleText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.accentBlue,
    },
    urlInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginTop: 8,
    },
    urlInput: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMain,
    },
    otherDocsCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    otherDocsTextContainer: {
        flex: 1,
    },
    otherDocsSubtitle: {
        fontSize: 10,
        color: COLORS.gray400,
    },
    uploadZone: {
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.gray200,
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    uploadIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    uploadTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray700,
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontSize: 9,
        color: COLORS.gray400,
    },
    urlInputContainerOther: {
        marginTop: 12,
    },
    urlLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        marginBottom: 6,
    },
    urlInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    disclaimer: {
        fontSize: 10,
        color: COLORS.gray400,
        textAlign: "center",
        paddingVertical: 8,
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 24,
    },
    activateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    activateButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
});
