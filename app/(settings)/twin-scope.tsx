import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    white: "#FFFFFF",
    blue50: "#eff6ff",
    green500: "#22c55e",
    green50: "#f0fdf4",
    orange500: "#f97316",
    orange50: "#fff7ed",
};

// 12 Plantillas de descargo por categoría profesional
const DISCLAIMER_TEMPLATES: Record<string, string> = {
    legal: `AVISO LEGAL
La información proporcionada a través de este servicio es automatizada y de carácter informativo. No constituye asesoramiento legal profesional ni crea relación abogado-cliente. TwinPro no presta servicios legales. Para casos concretos, consulte siempre con un profesional colegiado.`,

    salud: `AVISO SANITARIO
La información ofrecida es automatizada y de carácter general. No sustituye el diagnóstico, tratamiento ni la atención de un profesional sanitario. TwinPro no presta servicios médicos ni de salud mental. Ante síntomas o emergencias, consulte con un profesional o llame al 112.`,

    fitness: `AVISO SOBRE EJERCICIO FÍSICO
Las recomendaciones son orientativas y automatizadas. No sustituyen la valoración de un profesional de la salud o del deporte. Adapte cualquier ejercicio a su condición física y consulte con un especialista si tiene dudas o patologías.`,

    educacion: `AVISO EDUCATIVO
El contenido proporcionado es informativo y de apoyo educativo. No sustituye formación reglada, certificaciones oficiales ni garantiza resultados académicos. La información puede requerir verificación o actualización.`,

    tecnologia: `AVISO TÉCNICO
La información técnica es automatizada y general. Las soluciones pueden variar según el contexto y la configuración específica. TwinPro no se responsabiliza de daños derivados de la aplicación directa de estas sugerencias. Realice siempre copias de seguridad.`,

    diseno: `AVISO CREATIVO
Las sugerencias proporcionadas son orientativas y automatizadas. Los resultados finales dependen de múltiples factores y decisiones humanas. No se garantizan resultados concretos.`,

    bienestar: `AVISO DE BIENESTAR
Este servicio ofrece información general de bienestar. No constituye terapia psicológica, tratamiento clínico ni intervención sanitaria. Si experimenta malestar emocional significativo, busque ayuda profesional especializada.`,

    inmobiliario: `AVISO INMOBILIARIO
La información sobre propiedades y mercado es orientativa y puede no estar actualizada. No sustituye la tasación profesional ni el asesoramiento legal o financiero. Verifique siempre la información antes de tomar decisiones.`,

    estetica: `AVISO DE ESTÉTICA
Las recomendaciones proporcionadas son generales y orientativas. Los resultados de cualquier tratamiento varían según el individuo. Consulte siempre con un profesional antes de aplicar cualquier procedimiento.`,

    hogar: `AVISO SERVICIOS DEL HOGAR
La información proporcionada es orientativa. Para trabajos técnicos, eléctricos, de gas u obras, contrate siempre profesionales certificados. TwinPro no se responsabiliza de intervenciones realizadas sin supervisión profesional.`,

    finanzas: `AVISO FINANCIERO
La información proporcionada es general y educativa. No constituye asesoramiento financiero, fiscal ni de inversión personalizado. Las decisiones financieras conllevan riesgos y deben tomarse con asesores cualificados.`,

    energia: `AVISO ENERGÉTICO
Las recomendaciones sobre instalaciones energéticas son orientativas. Para cualquier instalación eléctrica, solar o de gas, contrate profesionales autorizados y verifique el cumplimiento normativo.`,

    empleo: `AVISO SOBRE EMPLEO
La información laboral es orientativa y no garantiza procesos de selección ni contratación. Verifique siempre las condiciones directamente con las empresas o entidades correspondientes.`,

    otros: `AVISO GENERAL
Las respuestas proporcionadas por este asistente virtual son automatizadas y de carácter informativo. No sustituyen el consejo profesional especializado. La información puede requerir adaptación a su situación específica. Consulte siempre con profesionales cualificados.`,
};

const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
        legal: "Servicios Legales",
        salud: "Salud",
        fitness: "Fitness y Deporte",
        educacion: "Educación",
        tecnologia: "Tecnología",
        diseno: "Diseño",
        bienestar: "Bienestar",
        inmobiliario: "Inmobiliario",
        estetica: "Estética y Belleza",
        hogar: "Servicios del Hogar",
        finanzas: "Finanzas",
        energia: "Energía",
        empleo: "Empleo",
        otros: "General",
    };
    return labels[category] || labels.otros;
};

