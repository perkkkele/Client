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
    legal: `AVISO LEGAL: Las respuestas proporcionadas por este asistente virtual tienen carácter meramente informativo y orientativo. No constituyen asesoramiento legal profesional, ni crean relación abogado-cliente. Para asuntos legales específicos, consulte directamente con un profesional colegiado. El uso de este servicio no sustituye la consulta presencial requerida en procedimientos judiciales o administrativos.`,

    salud: `AVISO SANITARIO: La información proporcionada por este asistente tiene carácter exclusivamente informativo y educativo. No sustituye el diagnóstico, tratamiento o consejo de un profesional sanitario cualificado. Ante cualquier síntoma o duda médica, consulte siempre con su médico. En caso de emergencia, llame inmediatamente al 112 o acuda a urgencias.`,

    fitness: `AVISO SOBRE EJERCICIO FÍSICO: Las recomendaciones de este asistente son orientativas y generales. Antes de iniciar cualquier programa de ejercicios, consulte con un profesional de la salud, especialmente si tiene condiciones médicas preexistentes. Cada persona tiene necesidades diferentes; adapte cualquier consejo a su situación particular.`,

    educacion: `AVISO EDUCATIVO: Los contenidos proporcionados son recursos educativos de apoyo y no sustituyen la formación reglada ni certificaciones oficiales. La información puede requerir actualización. Consulte fuentes oficiales para validar cualquier contenido antes de tomar decisiones académicas o profesionales.`,

    tecnologia: `AVISO TÉCNICO: La orientación técnica proporcionada es informativa y basada en estándares generales. Las soluciones pueden variar según su configuración específica. No nos hacemos responsables de pérdidas de datos o daños derivados de la aplicación de estas sugerencias. Realice siempre copias de seguridad antes de cualquier intervención.`,

    diseno: `AVISO CREATIVO: Las sugerencias de diseño proporcionadas son orientativas y buscan inspirar. Los resultados finales dependen de múltiples factores y la implementación específica. Las preferencias estéticas son subjetivas; estas recomendaciones no garantizan resultados específicos.`,

    bienestar: `AVISO SOBRE BIENESTAR: Este servicio ofrece información de bienestar general y no constituye terapia psicológica, coaching certificado ni tratamiento de salud mental. Si experimenta dificultades emocionales significativas, busque ayuda profesional. En crisis, contacte con servicios de emergencia.`,

    inmobiliario: `AVISO INMOBILIARIO: La información sobre propiedades y mercado inmobiliario es orientativa y puede no estar actualizada. Los precios, disponibilidad y condiciones pueden variar. Este servicio no sustituye la tasación profesional ni el asesoramiento legal. Verifique toda información antes de tomar decisiones de compra o inversión.`,

    estetica: `AVISO DE ESTÉTICA: Las recomendaciones proporcionadas son generales y orientativas. Los resultados de cualquier tratamiento varían según el individuo. Consulte siempre con un profesional antes de aplicar cualquier procedimiento. Este servicio no sustituye la valoración presencial obligatoria para tratamientos.`,

    hogar: `AVISO PARA SERVICIOS DEL HOGAR: Las orientaciones proporcionadas son informativas. Para trabajos que requieran instalaciones, manipulación eléctrica, gas u obras, contrate siempre profesionales certificados. No nos responsabilizamos de daños derivados de trabajos realizados sin supervisión profesional adecuada.`,

    finanzas: `AVISO FINANCIERO: La información proporcionada es de carácter general y educativo. No constituye asesoramiento financiero, fiscal ni de inversiones personalizado. Las decisiones financieras deben tomarse tras consultar con asesores cualificados. Los mercados conllevan riesgos; el rendimiento pasado no garantiza resultados futuros.`,

    energia: `AVISO ENERGÉTICO: Las recomendaciones sobre instalaciones energéticas son orientativas. Para instalaciones eléctricas, gas, solar u otras, contrate siempre instaladores autorizados. Verifique cumplimiento normativo antes de cualquier instalación. No nos responsabilizamos de instalaciones realizadas sin supervisión profesional.`,

    empleo: `AVISO SOBRE EMPLEO: La información sobre ofertas laborales y orientación profesional es informativa. Verifique siempre las ofertas directamente con las empresas. No garantizamos colocación laboral. Los procesos de selección dependen de múltiples factores externos a este servicio.`,

    otros: `AVISO GENERAL: Las respuestas proporcionadas por este asistente virtual tienen carácter informativo y orientativo. No sustituyen el consejo profesional especializado. La información puede requerir actualización o adaptación a su situación específica. Consulte siempre con profesionales cualificados para tomar decisiones importantes.`,
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
