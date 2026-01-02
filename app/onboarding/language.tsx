import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";

const COLORS = {
    primary: "#FFEA00",
    primaryHover: "#FFD600",
    backgroundLight: "#F8FAFC",
    surfaceLight: "#FFFFFF",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray700: "#334155",
    gray900: "#0F172A",
    secondaryText: "#64748B",
};

interface Language {
    id: 'es' | 'en' | 'fr' | 'de';
    name: string;
    flag: string;
}

const LANGUAGES: Language[] = [
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "en", name: "English", flag: "🇺🇸" },
    { id: "fr", name: "Français", flag: "🇫🇷" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
];

export default function LanguageScreen() {
    const { token, refreshUser } = useAuth();
    const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en' | 'fr' | 'de'>("es");
    const [isSaving, setIsSaving] = useState(false);

    async function handleContinue() {
        if (!token) {
            router.push("/onboarding/profile-type");
            return;
        }

        setIsSaving(true);
        try {
            // Guardar idioma seleccionado en el perfil del usuario
            await userApi.updateUser(token, { language: selectedLanguage });

            // Refrescar los datos del usuario en el contexto
            if (refreshUser) {
                await refreshUser();
            }

            router.push("/onboarding/profile-type");
        } catch (error: any) {
            console.error("Error saving language:", error);
            Alert.alert("Error", "No se pudo guardar el idioma. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        Te damos la{"\n"}bienvenida a{" "}
                        <Text style={styles.titleHighlight}>TwinPro</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Selecciona tu idioma para poder continuar
                    </Text>
                </View>

                {/* Language Options */}
                <View style={styles.languageList}>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            style={[
                                styles.languageButton,
                                selectedLanguage === lang.id && styles.languageButtonSelected,
                            ]}
                            onPress={() => setSelectedLanguage(lang.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.languageContent}>
                                <Text style={styles.flag}>{lang.flag}</Text>
                                <Text
                                    style={[
                                        styles.languageName,
                                        selectedLanguage === lang.id && styles.languageNameSelected,
                                    ]}
                                >
                                    {lang.name}
                                </Text>
                            </View>
                            {selectedLanguage === lang.id ? (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                            ) : (
                                <Ionicons name="ellipse-outline" size={24} color={COLORS.gray300} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={COLORS.gray900} />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Continuar</Text>
                            <Ionicons name="arrow-forward" size={20} color={COLORS.gray900} />
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 64,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
        marginTop: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: COLORS.gray900,
        textAlign: "center",
        lineHeight: 40,
        marginBottom: 16,
    },
    titleHighlight: {
        color: "#EAB308",
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.secondaryText,
        textAlign: "center",
        fontWeight: "500",
        maxWidth: 280,
    },
    languageList: {
        gap: 12,
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
    },
    languageButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    languageButtonSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    languageContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    flag: {
        fontSize: 28,
    },
    languageName: {
        fontSize: 18,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    languageNameSelected: {
        fontWeight: "600",
        color: COLORS.gray900,
    },
    footer: {
        padding: 24,
        backgroundColor: COLORS.surfaceLight,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.gray900,
        paddingVertical: 16,
        borderRadius: 20,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },
});
