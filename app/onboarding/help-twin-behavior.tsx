import { router } from "expo-router";
import { useState } from "react";
import {
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
    primary: "#FFED00",
    primaryDark: "#E6D500",
    backgroundLight: "#F5F5F7",
    backgroundDark: "#000000",
    cardLight: "#FFFFFF",
    cardDark: "#1C1C1E",
    textLight: "#1C1C1E",
    textDark: "#FFFFFF",
    subtextLight: "#8E8E93",
    subtextDark: "#98989D",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    blue50: "#EFF6FF",
    blue400: "#60A5FA",
    blue600: "#2563EB",
    purple50: "#F5F3FF",
    purple600: "#7C3AED",
    green50: "#ECFDF5",
    green600: "#059669",
    red50: "#FEF2F2",
    red600: "#DC2626",
};

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "¿Qué es el objetivo del Gemelo?",
        answer: "Es el propósito principal que quieres que tu gemelo cumpla. Por ejemplo: 'Atender consultas, agendar citas y responder FAQs'. Cuanto más claro sea, mejor responderá a tus clientes.",
    },
    {
        question: "¿Qué significa el nivel de formalidad?",
        answer: "'Muy cercano' usa un tono amigable (tuteo), 'Profesional' mantiene un equilibrio, y 'Muy formal' usa usted y lenguaje más distante. Elige según tu marca personal.",
    },
    {
        question: "¿Qué es el nivel de profundidad?",
        answer: "'Cortas' da respuestas breves y directas. 'Equilibradas' añade contexto útil. 'Detalladas' ofrece explicaciones completas. Depende de la complejidad de tu servicio.",
    },
    {
        question: "¿Cómo funciona el tono emocional?",
        answer: "'Empático' muestra comprensión y calidez. 'Neutro' es objetivo y factual. 'Directo' va al grano sin rodeos. El empático funciona bien en salud y coaching, el directo en legal y consultoría.",
    },
    {
        question: "¿Qué son los guardarraíles?",
        answer: "Son reglas de seguridad que controlan lo que tu gemelo puede y no puede hacer. Por ejemplo, puede 'Dar precios' pero no 'Dar consejos médicos'. Esto protege a ti y a tus clientes.",
    },
    {
        question: "¿Puedo añadir mis propias reglas?",
        answer: "Sí, puedes añadir acciones permitidas y restricciones personalizadas. Simplemente escribe en el campo correspondiente y presiona Enter. Puedes eliminarlas tocando la X.",
    },
];

interface GuideItem {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    duration: string;
}

const GUIDE_ITEMS: GuideItem[] = [
    {
        icon: "psychology",
        title: "Personalidad ideal para tu profesión",
        duration: "2 min de lectura",
    },
    {
        icon: "security",
        title: "Configurar guardarraíles efectivos",
        duration: "1:30 min",
    },
    {
        icon: "lightbulb",
        title: "Ejemplos de objetivos bien definidos",
        duration: "2 min de lectura",
    },
];

export default function HelpTwinBehaviorScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    function handleClose() {
        router.back();
    }

    function handleSendEmail() {
        Linking.openURL("mailto:soporte@twinpro.app?subject=Ayuda%20con%20comportamiento%20del%20Gemelo");
    }

    function toggleFAQ(index: number) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    const filteredFAQs = FAQ_ITEMS.filter(
        (item) =>
            searchQuery === "" ||
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header Negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Ayuda Comportamiento</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <MaterialIcons name="close" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                    Configura cómo responde tu Gemelo Digital y establece límites seguros.
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Search */}
                <View style={styles.searchCard}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={COLORS.primaryDark} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar en la ayuda..."
                            placeholderTextColor={COLORS.gray400}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Tip Card */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="tips-and-updates" size={24} color={COLORS.primaryDark} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Consejo profesional</Text>
                        <Text style={styles.infoText}>
                            TwinPro aplica presets automáticos según tu profesión. Puedes personalizarlos o usarlos tal cual.
                        </Text>
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREGUNTAS FRECUENTES</Text>
                    <View style={styles.faqContainer}>
                        {filteredFAQs.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.faqItem}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    <MaterialIcons
                                        name={expandedFAQ === index ? "expand-less" : "expand-more"}
                                        size={22}
                                        color={COLORS.gray400}
                                    />
                                </View>
                                {expandedFAQ === index && (
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>¿NECESITAS MÁS AYUDA?</Text>
                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={handleSendEmail}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIcon, styles.contactIconBlue]}>
                            <MaterialIcons name="mail-outline" size={22} color={COLORS.blue600} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Contactar soporte</Text>
                            <Text style={styles.contactHint}>soporte@twinpro.app</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Guides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GUÍAS Y TUTORIALES</Text>
                    <View style={styles.guidesCard}>
                        {GUIDE_ITEMS.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.guideItem,
                                    index < GUIDE_ITEMS.length - 1 && styles.guideItemBorder,
                                ]}
                                activeOpacity={0.7}
                            >
                                <View style={styles.guideIconContainer}>
                                    <MaterialIcons name={item.icon} size={16} color={COLORS.gray400} />
                                </View>
                                <View style={styles.guideInfo}>
                                    <Text style={styles.guideTitle}>{item.title}</Text>
                                    <Text style={styles.guideDuration}>{item.duration}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray200} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Header
    header: {
        backgroundColor: COLORS.backgroundDark,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headerTitle: {
        color: COLORS.textDark,
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.gray800,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    headerSubtitle: {
        color: COLORS.gray400,
        fontSize: 12,
        lineHeight: 18,
        maxWidth: "85%",
    },
    // Content
    content: {
        flex: 1,
        marginTop: -24,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    // Search
    searchCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textLight,
        marginLeft: 8,
    },
    // Info Card
    infoCard: {
        flexDirection: "row",
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#FDE68A",
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.subtextLight,
        lineHeight: 18,
    },
    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.subtextLight,
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },
    // FAQs
    faqContainer: {
        gap: 8,
    },
    faqItem: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        overflow: "hidden",
    },
    faqHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        marginRight: 8,
    },
    faqAnswer: {
        fontSize: 12,
        color: COLORS.subtextLight,
        lineHeight: 18,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
    },
    // Contact
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    contactIconBlue: {
        backgroundColor: COLORS.blue50,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    contactHint: {
        fontSize: 12,
        color: COLORS.subtextLight,
        marginTop: 2,
    },
    // Guides
    guidesCard: {
        backgroundColor: COLORS.cardLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        overflow: "hidden",
    },
    guideItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    guideItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    guideIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.backgroundLight,
        justifyContent: "center",
        alignItems: "center",
    },
    guideInfo: {
        flex: 1,
    },
    guideTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    guideDuration: {
        fontSize: 10,
        color: COLORS.subtextLight,
        marginTop: 2,
    },
    bottomSpacer: {
        height: 24,
    },
});
