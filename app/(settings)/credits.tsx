import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray800: "#1F2937",
};

interface TeamMember {
    name: string;
    role: string;
}

interface TeamSection {
    title: string;
    members: TeamMember[];
}

const TEAM_SECTIONS: TeamSection[] = [
    {
        title: "Liderazgo",
        members: [
            { name: "Javier Úbeda", role: "CEO" },
        ],
    },
    {
        title: "Desarrollo & Ingeniería",
        members: [
            { name: "Alejandro Ruiz", role: "Lead Developer" },
            { name: "Beatriz Méndez", role: "Backend Architecture" },
            { name: "Carlos D. Silva", role: "iOS Engineer" },
            { name: "Diana Torres", role: "Frontend UI" },
        ],
    },
    {
        title: "Diseño de Producto",
        members: [
            { name: "Elena Vargas", role: "Head of Design" },
            { name: "Fernando Quispe", role: "UX Researcher" },
            { name: "Gabriela Montes", role: "Visual Designer" },
        ],
    },
    {
        title: "Arte Gráfico e Ilustración",
        members: [
            { name: "Hugo Chávez", role: "Avatar Artist" },
            { name: "Inés L. Pardo", role: "Motion Graphics" },
        ],
    },
    {
        title: "QA & Testing",
        members: [
            { name: "Javier Solís", role: "QA Lead" },
            { name: "Karina O. Diaz", role: "Automation" },
        ],
    },
];

export default function CreditsScreen() {
    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Créditos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIcon}>
                        <MaterialIcons name="groups" size={32} color={COLORS.textMain} />
                    </View>
                    <Text style={styles.heroTitle}>El equipo TwinPro</Text>
                    <Text style={styles.heroSubtitle}>
                        Esta aplicación es el resultado de la pasión, el esfuerzo y la creatividad de muchas personas talentosas.
                    </Text>
                </View>

                {/* Team Sections */}
                <View style={styles.sectionsContainer}>
                    {TEAM_SECTIONS.map((section, sectionIndex) => (
                        <View key={sectionIndex} style={styles.teamSection}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <View style={styles.membersCard}>
                                {section.members.map((member, memberIndex) => (
                                    <View key={memberIndex}>
                                        <View style={styles.memberRow}>
                                            <Text style={styles.memberName}>{member.name}</Text>
                                            <Text style={styles.memberRole}>{member.role}</Text>
                                        </View>
                                        {memberIndex < section.members.length - 1 && (
                                            <View style={styles.divider} />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Special Thanks */}
                    <View style={styles.teamSection}>
                        <Text style={styles.sectionTitle}>Agradecimientos Especiales</Text>
                        <View style={styles.thanksCard}>
                            <Text style={styles.thanksText}>
                                Gracias a nuestras familias y amigos por su apoyo incondicional durante el desarrollo de TwinPro.
                            </Text>
                            <Text style={styles.thanksText}>
                                También agradecemos a la comunidad de código abierto. TwinPro utiliza proyectos increíbles que nos permiten construir mejor software. Los detalles de las licencias se encuentran en la sección "Licencias".
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <MaterialIcons name="smart-toy" size={24} color={COLORS.gray400} />
                    <Text style={styles.copyright}>© 2024 TwinPro Inc.</Text>
                </View>
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 48,
    },
    // Hero
    heroSection: {
        alignItems: "center",
        paddingVertical: 32,
        gap: 8,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(249, 245, 6, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray500,
        textAlign: "center",
        maxWidth: 280,
        lineHeight: 20,
    },
    // Sections
    sectionsContainer: {
        gap: 24,
    },
    teamSection: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 12,
    },
    membersCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    memberRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    memberName: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    memberRole: {
        fontSize: 12,
        color: COLORS.gray400,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 16,
    },
    // Thanks Card
    thanksCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        gap: 12,
    },
    thanksText: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 22,
    },
    // Footer
    footer: {
        alignItems: "center",
        gap: 12,
        marginTop: 32,
        opacity: 0.5,
    },
    copyright: {
        fontSize: 12,
        color: COLORS.gray400,
    },
});