export default function TwinScopeScreen() {
    const { user, token, refreshUser } = useAuth();
    const [disclaimer, setDisclaimer] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (user?.digitalTwin?.disclaimer) {
            setDisclaimer(user.digitalTwin.disclaimer);
        }
    }, [user?.digitalTwin?.disclaimer]);

    const handleBack = () => {
        if (hasChanges) {
            Alert.alert(
                "Cambios sin guardar",
                "¿Quieres descartar los cambios?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Descartar", style: "destructive", onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    };

    const handleUseTemplate = () => {
        const category = user?.category || "otros";
        const template = DISCLAIMER_TEMPLATES[category] || DISCLAIMER_TEMPLATES.otros;

        if (disclaimer.trim() && disclaimer !== template) {
            Alert.alert(
                "Usar plantilla",
                `¿Quieres reemplazar el texto actual con la plantilla para "${getCategoryLabel(category)}"?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Reemplazar",
                        onPress: () => {
                            setDisclaimer(template);
                            setHasChanges(true);
                        }
                    },
                ]
            );
        } else {
            setDisclaimer(template);
            setHasChanges(true);
        }
    };

    const handleSave = async () => {
        if (!token) return;

        setSaving(true);
        try {
            await userApi.updateMe(token, {
                digitalTwin: {
                    ...user?.digitalTwin,
                    disclaimer: disclaimer.trim() || null,
                },
            });
            await refreshUser();
            setHasChanges(false);
            Alert.alert("Guardado", "El descargo de responsabilidad se ha actualizado correctamente");
        } catch (error) {
            console.error("Error saving disclaimer:", error);
            Alert.alert("Error", "No se pudo guardar. Inténtalo de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    const handleTextChange = (text: string) => {
        setDisclaimer(text);
        setHasChanges(true);
    };

    const category = user?.category || "otros";

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alcance y Límites</Text>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <MaterialIcons
                                name="check"
                                size={24}
                                color={hasChanges ? COLORS.primary : COLORS.gray300}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <MaterialIcons name="info-outline" size={24} color={COLORS.primary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>¿Para qué sirve este texto?</Text>
                            <Text style={styles.infoText}>
                                Este descargo de responsabilidad se mostrará a tus clientes al iniciar
                                una conversación con tu gemelo digital. Es importante para establecer
                                las expectativas y los límites del servicio automatizado.
                            </Text>
                        </View>
                    </View>

                    {/* Template Button */}
                    <TouchableOpacity style={styles.templateButton} onPress={handleUseTemplate}>
                        <View style={styles.templateLeft}>
                            <MaterialIcons name="auto-fix-high" size={20} color={COLORS.primary} />
                            <Text style={styles.templateText}>
                                Usar plantilla para {getCategoryLabel(category)}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>

                    {/* Editor Section */}
                    <View style={styles.editorSection}>
                        <Text style={styles.editorLabel}>Tu descargo de responsabilidad</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={10}
                            placeholder="Escribe aquí el texto que verán tus clientes antes de interactuar con tu gemelo digital..."
                            placeholderTextColor={COLORS.gray400}
                            value={disclaimer}
                            onChangeText={handleTextChange}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>
                            {disclaimer.length} caracteres
                        </Text>
                    </View>

                    {/* Preview Section */}
                    {disclaimer.trim() && (
                        <View style={styles.previewSection}>
                            <Text style={styles.previewLabel}>Vista previa</Text>
                            <View style={styles.previewCard}>
                                <Text style={styles.previewText}>{disclaimer}</Text>
                            </View>
                        </View>
                    )}

                    {/* Tips */}
                    <View style={styles.tipsSection}>
                        <Text style={styles.tipsTitle}>💡 Consejos</Text>
                        <Text style={styles.tipItem}>• Sé claro sobre lo que tu gemelo puede y no puede hacer</Text>
                        <Text style={styles.tipItem}>• Incluye cuándo deben contactarte directamente</Text>
                        <Text style={styles.tipItem}>• Menciona si las respuestas son orientativas o definitivas</Text>
                        <Text style={styles.tipItem}>• Añade referencias a regulaciones de tu sector si aplica</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.textMain,
        flex: 1,
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: COLORS.blue50,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    templateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    templateLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    templateText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.primary,
    },
    editorSection: {
        marginBottom: 20,
    },
    editorLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    textArea: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        padding: 16,
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 20,
        minHeight: 200,
    },
    charCount: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "right",
        marginTop: 8,
    },
    previewSection: {
        marginBottom: 20,
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    previewCard: {
        backgroundColor: COLORS.orange50,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.orange500,
    },
    previewText: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    tipsSection: {
        backgroundColor: COLORS.green50,
        borderRadius: 12,
        padding: 16,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    tipItem: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 20,
        marginBottom: 4,
    },
});
