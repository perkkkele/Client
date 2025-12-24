import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";

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
}

const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
    { id: "faq", title: "Preguntas Frecuentes", icon: "quiz", color: COLORS.accentBlue, bgColor: "rgba(59, 130, 246, 0.1)", count: 0 },
    { id: "services", title: "Servicios y Productos", icon: "inventory-2", color: COLORS.accentGreen, bgColor: "rgba(16, 185, 129, 0.1)", count: 0 },
    { id: "pricing", title: "Tarifa de Precios", icon: "attach-money", color: COLORS.accentYellow, bgColor: "rgba(245, 158, 11, 0.1)", count: 0 },
    { id: "policy", title: "Política de Empresa", icon: "policy", color: COLORS.accentPurple, bgColor: "rgba(99, 102, 241, 0.1)", count: 0 },
    { id: "troubleshooting", title: "Resolución de Problemas", icon: "build", color: COLORS.accentRed, bgColor: "rgba(239, 68, 68, 0.1)", count: 0 },
];

export default function TwinKnowledgeScreen() {
    const { token, refreshUser } = useAuth();
    const [categories, setCategories] = useState(KNOWLEDGE_CATEGORIES);
    const [trainingProgress] = useState(5); // 5% por defecto
    const [isLoading, setIsLoading] = useState(false);

    function handleBack() {
        router.back();
    }

    function handleUpload(categoryId: string) {
        // TODO: Implementar subida de documentos
        console.log("Upload for category:", categoryId);
    }

    function handleManualAdd(categoryId: string) {
        // TODO: Implementar añadir manual
        console.log("Manual add for category:", categoryId);
    }

    async function handleActivate() {
        setIsLoading(true);
        try {
            if (token) {
                // Activar gemelo digital (userType ya es 'userpro' desde el registro)
                await userApi.updateUser(token, {
                    digitalTwin: {
                        knowledge: {
                            trainingProgress: trainingProgress,
                            trainingStatus: 'pending'
                        },
                        isActive: true
                    }
                });

                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/pro-success");
        } catch (error: any) {
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
                        <Text style={styles.progressFooterText}>0/5 Categorías completadas</Text>
                        <Text style={styles.progressFooterHint}>Falta información clave</Text>
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
                                <Text style={styles.categoryBadgeText}>{category.count} Cargados</Text>
                            </View>
                        </View>
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
                    <TouchableOpacity style={styles.uploadZone}>
                        <View style={styles.uploadIconContainer}>
                            <MaterialIcons name="cloud-upload" size={24} color={COLORS.gray400} />
                        </View>
                        <Text style={styles.uploadTitle}>Subir Documento Libre</Text>
                        <Text style={styles.uploadSubtitle}>Soporta PDF, DOCX, TXT</Text>
                    </TouchableOpacity>
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
