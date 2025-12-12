import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_HOST, API_PORT, userApi } from "../../api";
import { useAuth } from "../../context";

export default function ProfileScreen() {
  const { user, token, logout, updateUserProfile } = useAuth();
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Build full URL for avatar from server path
  function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    // If it's already a full URL, return as-is
    if (avatarPath.startsWith("http")) return avatarPath;
    // Otherwise, build URL from server
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  async function pickImage() {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar tu foto.");
      return;
    }

    // Pick image
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

    setUpdatingAvatar(true);
    try {
      console.log("Attempting to upload avatar from:", imageUri);
      const updatedUser = await userApi.updateAvatar(token, imageUri);
      await updateUserProfile(updatedUser);
      Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
    } catch (error: any) {
      console.error("Error updating avatar:", error.message || error);
      const errorMessage = error.message || "No se pudo actualizar la foto de perfil";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdatingAvatar(false);
    }
  }

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={pickImage}
            disabled={updatingAvatar}
          >
            {avatarUrl ? (
              <>
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                />
                {updatingAvatar && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                  </View>
                )}
              </>
            ) : (
              <MaterialIcons name="person" size={60} color="#666" />
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={24} color="#4F46E5" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
            </View>
          </View>

          {user?.firstname && (
            <View style={styles.infoItem}>
              <MaterialIcons name="badge" size={24} color="#4F46E5" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>
                  {user.firstname} {user.lastname}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4F46E5",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
