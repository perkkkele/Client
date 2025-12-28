import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import AddressAutocomplete from "../../components/AddressAutocomplete";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#FFFFFF",
    textMain: "#0f172a",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    blue50: "#eff6ff",
    blue600: "#2563eb",
    green50: "#f0fdf4",
    green500: "#22c55e",
    green600: "#16a34a",
    orange50: "#fff7ed",
    orange600: "#ea580c",
    purple50: "#faf5ff",
    purple600: "#9333ea",
    red50: "#fef2f2",
    red600: "#dc2626",
    white: "#FFFFFF",
};

interface SocialLink {
    id: string;
    platform: string;
    icon: string;
    placeholder: string;
    value: string;
    color: string;
    bgColor: string;
}

export default function ContactInfoScreen() {
    const { token, user, refreshUser } = useAuth();

    // Contact info state
    const [phone, setPhone] = useState(user?.phone || "");
    const [professionalEmail, setProfessionalEmail] = useState(user?.professionalEmail || "");
    const [website, setWebsite] = useState(user?.website || "");
    const [address, setAddress] = useState(user?.location?.address || "");
    const [city, setCity] = useState(user?.location?.city || "");
    const [locationData, setLocationData] = useState<{
        address: string | null;
        city: string | null;
        lat: number | null;
        lng: number | null;
    }>({
        address: user?.location?.address || null,
        city: user?.location?.city || null,
        lat: user?.location?.lat || null,
        lng: user?.location?.lng || null,
    });

    // Social links state
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
        { id: "linkedin", platform: "LinkedIn", icon: "public", placeholder: "linkedin.com/in/usuario", value: user?.socialLinks?.linkedin || "", color: "#0077B5", bgColor: "#E0F2FE" },
        { id: "instagram", platform: "Instagram", icon: "camera-alt", placeholder: "@usuario", value: user?.socialLinks?.instagram || "", color: "#E4405F", bgColor: "#FCE7F3" },
        { id: "twitter", platform: "X (Twitter)", icon: "tag", placeholder: "@usuario", value: user?.socialLinks?.twitter || "", color: "#1DA1F2", bgColor: "#DBEAFE" },
        { id: "facebook", platform: "Facebook", icon: "facebook", placeholder: "facebook.com/usuario", value: user?.socialLinks?.facebook || "", color: "#1877F2", bgColor: "#DBEAFE" },
    ]);

    const [isSaving, setIsSaving] = useState(false);

    function handleBack() {
        router.back();
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            if (token) {
                // Build social links object from array
                const socialLinksObj: Record<string, string> = {};
                socialLinks.forEach(link => {
                    if (link.value.trim()) {
                        socialLinksObj[link.id] = link.value.trim();
                    }
                });

                // Use locationData from autocomplete or preserve existing
                const finalLocationData = locationData.lat && locationData.lng
                    ? locationData
                    : {
                        address: address.trim() || null,
                        city: city.trim() || null,
                        lat: user?.location?.lat || null,
                        lng: user?.location?.lng || null,
                    };

                await userApi.updateUser(token, {
                    phone: phone.trim() || undefined,
                    professionalEmail: professionalEmail.trim() || undefined,
                    website: website.trim() || undefined,
                    location: finalLocationData,
                    socialLinks: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : undefined,
                } as any);

                if (refreshUser) {
                    await refreshUser();
                }

                Alert.alert("Éxito", "Datos de contacto actualizados", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar los datos");
        } finally {
            setIsSaving(false);
        }
    }

    function updateSocialLink(id: string, value: string) {
        setSocialLinks(prev =>
            prev.map(link =>
                link.id === id ? { ...link, value } : link
            )
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Datos de contacto</Text>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? "Guardando..." : "Guardar"}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Contact Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMACIÓN DE CONTACTO</Text>
                    <Text style={styles.sectionHint}>
                        Estos datos serán visibles en tu perfil público para que tus clientes puedan contactarte.
                    </Text>

                    <View style={styles.card}>
                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <View style={[styles.inputIcon, { backgroundColor: COLORS.green50 }]}>
                                    <MaterialIcons name="phone" size={18} color={COLORS.green600} />
                                </View>
                                <Text style={styles.inputLabelText}>Teléfono profesional</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+34 600 000 000"
                                placeholderTextColor={COLORS.gray400}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <View style={[styles.inputIcon, { backgroundColor: COLORS.blue50 }]}>
                                    <MaterialIcons name="email" size={18} color={COLORS.blue600} />
                                </View>
                                <Text style={styles.inputLabelText}>Email profesional</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={professionalEmail}
                                onChangeText={setProfessionalEmail}
                                placeholder="contacto@tuprofesion.com"
                                placeholderTextColor={COLORS.gray400}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Website */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <View style={[styles.inputIcon, { backgroundColor: COLORS.purple50 }]}>
                                    <MaterialIcons name="language" size={18} color={COLORS.purple600} />
                                </View>
                                <Text style={styles.inputLabelText}>Sitio web</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={website}
                                onChangeText={setWebsite}
                                placeholder="www.tusitio.com"
                                placeholderTextColor={COLORS.gray400}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </View>

                {/* Location Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>UBICACIÓN</Text>
                    <Text style={styles.sectionHint}>
                        Indica dónde ofreces tus servicios para que los clientes cercanos te encuentren.
                    </Text>

                    <View style={[styles.card, { zIndex: 100 }]}>
                        {/* Address with Autocomplete */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <View style={[styles.inputIcon, { backgroundColor: COLORS.orange50 }]}>
                                    <MaterialIcons name="location-on" size={18} color={COLORS.orange600} />
                                </View>
                                <Text style={styles.inputLabelText}>Dirección</Text>
                            </View>
                            <AddressAutocomplete
                                value={address}
                                onChangeText={setAddress}
                                onAddressSelect={(selectedAddress) => {
                                    setAddress(selectedAddress.formattedAddress);
                                    if (selectedAddress.city) {
                                        setCity(selectedAddress.city);
                                    }
                                    setLocationData({
                                        address: selectedAddress.formattedAddress,
                                        city: selectedAddress.city,
                                        lat: selectedAddress.lat,
                                        lng: selectedAddress.lng,
                                    });
                                }}
                                placeholder="Escribe una dirección..."
                            />
                        </View>
                    </View>
                </View>

                {/* Social Links Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>REDES SOCIALES</Text>
                    <Text style={styles.sectionHint}>
                        Añade tus perfiles de redes sociales para aumentar tu visibilidad.
                    </Text>

                    <View style={styles.card}>
                        {socialLinks.map((social, index) => (
                            <View key={social.id}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabel}>
                                        <View style={[styles.inputIcon, { backgroundColor: social.bgColor }]}>
                                            <MaterialIcons
                                                name={social.icon as any}
                                                size={18}
                                                color={social.color}
                                            />
                                        </View>
                                        <Text style={styles.inputLabelText}>{social.platform}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={social.value}
                                        onChangeText={(value) => updateSocialLink(social.id, value)}
                                        placeholder={social.placeholder}
                                        placeholderTextColor={COLORS.gray400}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {index < socialLinks.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                    <MaterialIcons name="info-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.privacyText}>
                        Tu información de contacto será visible para los usuarios que visiten tu perfil público.
                    </Text>
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
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 12,
        lineHeight: 18,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        paddingVertical: 8,
    },
    inputLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    inputIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    inputLabelText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    input: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textMain,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 8,
    },
    privacyNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 12,
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
    },
    privacyText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
    },
});
