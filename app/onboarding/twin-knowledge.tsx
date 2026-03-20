import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
    ActivityIndicator,    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../context";
import { userApi, liveAvatarApi, customTwinApi } from "../../api";
import { KnowledgeDocument } from "../../api/user";
import { getCategoryInstruction } from "../../constants/digitalTwinPresets";
import { useAlert } from "../../components/TwinProAlert";

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
    manualContent: string;
}

const INITIAL_CATEGORIES: KnowledgeCategory[] = [
    { id: "faq", title: "Preguntas Frecuentes", icon: "quiz", color: COLORS.accentBlue, bgColor: "rgba(59, 130, 246, 0.1)", count: 0, url: "", manualContent: "" },
    { id: "services", title: "Servicios y Productos", icon: "inventory-2", color: COLORS.accentGreen, bgColor: "rgba(16, 185, 129, 0.1)", count: 0, url: "", manualContent: "" },
    { id: "pricing", title: "Tarifa de Precios", icon: "attach-money", color: COLORS.accentYellow, bgColor: "rgba(245, 158, 11, 0.1)", count: 0, url: "", manualContent: "" },
    { id: "policy", title: "Política de Empresa", icon: "policy", color: COLORS.accentPurple, bgColor: "rgba(99, 102, 241, 0.1)", count: 0, url: "", manualContent: "" },
    { id: "troubleshooting", title: "Resolución de Problemas", icon: "build", color: COLORS.accentRed, bgColor: "rgba(239, 68, 68, 0.1)", count: 0, url: "", manualContent: "" },
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

    // Objective - what the twin should achieve
    const objective = user?.digitalTwin?.behavior?.objective;
    if (objective) {
        parts.push(`Tu objetivo principal es: ${objective}`);
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

    // Industry-specific instructions based on category
    const categoryInstruction = getCategoryInstruction(user?.category);
    if (categoryInstruction) {
        parts.push(categoryInstruction);
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
  const { showAlert } = useAlert();
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [otherUrl, setOtherUrl] = useState("");
    const [trainingProgress] = useState(5); // 5% por defecto
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Manual entry modal state
    const [manualModalVisible, setManualModalVisible] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");

    // Load previous knowledge configuration from user data on mount
    useEffect(() => {
        const knowledgeLinks = user?.digitalTwin?.knowledge?.links;
        const knowledgeManual = user?.digitalTwin?.knowledge?.manualContent;

        if (knowledgeLinks || knowledgeManual) {
            // Update categories with saved URLs and manual content
            setCategories(prev => prev.map(cat => {
                const savedUrl = knowledgeLinks ? (knowledgeLinks as any)[cat.id] : "";
                const savedManual = knowledgeManual ? (knowledgeManual as any)[cat.id] : "";
                return {
                    ...cat,
                    url: savedUrl || cat.url,
                    manualContent: savedManual || cat.manualContent
                };
            }));

            // Load "other" URL if present
            if (knowledgeLinks?.other) {
                setOtherUrl(knowledgeLinks.other);
            }
        }
    }, [user]);

    function handleBack() {
        router.back();
    }

    // State for uploaded documents
    const [uploadedDocuments, setUploadedDocuments] = useState<KnowledgeDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Load documents from user data on mount
    useEffect(() => {
        const docs = user?.digitalTwin?.knowledge?.documents as KnowledgeDocument[] | undefined;
        if (docs && Array.isArray(docs)) {
            setUploadedDocuments(docs);
            // Update category counts
            setCategories(prev => prev.map(cat => ({
                ...cat,
                count: docs.filter(d => d.category === cat.id).length
            })));
        }
    }, [user]);

    async function handleUpload(categoryId: string) {
        if (!token) {
            showAlert({ type: 'error', title: 'Error', message: 'Debes estar autenticado para subir documentos' });
            return;
        }

        try {
            // Open document picker
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain"
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                console.log("Document picker cancelled");
                return;
            }

            const file = result.assets[0];
            console.log("Selected file:", file);

            // Validate file size (10MB max)
            if (file.size && file.size > 10 * 1024 * 1024) {
                showAlert({ type: 'info', title: 'Archivo muy grande', message: 'El tamaño máximo es 10MB' });
                return;
            }

            setIsUploading(true);

            // Upload to server
            const response = await userApi.uploadKnowledgeDocument(
                token,
                categoryId,
                {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || "application/octet-stream",
                }
            );

            console.log("Upload response:", response);

            // Update local state
            setUploadedDocuments(response.documents);

            // Update category count
            setCategories(prev => prev.map(cat => ({
                ...cat,
                count: response.documents.filter(d => d.category === cat.id).length
            })));

            showAlert({ type: 'success', title: 'Éxito', message: `Documento "${file.name}" subido correctamente` });

        } catch (error: any) {
            console.error("Upload error:", error);
            showAlert({ type: 'error', title: 'Error', message: error.message || "No se pudo subir el documento" });
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDeleteDocument(documentId: string) {
        if (!token) return;

        showAlert({
    type: 'warning',
    title: 'Eliminar documento',
    message: '¿Estás seguro de que quieres eliminar este documento?',
    buttons: [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await userApi.deleteKnowledgeDocument(token, documentId);
                            setUploadedDocuments(response.documents);
                            // Update category counts
                            setCategories(prev => prev.map(cat => ({
                                ...cat,
                                count: response.documents.filter(d => d.category === cat.id).length
                            })));
                            showAlert({ type: 'success', title: 'Éxito', message: 'Documento eliminado' });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message || "No se pudo eliminar el documento" });
                        }
                    }
                }
            ]
});
    }

    function handleManualAdd(categoryId: string) {
        const category = categories.find(c => c.id === categoryId);
        setEditingCategoryId(categoryId);
        setEditingContent(category?.manualContent || "");
        setManualModalVisible(true);
    }

    function handleSaveManualContent() {
        if (editingCategoryId) {
            setCategories(prev => prev.map(cat =>
                cat.id === editingCategoryId
                    ? { ...cat, manualContent: editingContent.trim() }
                    : cat
            ));
        }
        setManualModalVisible(false);
        setEditingCategoryId(null);
        setEditingContent("");
    }

    function handleCancelManualEdit() {
        setManualModalVisible(false);
        setEditingCategoryId(null);
        setEditingContent("");
    }

    function toggleUrlInput(categoryId: string) {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    }

    function updateCategoryUrl(categoryId: string, url: string) {
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId ? { ...cat, url } : cat
        ));
    }

    // Count filled entries (URLs or manual content)
    const filledCount = categories.filter(c => c.url.trim() !== "" || c.manualContent.trim() !== "").length + (otherUrl.trim() !== "" ? 1 : 0);

    // Get editing category info for modal
    const editingCategory = categories.find(c => c.id === editingCategoryId);

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

            // Create or update the LiveAvatar context with unique name (include user ID)
            const userId = (freshUser as any)?._id || Date.now().toString();
            const contextName = `TwinPro - ${freshUser?.publicName || freshUser?.firstname || 'Professional'} (${userId.toString().slice(-6)})`;
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
                    // Create new context (without links - API has complex format requirements)
                    // The prompt already contains the important business info
                    console.log("Creating new context...");
                    console.log("Request body:", { name: contextName, prompt: contextPrompt });

                    try {
                        const result = await liveAvatarApi.createContext(
                            contextName,
                            contextPrompt,
                            [] // Empty links - API format is complex, prompt is sufficient
                        );
                        console.log("Create context result:", JSON.stringify(result, null, 2));
                        if (result) {
                            contextId = result.id;
                            console.log("Context created with ID:", contextId);
                        }
                    } catch (createError: any) {
                        // If context with name exists, try with a more unique name
                        if (createError.message?.includes("already exists")) {
                            console.log("Context name exists, trying with timestamp...");
                            const uniqueName = `TwinPro - ${freshUser?.publicName || 'Professional'} (${Date.now()})`;
                            const result = await liveAvatarApi.createContext(
                                uniqueName,
                                contextPrompt,
                                []
                            );
                            if (result) {
                                contextId = result.id;
                                console.log("Context created with unique name, ID:", contextId);
                            }
                        } else {
                            throw createError;
                        }
                    }
                }
            } catch (contextError: any) {
                console.error("Error with LiveAvatar context:", contextError);
                console.error("Error details:", contextError?.message, contextError?.stack);
                showAlert({ type: 'info', title: 'Aviso', message: `Error al crear contexto: ${contextError?.message || 'Error desconocido'}. El gemelo se activará igualmente.` });
                // Continue anyway - the twin can still be activated
            }

            console.log("Final context ID:", contextId);

            // Build manual content object for storage
            const manualContentToStore: Record<string, string> = {};
            for (const cat of categories) {
                if (cat.manualContent.trim()) {
                    manualContentToStore[cat.id] = cat.manualContent;
                }
            }

            // Activar gemelo digital
            await userApi.updateUser(token, {
                digitalTwin: {
                    knowledge: {
                        links: linksToStore,
                        manualContent: manualContentToStore,
                        contextPrompt: contextPrompt,
                        trainingProgress: trainingProgress,
                        trainingStatus: 'ready'
                    },
                    liveAvatarContextId: contextId,
                    contextNeedsSync: false,  // Clear sync flag after regeneration
                    isActive: true,
                    activatedAt: new Date().toISOString()
                }
            });

            // Sincronizar conocimiento con la base de datos vectorial (RAG)
            console.log("Syncing knowledge vectors...");
            try {
                const syncResult = await customTwinApi.syncKnowledge((freshUser as any)?._id);
                console.log("RAG Sync result:", syncResult);
            } catch (syncError) {
                console.error("Error syncing knowledge vectors:", syncError);
                // No bloqueamos el flujo principal si el RAG falla, pero informamos
            }

            if (refreshUser) {
                await refreshUser();
            }

            router.push("/onboarding/pro-success");
        } catch (error: any) {
            console.error("Error activating twin:", error);
            showAlert({ type: 'error', title: 'Error', message: error.message || "Error al activar el gemelo" });
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
                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => router.push("/onboarding/help-twin-knowledge")}
                    >
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
                            {filledCount > 0 ? `${filledCount} Categorías completadas` : "0/5 Categorías completadas"}
                        </Text>
                        <Text style={styles.progressFooterHint}>
                            {filledCount > 0 ? "Información añadida" : "Falta información clave"}
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
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator size="small" color={COLORS.gray400} />
                                ) : (
                                    <MaterialIcons name="upload-file" size={20} color={COLORS.gray400} />
                                )}
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

                        {/* Uploaded Documents List */}
                        {uploadedDocuments.filter(d => d.category === category.id).length > 0 && (
                            <View style={styles.uploadedDocsContainer}>
                                {uploadedDocuments.filter(d => d.category === category.id).map((doc) => (
                                    <View key={doc.id} style={styles.uploadedDocItem}>
                                        <MaterialIcons
                                            name={doc.mimeType?.includes('pdf') ? 'picture-as-pdf' : 'description'}
                                            size={16}
                                            color={COLORS.gray500}
                                        />
                                        <Text style={styles.uploadedDocName} numberOfLines={1}>
                                            {doc.name}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteDocument(doc.id)}
                                            style={styles.deleteDocButton}
                                        >
                                            <MaterialIcons name="close" size={16} color={COLORS.accentRed} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

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

            {/* Manual Entry Modal */}
            <Modal
                visible={manualModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancelManualEdit}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIcon, { backgroundColor: editingCategory?.bgColor || COLORS.gray100 }]}>
                                <MaterialIcons
                                    name={(editingCategory?.icon || "edit") as any}
                                    size={20}
                                    color={editingCategory?.color || COLORS.gray500}
                                />
                            </View>
                            <Text style={styles.modalTitle}>{editingCategory?.title || "Añadir Contenido"}</Text>
                            <TouchableOpacity onPress={handleCancelManualEdit} style={styles.modalCloseButton}>
                                <MaterialIcons name="close" size={24} color={COLORS.gray400} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalHint}>
                            {editingCategory?.id === "faq" && "Escribe preguntas frecuentes y sus respuestas. Ej:\n\n¿Cuál es tu horario? De 9:00 a 18:00 de lunes a viernes."}
                            {editingCategory?.id === "services" && "Lista tus servicios o productos con descripciones. Ej:\n\n- Consulta inicial: Evaluación completa de 60 min.\n- Seguimiento: Sesión de 30 min."}
                            {editingCategory?.id === "pricing" && "Indica tus tarifas y precios. Ej:\n\n- Consulta: 50€\n- Sesión completa: 80€\n- Pack 5 sesiones: 350€"}
                            {editingCategory?.id === "policy" && "Describe las políticas de tu empresa. Ej:\n\nCancelaciones: Con 24h de antelación sin cargo.\nFormas de pago: Efectivo, tarjeta, transferencia."}
                            {editingCategory?.id === "troubleshooting" && "Añade soluciones a problemas comunes. Ej:\n\nSi tienes problemas para reservar, contacta por WhatsApp.\nSi no recibes confirmación, revisa tu carpeta de spam."}
                        </Text>

                        <TextInput
                            style={styles.modalTextInput}
                            multiline
                            numberOfLines={8}
                            placeholder="Escribe aquí el contenido..."
                            placeholderTextColor={COLORS.gray400}
                            value={editingContent}
                            onChangeText={setEditingContent}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={handleCancelManualEdit}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={handleSaveManualContent}
                            >
                                <MaterialIcons name="check" size={18} color="#000000" />
                                <Text style={styles.modalSaveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    modalIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalHint: {
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
        marginBottom: 16,
        backgroundColor: COLORS.gray50,
        padding: 12,
        borderRadius: 10,
    },
    modalTextInput: {
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: COLORS.textMain,
        minHeight: 150,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: 16,
    },
    modalFooter: {
        flexDirection: "row",
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray500,
    },
    modalSaveButton: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    modalSaveText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000000",
    },
    // Uploaded documents list styles
    uploadedDocsContainer: {
        marginTop: 8,
        marginBottom: 4,
        backgroundColor: COLORS.gray50,
        borderRadius: 8,
        padding: 8,
    },
    uploadedDocItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 6,
        marginBottom: 4,
        gap: 8,
    },
    uploadedDocName: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMain,
    },
    deleteDocButton: {
        padding: 4,
    },
});
