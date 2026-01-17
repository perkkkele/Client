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
    primary: "#137fec",
    primaryLight: "#EFF6FF",
    backgroundLight: "#F5F5F7",
    backgroundDark: "#000000",
    cardLight: "#FFFFFF",
    textLight: "#1C1C1E",
    textDark: "#FFFFFF",
    subtextLight: "#8E8E93",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    blue50: "#EFF6FF",
    blue600: "#2563EB",
    green50: "#ECFDF5",
    green600: "#059669",
    purple50: "#F5F3FF",
    purple600: "#7C3AED",
    orange50: "#FFF7ED",
    orange600: "#EA580C",
    yellow50: "#FEFCE8",
    yellow600: "#CA8A04",
};

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQ_ITEMS: FAQItem[] = [
    // Gemelo Digital
    {
        category: "Gemelo Digital",
        question: "¿Cómo activo o desactivo mi Gemelo Digital?",
        answer: "Usa el interruptor en la tarjeta 'Tu Gemelo Digital'. Cuando está activo (verde), atenderá consultas automáticamente. Puedes desactivarlo en cualquier momento.",
    },
    {
        category: "Gemelo Digital",
        question: "¿Qué significa 'Estado: Listo'?",
        answer: "Significa que tu gemelo está configurado y listo para atender clientes. Si muestra otro estado, puede que necesites completar la configuración en 'Configurar'.",
    },
    {
        category: "Gemelo Digital",
        question: "¿Cómo edito la personalidad de mi gemelo?",
        answer: "Toca 'Configurar' en la tarjeta del gemelo para acceder a la configuración de apariencia, comportamiento y base de conocimientos.",
    },
    {
        category: "Gemelo Digital",
        question: "¿Qué es la escalación?",
        answer: "Es cuando el gemelo transfiere la conversación a ti (el profesional real). Puede ocurrir si el cliente lo solicita, si el gemelo no puede responder, o por palabras clave específicas.",
    },
    // Perfil y Estadísticas
    {
        category: "Perfil",
        question: "¿Cómo edito mi perfil público?",
        answer: "Toca tu foto de perfil o ve al menú y selecciona 'Mi perfil público'. Desde ahí puedes editar nombre, bio, foto, servicios y más.",
    },
    {
        category: "Perfil",
        question: "¿Qué significan las estadísticas de visitas?",
        answer: "Las visitas muestran cuántas personas han visto tu perfil. Las conversiones indican cuántas iniciaron una conversación. Un alto ratio de conversión indica un buen perfil.",
    },
    {
        category: "Perfil",
        question: "¿De dónde vienen los datos de 'Esta semana'?",
        answer: "Son estadísticas de los últimos 7 días. Incluyen visitas al perfil, conversaciones iniciadas, citas agendadas y ganancias si tienes plan Professional o superior.",
    },
    // Citas
    {
        category: "Citas",
        question: "¿Por qué no veo el bloque de Citas?",
        answer: "La gestión de citas está disponible en plan Professional o superior. Mejora tu plan para desbloquear esta función.",
    },
    {
        category: "Citas",
        question: "¿Cómo configuro mis horarios de disponibilidad?",
        answer: "Ve al menú > 'Mi horario laboral'. Ahí puedes definir días y horas en que aceptas citas, pausas, y días festivos.",
    },
    {
        category: "Citas",
        question: "¿Qué es la confirmación automática?",
        answer: "Si está activada, las citas se confirman automáticamente sin que tengas que aprobarlas manualmente. Útil si tienes disponibilidad clara.",
    },
    {
        category: "Citas",
        question: "¿Puedo cobrar por las citas?",
        answer: "Sí, activa 'Requerir pago' en la configuración de citas. Los clientes pagarán al reservar. Necesitas tener Stripe configurado.",
    },
    // Ganancias
    {
        category: "Ganancias",
        question: "¿Dónde veo mis ganancias?",
        answer: "El bloque 'Ingresos' muestra tus ganancias. Para ver detalles completos, ve al menú > 'Planes y créditos' > 'Historial de pagos'.",
    },
    {
        category: "Ganancias",
        question: "¿Cómo recibo mis pagos?",
        answer: "Los pagos se procesan a través de Stripe. Configura tu cuenta bancaria en 'Planes y créditos' para recibir transferencias automáticas.",
    },
    // Personalización del Dashboard
    {
        category: "Dashboard",
        question: "¿Puedo reorganizar los bloques del dashboard?",
        answer: "Sí, toca el botón flotante con el icono de cuadrícula para entrar en modo edición. Usa las flechas para reordenar los bloques según tu preferencia.",
    },
    {
        category: "Dashboard",
        question: "¿Qué es el modo edición?",
        answer: "Permite personalizar la disposición de los bloques en tu dashboard. Cuando está activo, verás flechas arriba/abajo en cada bloque para moverlos.",
    },
    // Atención Directa
    {
        category: "Atención Directa",
        question: "¿Qué es 'Atención directa'?",
        answer: "Es donde ves las conversaciones que requieren tu intervención personal. Incluye escalaciones del gemelo y mensajes directos de clientes.",
    },
    {
        category: "Atención Directa",
        question: "¿Cómo sé si tengo mensajes pendientes?",
        answer: "El icono de campana en la cabecera muestra un número rojo si tienes notificaciones sin leer. También recibirás notificaciones push si están activadas.",
    },
    // Planes y Suscripción
    {
        category: "Planes",
        question: "¿Cuáles son los planes disponibles?",
        answer: "Starter (gratis): funciones básicas. Professional: citas, estadísticas avanzadas. Premium: voz clonada, avatar personalizado, todas las funciones.",
    },
    {
        category: "Planes",
        question: "¿Cómo mejoro mi plan?",
        answer: "Ve al menú > 'Planes y créditos'. Ahí puedes ver tu plan actual y las opciones de mejora con sus beneficios.",
    },
    {
        category: "Planes",
        question: "¿Puedo cancelar mi suscripción?",
        answer: "Sí, puedes cancelar en cualquier momento desde 'Planes y créditos'. Mantendrás acceso hasta el final del período de facturación.",
    },
    // Menú y Navegación
    {
        category: "Navegación",
        question: "¿Cómo accedo al menú completo?",
        answer: "Toca el icono de menú (tres líneas) en la esquina superior derecha. Ahí encontrarás todas las opciones organizadas por categorías.",
    },
    {
        category: "Navegación",
        question: "¿Qué opciones tiene el menú?",
        answer: "Mi Negocio (perfil, reseñas, horario), Agenda (citas), Gemelo Digital (historial, rendimiento), Cuenta (planes, notificaciones) y Ayuda.",
    },
];

