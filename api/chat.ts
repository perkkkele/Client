import { API_URL } from "./config";
import { User } from "./user";

export interface Chat {
    _id: string;
    participant_one: User | string;
    participant_two: User | string;
    participantOne?: User;
    participantTwo?: User;
    last_message_date?: string;
    last_message?: string;
    title?: string;
    isAvatarChat?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CreateChatResponse {
    message: string;
    chat: Chat;
}

interface GetChatsResponse {
    chats: Chat[];
}

export async function createChat(
    token: string,
    participantIdOne: string,
    participantIdTwo: string
): Promise<Chat> {
    const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            participant_id_one: participantIdOne,
            participant_id_two: participantIdTwo
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al crear chat");
    }

    const data: CreateChatResponse = await response.json();
    return data.chat;
}

// Create a new avatar chat thread (allows multiple threads per professional)
export async function createAvatarChat(
    token: string,
    participantIdOne: string,
    participantIdTwo: string,
    title?: string
): Promise<Chat> {
    const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            participant_id_one: participantIdOne,
            participant_id_two: participantIdTwo,
            isAvatarChat: true,
            title: title || null
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al crear chat de avatar");
    }

    const data: CreateChatResponse = await response.json();
    console.log('[createAvatarChat] Created new avatar chat:', data.chat._id);
    return data.chat;
}

export async function getChats(token: string): Promise<Chat[]> {
    const response = await fetch(`${API_URL}/chat`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener chats");
    }

    const data: GetChatsResponse = await response.json();
    return data.chats || [];
}

export async function getChat(token: string, chatId: string): Promise<Chat> {
    const response = await fetch(`${API_URL}/chat/${chatId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener chat");
    }

    return response.json();
}

export async function deleteChat(token: string, chatId: string): Promise<void> {
    const response = await fetch(`${API_URL}/chat/${chatId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al eliminar chat");
    }
}

// Send a text message in a chat
export interface SendMessageOptions {
    isFromBot?: boolean;
    isFromVideoCall?: boolean;
}

export async function sendMessage(
    token: string,
    chatId: string,
    message: string,
    options: SendMessageOptions = {}
): Promise<void> {
    const response = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chatId,
            message,
            isFromBot: options.isFromBot || false,
            isFromVideoCall: options.isFromVideoCall || false,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al enviar mensaje");
    }
}

// Interface for avatar conversation history
export interface AvatarConversation {
    _id: string;
    client: {
        _id: string;
        name: string;
        initials: string;
        avatar?: string;
        email?: string;
    };
    messageCount: number;
    lastMessage: string | null;
    lastMessageDate: string;
    preview: string;
    status: "resolved" | "escalated";
    createdAt: string;
    updatedAt: string;
    title?: string;
}

interface GetAvatarChatsResponse {
    conversations: AvatarConversation[];
}

// Get all avatar chat conversations for a professional's digital twin
export async function getAvatarChats(
    token: string,
    professionalId: string
): Promise<AvatarConversation[]> {
    const response = await fetch(`${API_URL}/avatar-chats/${professionalId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener historial de conversaciones");
    }

    const data: GetAvatarChatsResponse = await response.json();
    return data.conversations || [];
}

// Interface for professional chat list
export interface ProChat {
    _id: string;
    client: {
        _id: string;
        name: string;
        initials: string;
        avatar?: string;
        email?: string;
    };
    messageCount: number;
    unreadCount: number;
    lastMessage: string | null;
    lastMessageDate: string;
    escalation: {
        status: 'none' | 'pending' | 'accepted' | 'declined';
        requestedAt?: string;
        reason?: 'client_request' | 'twin_unable' | 'keyword' | 'twin_disabled';
        respondedAt?: string;
    };
    videoCallActive: boolean;
    createdAt: string;
    updatedAt: string;
    title?: string;
}

interface GetProChatsResponse {
    chats: ProChat[];
}

// Get all chats for a professional (including escalated)
export async function getProChats(
    token: string,
    professionalId: string
): Promise<ProChat[]> {
    const response = await fetch(`${API_URL}/pro-chats/${professionalId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener chats");
    }

    const data: GetProChatsResponse = await response.json();
    return data.chats || [];
}

// Escalate a chat - client requests to talk to human professional
export async function escalateChat(
    token: string,
    chatId: string,
    reason: 'client_request' | 'twin_unable' | 'keyword' = 'client_request'
): Promise<void> {
    const response = await fetch(`${API_URL}/chat/${chatId}/escalate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al escalar chat");
    }
}

// Professional responds to escalation request
export async function respondToEscalation(
    token: string,
    chatId: string,
    accept: boolean
): Promise<void> {
    const response = await fetch(`${API_URL}/chat/${chatId}/escalation/respond`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ accept }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al responder a la escalación");
    }
}

// Professional sends a reply to a chat
export async function proReply(
    token: string,
    chatId: string,
    message: string
): Promise<void> {
    const response = await fetch(`${API_URL}/chat/${chatId}/reply`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al enviar mensaje");
    }
}

// Session time limit tracking interfaces
export interface SessionStatus {
    isExpired: boolean;
    remainingMinutes: number;
    usedMinutes: number;
    resetAt?: string;
    limitMinutes?: number;
}

// Get session status for a chat (without adding time)
export async function getSessionStatus(
    token: string,
    chatId: string
): Promise<SessionStatus> {
    const response = await fetch(`${API_URL}/chat/${chatId}/session-status`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener estado de sesión");
    }

    return response.json();
}

// Update session time (add minutes) and check if expired
export async function updateSessionTime(
    token: string,
    chatId: string,
    minutesToAdd: number = 1
): Promise<SessionStatus> {
    const response = await fetch(`${API_URL}/chat/${chatId}/session-time`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ minutesToAdd }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al actualizar tiempo de sesión");
    }

    return response.json();
}
