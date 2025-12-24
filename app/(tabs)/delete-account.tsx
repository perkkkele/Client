import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    textMuted: "#6B7280",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray700: "#374151",
    gray800: "#1F2937",
    red50: "#FEF2F2",
    red100: "#FEE2E2",
    red400: "#F87171",
    red500: "#EF4444",
    red600: "#DC2626",
    red700: "#B91C1C",
    red900: "#7F1D1D",
};

export default function DeleteAccountScreen() {
    const { logout } = useAuth();
    const [confirmText, setConfirmText] = useState("");

    const canDelete = confirmText.toUpperCase() === "ELIMINAR";

    function handleBack() {
        router.back();
    }

    function handleCancel() {
        router.back();
    }

    async function handleDeleteAccount() {
        if (!canDelete) {
            Alert.alert("Error", "Escribe ELIMINAR para confirmar");
            return;
        }

        try {
            // TODO: Llamar a la API para eliminar la cuenta
            // await userApi.deleteAccount(token);

            await logout();
            router.replace("/delete-account-success");
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo eliminar la cuenta");
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Eliminar Cuenta</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Main content */}
                <View style={styles.mainContent}>
                    {/* Warning icon */}
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="warning" size={56} color={COLORS.red600} />
                        </View>
                    </View>

                    {/* Warning text */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            ¡Atención! Vas a eliminar tu cuenta definitivamente
                        </Text>
                        <Text style={styles.description}>
                            Esta acción es{" "}
                            <Text style={styles.descriptionHighlight}>irreversible</Text>. Se
                            borrará tu perfil, historial de chats, datos de gemelo digital y
                            toda la información asociada. No podrás recuperarla.
                        </Text>
                    </View>

                    {/* Confirmation input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            Escribe <Text style={styles.inputLabelBold}>ELIMINAR</Text> para
                            confirmar
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="ELIMINAR"
                                placeholderTextColor={COLORS.gray400}
                                value={confirmText}
                                onChangeText={setConfirmText}
                                autoCapitalize="characters"
                            />
                            <MaterialIcons
                                name="edit"
                                size={20}
                                color={COLORS.gray400}
                                style={styles.inputIcon}
                            />
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
                        onPress={handleDeleteAccount}
                        disabled={!canDelete}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.deleteButtonText}>
                            Eliminar Cuenta Definitivamente
                        </Text>
                        <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
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
    content: {
        flex: 1,
        padding: 24,
        justifyContent: "space-between",
    },
    mainContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
    },
    iconWrapper: {
        position: "relative",
    },
    iconGlow: {
        position: "absolute",
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        borderRadius: 999,
    },
    iconContainer: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 4,
        borderColor: COLORS.red50,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    textContainer: {
        alignItems: "center",
        gap: 16,
        maxWidth: 320,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textMain,
        textAlign: "center",
        lineHeight: 28,
    },
    description: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 22,
    },
    descriptionHighlight: {
        color: COLORS.red600,
        fontWeight: "600",
    },
    inputContainer: {
        width: "100%",
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray700,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputLabelBold: {
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    inputWrapper: {
        position: "relative",
    },
    input: {
        width: "100%",
        height: 56,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingHorizontal: 16,
        paddingRight: 48,
        fontSize: 18,
        fontWeight: "500",
        color: COLORS.textMain,
        letterSpacing: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        position: "absolute",
        right: 16,
        top: 18,
    },
    buttonContainer: {
        gap: 12,
        paddingTop: 16,
    },
    deleteButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.red600,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: COLORS.red600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    deleteButtonDisabled: {
        opacity: 0.5,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    cancelButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
});
