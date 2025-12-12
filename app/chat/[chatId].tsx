import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { API_HOST, API_PORT, chatApi, chatMessageApi, liveAvatarApi, SOCKET_URL } from "../../api";
import type { Chat } from "../../api/chat";
import type { ChatMessage } from "../../api/chatMessage";
import { useAuth } from "../../context";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { token, user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [redirectingToAvatar, setRedirectingToAvatar] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Get chat partner email to check if it's a LiveAvatar user
  function getPartnerEmail(chatData: Chat): string | null {
    const p1 = chatData.participant_one;
    const p2 = chatData.participant_two;
    const p1Email = typeof p1 === 'string' ? null : p1?.email;
    const p2Email = typeof p2 === 'string' ? null : p2?.email;
    const p1Id = typeof p1 === 'string' ? p1 : p1?._id;

    if (p1Id !== user?._id && p1Email) {
      return p1Email;
    }
    if (p2Email) {
      return p2Email;
    }
    return null;
  }

  const loadChat = useCallback(async () => {
    if (!token || !chatId) return;
    try {
      const [chatData, messagesData] = await Promise.all([
        chatApi.getChat(token, chatId),
        chatMessageApi.getMessages(token, chatId),
      ]);

      // Check if partner is a LiveAvatar user (Santa or future professionals)
      const partnerEmail = getPartnerEmail(chatData);
      if (partnerEmail && liveAvatarApi.isLiveAvatarUser(partnerEmail)) {
        setRedirectingToAvatar(true);
        // Redirect to avatar chat screen
        router.replace({
          pathname: "/chat/avatarChat",
          params: { chatId, partnerEmail },
        });
        return;
      }

      setChat(chatData);
      setMessages(messagesData);
    } catch (error) {
      console.log("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  }, [token, chatId, user]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!chatId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("subscribe", chatId);
    });

    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.emit("unsubscribe", chatId);
      socket.disconnect();
    };
  }, [chatId]);

  async function handleSend() {
    if (!token || !chatId || !newMessage.trim()) return;

    setSending(true);
    try {
      await chatMessageApi.sendTextMessage(token, chatId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.log("Error sending message:", error);
    } finally {
      setSending(false);
    }
  }

  async function pickImage() {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para enviar imágenes.");
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleSendImage(result.assets[0].uri);
    }
  }

  async function handleSendImage(imageUri: string) {
    if (!token || !chatId) return;

    setSending(true);
    try {
      await chatMessageApi.sendImage(token, chatId, imageUri);
    } catch (error: any) {
      console.log("Error sending image:", error);
      Alert.alert("Error", error.message || "No se pudo enviar la imagen");
    } finally {
      setSending(false);
    }
  }

  function getChatPartner() {
    if (!chat || !user) return null;

    // Server uses participant_one and participant_two (populated with user data)
    const p1 = chat.participant_one;
    const p2 = chat.participant_two;

    // Check if participant is a User object (populated) or just an ID string
    const p1Id = typeof p1 === 'string' ? p1 : p1?._id;
    const p2Id = typeof p2 === 'string' ? p2 : p2?._id;

    if (p1Id !== user._id && typeof p1 !== 'string') {
      return p1;
    }
    if (p2Id !== user._id && typeof p2 !== 'string') {
      return p2;
    }
    return null;
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    // User can be an object or string depending on whether it was populated
    const messageUserId = typeof item.user === 'string' ? item.user : item.user?._id;
    const isOwn = messageUserId === user?._id;
    const isImage = item.type === "IMAGE";

    // Build image URL from server path
    const imageUrl = isImage ? `http://${API_HOST}:${API_PORT}/${item.message}` : null;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
          isImage && styles.imageMessage,
        ]}
      >
        {isImage && imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.message}
          </Text>
        )}
        <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const partner = getChatPartner();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {partner?.email || "Chat"}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={sending}
        >
          <MaterialIcons name="image" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  ownMessageText: {
    color: "white",
  },
  messageTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  imageMessage: {
    padding: 4,
    backgroundColor: "transparent",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});
