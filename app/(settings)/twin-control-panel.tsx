import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";

const COLORS = {
    primary: "#137fec",
    backgroundDark: "#111418",
    surfaceDark: "#1c2127",
    borderDark: "#3b4754",
    textSecondary: "#9dabb9",
    green500: "#22c55e",
    orange500: "#f97316",
    white: "#FFFFFF",
};

interface ModeOption {
    id: string;
    title: string;
    description: string;
}

const MODE_OPTIONS: ModeOption[] = [
    {
        id: "automatic",
        title: "Respuestas automáticas",
        description: "Solo contesta preguntas frecuentes de la base de datos.",
    },
    {
        id: "hybrid",
        title: "Soporte Híbrido",
        description: "Responde automáticamente solo cuando estás ausente.",
    },
    {
        id: "fulltime",
        title: "Atención 24/7",
        description: "Gestiona todas las conversaciones de forma autónoma.",
    },
];

export default function TwinControlPanelScreen() {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [selectedMode, setSelectedMode] = useState("automatic");

    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gemelo Digital</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="help-outline" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusContent}>
                        <View style={styles.statusInfo}>
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusLabel}>LISTO PARA ACTIVAR</Text>
                            </View>
                            <Text style={styles.statusTitle}>Tu gemelo está configurado</Text>
                            <Text style={styles.statusDescription}>Todos los sistemas sincronizados.</Text>
                        </View>
                        <View style={styles.statusImage}>
                            <MaterialIcons name="smart-toy" size={48} color={COLORS.primary} />
                        </View>
                    </View>
                </View>

                {/* Master Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleContent}>
                        <View>
                            <Text style={styles.toggleTitle}>Estado del Gemelo</Text>
                            <View style={styles.toggleStatus}>
                                <MaterialIcons
                                    name={isActive ? "wifi" : "wifi-off"}
                                    size={14}
                                    color={COLORS.textSecondary}
                                />
                                <Text style={styles.toggleStatusText}>
                                    {isActive ? "ONLINE" : "OFFLINE"}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: COLORS.borderDark, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                        />
                    </View>
                </View>

                {/* Operational Mode */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Modo de Funcionamiento</Text>
                    {MODE_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.modeOption,
                                selectedMode === option.id && styles.modeOptionSelected
                            ]}
                            onPress={() => setSelectedMode(option.id)}
                        >
                            <View style={[
                                styles.radioButton,
                                selectedMode === option.id && styles.radioButtonSelected
                            ]}>
                                {selectedMode === option.id && <View style={styles.radioButtonInner} />}
                            </View>
                            <View style={styles.modeContent}>
                                <Text style={styles.modeTitle}>{option.title}</Text>
                                <Text style={styles.modeDescription}>{option.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Configuration Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen de Configuración</Text>

                    <TouchableOpacity style={styles.configItem}>
                        <View style={styles.configItemLeft}>
                            <View style={styles.configIcon}>
                                <MaterialIcons name="shield" size={24} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.configTitle}>Guardarraíles</Text>
                                <Text style={styles.configValue}>Nivel Estricto Activo</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.configItem}>
                        <View style={styles.configItemLeft}>
                            <View style={styles.configIcon}>
                                <MaterialIcons name="menu-book" size={24} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.configTitle}>Base de Conocimiento</Text>
                                <Text style={styles.configSubtitle}>25 documentos cargados</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialIcons name="chat-bubble" size={20} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Probar Gemelo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialIcons name="share" size={20} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Copiar Enlace</Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: "rgba(17, 20, 24, 0.95)",
        borderBottomWidth: 1,
        borderBottomColor: "#283039",
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 20,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#283039",
        overflow: "hidden",
    },
    statusContent: {
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "space-between",
        padding: 16,
        gap: 16,
    },
    statusInfo: {
        flex: 1,
        gap: 8,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green500,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.green500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statusImage: {
        width: 96,
        height: 96,
        backgroundColor: "#283039",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        alignItems: "center",
        justifyContent: "center",
    },
    toggleCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 20,
    },
    toggleContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    toggleStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    toggleStatusText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSecondary,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
        paddingHorizontal: 4,
    },
    modeOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    modeOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(19, 127, 236, 0.1)",
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#546271",
        alignItems: "center",
        justifyContent: "center",
    },
    radioButtonSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.white,
    },
    modeContent: {
        flex: 1,
    },
    modeTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    modeDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    configItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        padding: 16,
    },
    configItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    configIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#283039",
        alignItems: "center",
        justifyContent: "center",
    },
    configTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    configValue: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.green500,
        marginTop: 2,
    },
    configSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#283039",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderDark,
        paddingVertical: 12,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.white,
    },
});
