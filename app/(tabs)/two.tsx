import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { chatApi, userApi, getAssetUrl } from "../../api";
import type { User } from "../../api/user";
import { useAuth } from "../../context";

// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
  return getAssetUrl(avatarPath);
}

export default function ExploreScreen() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await userApi.getUsers(token);
      setUsers(data);
    } catch (error) {
      console.log("Error loading users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadUsers();
  }

  async function handleStartChat(userId: string) {
    if (!token || !user) return;
    setCreatingChat(userId);
    try {
      // Create chat and then navigate to avatar-chat using the user's ID
      await chatApi.createChat(token, userId, user._id);
      router.push(`/avatar-chat/${userId}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear el chat");
    } finally {
      setCreatingChat(null);
    }
  }

  function renderUser({ item }: { item: User }) {
    const isCreating = creatingChat === item._id;
    const avatarUrl = getAvatarUrl(item.avatar);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleStartChat(item._id)}
        disabled={isCreating}
      >
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <MaterialIcons name="person" size={24} color="#666" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstname && item.lastname
              ? `${item.firstname} ${item.lastname}`
              : item.email}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        {isCreating ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <MaterialIcons name="chat" size={24} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <Text style={styles.headerSubtitle}>Encuentra usuarios para chatear</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay usuarios disponibles</Text>
          </View>
        }
      />
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
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
});