// Group FAQs by category
const FAQ_CATEGORIES = [
    "Gemelo Digital",
    "Perfil",
    "Citas",
    "Ganancias",
    "Dashboard",
    "Atención Directa",
    "Planes",
    "Navegación",
];

interface GuideItem {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    duration: string;
}

const GUIDE_ITEMS: GuideItem[] = [
    {
        icon: "smart-toy",
        title: "Guía completa del Gemelo Digital",
        duration: "5 min de lectura",
    },
    {
        icon: "calendar-month",
        title: "Configurar tu agenda de citas",
        duration: "3 min de lectura",
    },
    {
        icon: "payments",
        title: "Configurar pagos y cobros",
        duration: "4 min de lectura",
    },
    {
        icon: "trending-up",
        title: "Entender tus estadísticas",
        duration: "2 min de lectura",
    },
    {
        icon: "verified",
        title: "Optimizar tu perfil profesional",
        duration: "3 min de lectura",
    },
];

export default function HelpProDashboardScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    function handleClose() {
        router.back();
    }

    function handleSendEmail() {
        Linking.openURL("mailto:soporte@twinpro.app?subject=Ayuda%20con%20Panel%20Profesional");
    }

    function toggleFAQ(index: number) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    // Filter FAQs by search and category
    const filteredFAQs = FAQ_ITEMS.filter(
        (item) => {
            const matchesSearch = searchQuery === "" ||
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === null || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header Negro */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Centro de Ayuda</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <MaterialIcons name="close" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>
                    Todo lo que necesitas saber sobre tu panel profesional y cómo sacarle el máximo partido.
                </Text>
            </View>

            {/* Fixed Search Bar */}
            <View style={styles.searchCardFixed}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.primary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en la ayuda..."
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== "" && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                >
                    <TouchableOpacity
                        style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text style={[styles.categoryChipText, selectedCategory === null && styles.categoryChipTextActive]}>
                            Todas
                        </Text>
                    </TouchableOpacity>
                    {FAQ_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Quick Actions */}
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.green50 }, selectedCategory === "Gemelo Digital" && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === "Gemelo Digital" ? null : "Gemelo Digital")}
                    >
                        <MaterialIcons name="smart-toy" size={24} color={COLORS.green600} />
                        <Text style={styles.quickActionText}>Gemelo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.purple50 }, selectedCategory === "Citas" && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === "Citas" ? null : "Citas")}
                    >
                        <MaterialIcons name="calendar-month" size={24} color={COLORS.purple600} />
                        <Text style={styles.quickActionText}>Citas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.orange50 }, selectedCategory === "Ganancias" && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === "Ganancias" ? null : "Ganancias")}
                    >
                        <MaterialIcons name="payments" size={24} color={COLORS.orange600} />
                        <Text style={styles.quickActionText}>Pagos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: COLORS.blue50 }, selectedCategory === "Perfil" && styles.quickActionActive]}
                        onPress={() => setSelectedCategory(selectedCategory === "Perfil" ? null : "Perfil")}
                    >
                        <MaterialIcons name="analytics" size={24} color={COLORS.blue600} />
                        <Text style={styles.quickActionText}>Stats</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        PREGUNTAS FRECUENTES {selectedCategory && `• ${selectedCategory.toUpperCase()}`}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {filteredFAQs.length} {filteredFAQs.length === 1 ? 'resultado' : 'resultados'}
                    </Text>
                    <View style={styles.faqContainer}>
                        {filteredFAQs.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.faqItem}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <View style={styles.faqTitleRow}>
                                        <View style={[styles.faqCategoryBadge, getCategoryColor(item.category)]}>
                                            <Text style={styles.faqCategoryText}>{item.category}</Text>
                                        </View>
                                        <MaterialIcons
                                            name={expandedFAQ === index ? "expand-less" : "expand-more"}
                                            size={22}
                                            color={COLORS.gray400}
                                        />
                                    </View>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                </View>
                                {expandedFAQ === index && (
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
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
                                    <MaterialIcons name={item.icon} size={18} color={COLORS.primary} />
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

                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL("https://wa.me/34660938312")}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIcon, { backgroundColor: COLORS.green50 }]}>
                            <MaterialIcons name="chat" size={22} color={COLORS.green600} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                            <Text style={styles.contactHint}>+34 660 93 83 12</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Helper to get category color
