import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
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
    backgroundDark: "#101922",
    surfaceDark: "#182430",
    borderDark: "#2a3642",
    textMain: "#FFFFFF",
    textSecondary: "#9CA3AF",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    green400: "#4ade80",
    green500: "#22c55e",
    orange400: "#fb923c",
    orange500: "#f97316",
    purple400: "#c084fc",
    indigo400: "#818cf8",
    pink400: "#f472b6",
    rose400: "#fb7185",
    blue400: "#60a5fa",
    teal400: "#2dd4bf",
};

interface Conversation {
    id: string;
    initials: string;
    name: string;
    time: string;
    preview: string;
    status: "resolved" | "escalated";
    bgGradient: string[];
    textColor: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        initials: "MP",
        name: "María Pérez",
        time: "10:42 AM",
        preview: "Cliente reporta problemas con el acceso a su cuenta premium. La IA intentó restablecer la contraseña pero el usuario indica error de servidor persistente.",
        status: "escalated",
        bgGradient: [COLORS.purple400, COLORS.indigo400],
        textColor: COLORS.indigo400,
    },
    {
        id: "2",
        initials: "JR",
        name: "Juan Rodríguez",
        time: "09:15 AM",
        preview: "Consulta sobre precios del plan anual y métodos de pago aceptados. Se envió la tabla comparativa y enlace de suscripción.",
        status: "resolved",
        bgGradient: [COLORS.blue400, COLORS.teal400],
        textColor: COLORS.blue400,
    },
    {
        id: "3",
        initials: "AL",
        name: "Ana López",
        time: "Ayer",
        preview: "Solicitud de reembolso fuera del período establecido. Usuario muestra insatisfacción con el producto recibido.",
        status: "escalated",
        bgGradient: [COLORS.pink400, COLORS.rose400],
        textColor: COLORS.rose400,
    },
    {
        id: "4",
        initials: "CM",
        name: "Carlos Mendez",
        time: "Ayer",
        preview: "Confirmación de cita para la próxima semana. Agendado correctamente en calendario.",
        status: "resolved",
        bgGradient: [COLORS.gray400, COLORS.gray500],
        textColor: COLORS.gray400,
    },
    {
        id: "5",
        initials: "LS",
        name: "Laura Sanchez",
        time: "Lun",
        preview: "Pregunta sobre compatibilidad con iOS 15.",
        status: "resolved",
        bgGradient: [COLORS.teal400, COLORS.green400],
        textColor: COLORS.teal400,
    },
];

const FILTERS = ["Hoy", "Últimos 7 días", "Último mes"];

export default function TwinHistoryScreen() {
    const [activeFilter, setActiveFilter] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Conversaciones</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Search and Filters */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por usuario o palabra clave..."
                        placeholderTextColor={COLORS.gray500}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.filterButton,
                                activeFilter === index && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveFilter(index)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === index && styles.filterTextActive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Conversations List */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {MOCK_CONVERSATIONS.map((conversation) => (
                    <TouchableOpacity key={conversation.id} style={styles.conversationCard}>
                        <View style={[styles.avatar, { backgroundColor: conversation.bgGradient[0] }]}>
                            <Text style={styles.avatarText}>{conversation.initials}</Text>
                        </View>
                        <View style={styles.conversationContent}>
                            <View style={styles.conversationHeader}>
                                <Text style={styles.conversationName}>{conversation.name}</Text>
                                <Text style={styles.conversationTime}>{conversation.time}</Text>
                            </View>
                            <Text style={styles.conversationPreview} numberOfLines={2}>
                                {conversation.preview}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                conversation.status === "resolved" ? styles.statusResolved : styles.statusEscalated
                            ]}>
                                <MaterialIcons
                                    name={conversation.status === "resolved" ? "smart-toy" : "warning"}
                                    size={12}
                                    color={conversation.status === "resolved" ? COLORS.green400 : COLORS.orange400}
                                />
                                <Text style={[
                                    styles.statusText,
                                    { color: conversation.status === "resolved" ? COLORS.green400 : COLORS.orange400 }
                                ]}>
                                    {conversation.status === "resolved" ? "Resuelto por IA" : "Escalado a humano"}
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        flex: 1,
        textAlign: "center",
    },
    searchSection: {
        backgroundColor: COLORS.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
        paddingBottom: 12,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: COLORS.textMain,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.surfaceDark,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    conversationCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDark,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    conversationTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    conversationPreview: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    statusResolved: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgba(34, 197, 94, 0.2)",
    },
    statusEscalated: {
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderColor: "rgba(249, 115, 22, 0.2)",
    },
    statusText: {
        fontSize: 10,
        fontWeight: "500",
    },
});
