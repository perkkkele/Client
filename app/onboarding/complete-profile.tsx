import { router } from "expo-router";
import { useState, useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActionSheetIOS,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { userApi } from "../../api";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';
import { getCategoryLabel } from '../../utils/categoryUtils';

const COLORS = {
    primary: "#FFE600",
    backgroundLight: "#FAFAFA",
    surfaceLight: "#FFFFFF",
    textMain: "#0F172A",
    textMuted: "#64748B",
    gray200: "#E2E8F0",
    gray700: "#334155",
    success: "#10B981",
};

interface Interest {
    id: string;
    name: string;
    icon: string;
}

const INTEREST_IDS = [
    { id: "legal", icon: "gavel" },
    { id: "salud", icon: "medical-services" },
    { id: "fitness", icon: "fitness-center" },
    { id: "hogar", icon: "home-repair-service" },
    { id: "finanzas", icon: "attach-money" },
    { id: "educacion", icon: "school" },
    { id: "tecnologia", icon: "computer" },
    { id: "diseno", icon: "palette" },
    { id: "bienestar", icon: "self-improvement" },
    { id: "inmobiliario", icon: "real-estate-agent" },
    { id: "estetica", icon: "face" },
    { id: "empleo", icon: "work" },
    { id: "energia", icon: "bolt" },
    { id: "otros", icon: "add" },
];

export default function CompleteProfileScreen() {
    const { token, refreshUser } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('onboarding');
    const { t: tCommon } = useTranslation('common');
    const INTERESTS = useMemo(() => INTEREST_IDS.map(item => ({
        ...item,
        name: getCategoryLabel(tCommon, item.id),
    })), [tCommon]);
    const [displayName, setDisplayName] = useState("");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const isNameValid = displayName.length >= 3;

    function handleBack() {
        router.back();
    }

    function handleSkip() {
        router.push("/onboarding/success");
    }

    async function handlePickFromGallery() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    }

    async function handleTakePhoto() {
        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert({
                type: 'warning',
                title: t('completeProfile.permissionRequired'),
                message: t('completeProfile.cameraPermissionMessage'),
                buttons: [{ text: "OK" }]
            });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    }

    function showImageOptions() {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [t('completeProfile.cancel'), t('completeProfile.takePhoto'), t('completeProfile.chooseFromGallery')],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleTakePhoto();
                    } else if (buttonIndex === 2) {
                        handlePickFromGallery();
                    }
                }
            );
        } else {
            // Android - use Alert with buttons
            showAlert({
                type: 'warning',
                title: t('completeProfile.profilePhoto'),
                message: t('completeProfile.profilePhotoQuestion'),
                buttons: [
                    { text: t('completeProfile.cancel'), style: "cancel" },
                    { text: t('completeProfile.takePhoto'), onPress: handleTakePhoto },
                    { text: t('completeProfile.chooseFromGallery'), onPress: handlePickFromGallery },
                ]
            });
        }
    }

    function toggleInterest(interestId: string) {
        setSelectedInterests((prev) =>
            prev.includes(interestId)
                ? prev.filter((id) => id !== interestId)
                : [...prev, interestId]
        );
    }

    async function handleContinue() {
        if (!token) return;

        setIsLoading(true);
        try {
            // Parsear nombre en firstname y lastname
            const nameParts = displayName.trim().split(" ");
            const firstname = nameParts[0] || "";
            const lastname = nameParts.slice(1).join(" ") || "";

            // Guardar nombre e intereses
            await userApi.updateUser(token, {
                firstname,
                lastname,
                interests: selectedInterests,
            });

            // Actualizar el usuario en el contexto
            if (refreshUser) {
                await refreshUser();
            }

            // Subir avatar si se seleccionó uno
            if (avatarUri) {
                await userApi.updateAvatar(token, avatarUri);
                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/success");
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message || t('completeProfile.saveError') });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray700} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipText}>{t('completeProfile.skip')}</Text>
                </TouchableOpacity>
            </View>

            {/* Main content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{t('completeProfile.title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('completeProfile.subtitle')}
                    </Text>
                </View>

                {/* Avatar picker */}
                <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions}>
                    <View style={styles.avatarWrapper}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={48} color={COLORS.textMuted} />
                            </View>
                        )}
                        <View style={styles.cameraButton}>
                            <MaterialIcons name="photo-camera" size={20} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Name input */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>{t('completeProfile.nameLabel')}</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="person" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('completeProfile.namePlaceholder')}
                            placeholderTextColor={COLORS.textMuted}
                            value={displayName}
                            onChangeText={setDisplayName}
                        />
                        {displayName.length > 0 && (
                            <MaterialIcons
                                name={isNameValid ? "check-circle" : "cancel"}
                                size={20}
                                color={isNameValid ? COLORS.success : "#EF4444"}
                            />
                        )}
                    </View>
                    {displayName.length > 0 && (
                        <View style={styles.validationHint}>
                            <MaterialIcons
                                name={isNameValid ? "check" : "close"}
                                size={14}
                                color={isNameValid ? COLORS.success : "#EF4444"}
                            />
                            <Text style={[styles.hintText, { color: isNameValid ? COLORS.success : "#EF4444" }]}>
                                {t('completeProfile.nameHint')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Interests selection */}
                <View style={styles.interestsSection}>
                    <Text style={styles.inputLabel}>{t('completeProfile.interestsLabel')}</Text>
                    <View style={styles.interestsGrid}>
                        {INTERESTS.map((interest) => {
                            const isSelected = selectedInterests.includes(interest.id);
                            return (
                                <TouchableOpacity
                                    key={interest.id}
                                    style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                                    onPress={() => toggleInterest(interest.id)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons
                                        name={interest.icon as any}
                                        size={16}
                                        color={isSelected ? "#000000" : COLORS.gray700}
                                    />
                                    <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                                        {interest.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Footer button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                >
                    <Text style={styles.continueButtonText}>{t('completeProfile.continue')}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000000" />
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    skipText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    titleSection: {
        alignItems: "center",
        marginTop: 8,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatarWrapper: {
        position: "relative",
    },
    avatar: {
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    avatarPlaceholder: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.backgroundLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputSection: {
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray700,
        marginBottom: 12,
        paddingLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    validationHint: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingLeft: 4,
        gap: 4,
    },
    hintText: {
        fontSize: 12,
        fontWeight: "500",
    },
    interestsSection: {
        marginBottom: 24,
    },
    interestsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    interestChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        gap: 6,
    },
    interestChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    interestText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.gray700,
    },
    interestTextSelected: {
        color: "#000000",
        fontWeight: "600",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 16,
        backgroundColor: COLORS.backgroundLight,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 24,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "bold",
    },
});