function getCategoryColor(category: string): { backgroundColor: string } {
    const colors: Record<string, string> = {
        "Gemelo Digital": COLORS.green50,
        "Perfil": COLORS.blue50,
        "Citas": COLORS.purple50,
        "Ganancias": COLORS.yellow50,
        "Dashboard": COLORS.orange50,
        "Atención Directa": "#FEF2F2",
        "Planes": "#F5F3FF",
        "Navegación": COLORS.gray200,
    };
    return { backgroundColor: colors[category] || COLORS.gray200 };
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
        fontSize: 22,
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
        fontSize: 13,
        lineHeight: 20,
    },
    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
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
    searchCardFixed: {
        backgroundColor: COLORS.cardLight,
        marginHorizontal: 16,
        marginTop: -20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
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
    // Categories
    categoriesScroll: {
        marginBottom: 16,
        marginHorizontal: -16,
    },
    categoriesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.cardLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray700,
    },
    categoryChipTextActive: {
        color: "#FFFFFF",
    },
    // Quick Actions
    quickActionsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    quickAction: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textLight,
        marginTop: 6,
    },
    quickActionActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
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
        marginBottom: 4,
        marginLeft: 4,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: COLORS.gray400,
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
        padding: 16,
    },
    faqTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    faqCategoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    faqCategoryText: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textLight,
        lineHeight: 20,
    },
    faqAnswer: {
        fontSize: 13,
        color: COLORS.subtextLight,
        lineHeight: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    guideInfo: {
        flex: 1,
    },
    guideTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textLight,
    },
    guideDuration: {
        fontSize: 11,
        color: COLORS.subtextLight,
        marginTop: 2,
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
        marginBottom: 8,
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
    bottomSpacer: {
        height: 40,
    },
});
