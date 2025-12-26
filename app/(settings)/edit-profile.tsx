import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { API_HOST, API_PORT, userApi } from "../../api";

const COLORS = {
    primary: "#f9f506",
    primaryDark: "#e6e205",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    surfaceDark: "#2e2d15",
    textMain: "#181811",
    textMuted: "#6B7280",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function EditProfileScreen() {
    const { user, token, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Form state
    const [firstname, setFirstname] = useState(user?.firstname || "");
    const [lastname, setLastname] = useState(user?.lastname || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");

    const avatarUrl = getAvatarUrl(user?.avatar);
    const username = user?.email?.split("@")[0] || "usuario";

    function handleBack() {
        router.back();
    }

    async function pickImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar tu foto.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            handleChangeAvatar(result.assets[0].uri);
        }
    }

    async function handleChangeAvatar(imageUri: string) {
        if (!token) {
            Alert.alert("Error", "No hay sesión activa");
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const updatedUser = await userApi.updateAvatar(token, imageUri);
            await updateUserProfile(updatedUser);
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar la foto de perfil");
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    async function handleSave() {
        if (!token) {
            Alert.alert("Error", "No hay sesión activa");
            return;
        }

        setIsLoading(true);
        try {
            const updatedUser = await userApi.updateUser(token, {
                firstname: firstname.trim() || undefined,
                lastname: lastname.trim() || undefined,
            });
            await updateUserProfile(updatedUser);
            Alert.alert("Éxito", "Perfil actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo actualizar el perfil");
        } finally {
            setIsLoading(false);
        }
    }

    function handleChangePassword() {
        router.push("/(settings)/change-password");
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        disabled={isUploadingAvatar}
                        activeOpacity={0.8}
                    >
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={80} color={COLORS.gray400} />
                            </View>
                        )}
                        {isUploadingAvatar && (
                            <View style={styles.avatarLoading}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        )}
                        <View style={styles.avatarOverlay}>
                            <MaterialIcons name="photo-camera" size={32} color="#FFFFFF" />
                        </View>
                        <View style={styles.editAvatarButton}>
                            <MaterialIcons name="edit" size={18} color="#000000" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} disabled={isUploadingAvatar}>
                        <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    {/* Username (readonly) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>NOMBRE DE USUARIO</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.atSymbol}>@</Text>
                            <TextInput
                                style={[styles.input, styles.inputWithPrefix]}
                                value={username}
                                editable={false}
                                placeholder="nombre_usuario"
                                placeholderTextColor={COLORS.gray400}
                            />
                        </View>
                        <Text style={styles.inputHint}>Este es tu identificador único en la plataforma.</Text>
                    </View>

                    {/* Display Name (Firstname) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>NOMBRE</Text>
                        <TextInput
                            style={styles.input}
                            value={firstname}
                            onChangeText={setFirstname}
                            placeholder="Tu nombre"
                            placeholderTextColor={COLORS.gray400}
                        />
                    </View>

                    {/* Lastname */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>APELLIDOS</Text>
                        <TextInput
                            style={styles.input}
                            value={lastname}
                            onChangeText={setLastname}
                            placeholder="Tus apellidos"
                            placeholderTextColor={COLORS.gray400}
                        />
                    </View>

                    {/* Email (readonly) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={email}
                            editable={false}
                            placeholder="tucorreo@ejemplo.com"
                            placeholderTextColor={COLORS.gray400}
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Phone (optional) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TELÉFONO (OPCIONAL)</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+34 000 000 000"
                            placeholderTextColor={COLORS.gray400}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                    style={styles.changePasswordButton}
                    onPress={handleChangePassword}
                    activeOpacity={0.7}
                >
                    <View style={styles.changePasswordLeft}>
                        <View style={styles.changePasswordIcon}>
                            <MaterialIcons name="lock" size={20} color={COLORS.gray600} />
                        </View>
                        <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.gray400} />
                </TouchableOpacity>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                            <MaterialIcons name="check" size={20} color="#000000" />
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
        backgroundColor: COLORS.backgroundLight,
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
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    // Avatar Section
    avatarSection: {
        alignItems: "center",
        paddingVertical: 24,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    avatarPlaceholder: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: COLORS.surfaceLight,
    },
    avatarLoading: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 64,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 64,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0,
    },
    editAvatarButton: {
        position: "absolute",
        bottom: 4,
        right: 4,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: COLORS.backgroundLight,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray600,
    },
    // Form Section
    formSection: {
        gap: 20,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray500,
        letterSpacing: 0.8,
        paddingHorizontal: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    atSymbol: {
        position: "absolute",
        left: 16,
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.gray400,
        zIndex: 1,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.textMain,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputWithPrefix: {
        paddingLeft: 32,
    },
    inputDisabled: {
        backgroundColor: COLORS.gray100,
        color: COLORS.gray500,
    },
    inputHint: {
        fontSize: 11,
        color: COLORS.gray400,
        paddingHorizontal: 4,
    },
    // Change Password
    changePasswordButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    changePasswordLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    changePasswordIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    changePasswordText: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        padding: 20,
        paddingBottom: 36,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000000",
    },
});
