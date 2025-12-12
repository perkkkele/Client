import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_HOST, API_PORT, chatApi } from "../../api";
import type { Chat } from "../../api/chat";
import { useAuth } from "../../context";

// Helper to build avatar URL from server path
function getAvatarUrl(avatarPath: string | undefined): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function ChatsScreen() {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.getChats(token);
      setChats(data);
    } catch (error) {
      console.log("Error loading chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadChats();
  }

  function getChatPartner(chat: Chat) {
    // Server uses participant_one and participant_two (populated with user data)
    const p1 = chat.participant_one;
    const p2 = chat.participant_two;

    // Check if participant is a User object (populated) or just an ID string
    const p1Id = typeof p1 === 'string' ? p1 : p1?._id;
    const p2Id = typeof p2 === 'string' ? p2 : p2?._id;

    if (p1Id !== user?._id && typeof p1 !== 'string') {
      return p1;
    }
    if (p2Id !== user?._id && typeof p2 !== 'string') {
      return p2;
    }
    return null;
  }

  function renderChat({ item }: { item: Chat }) {
    const partner = getChatPartner(item);
    const avatarUrl = getAvatarUrl(partner?.avatar);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item._id}`)}
      >
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <MaterialIcons name="person" size={24} color="#666" />
          )}
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {partner?.email || "Usuario desconocido"}
          </Text>
          <Text style={styles.chatPreview}>Toca para ver mensajes</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
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
        <Text style={styles.headerTitle}>Chats</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderChat}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes chats aún</Text>
            <Text style={styles.emptySubtext}>
              Ve a "Explorar" para iniciar una conversación
            </Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatItem: {
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
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chatPreview: {
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
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
