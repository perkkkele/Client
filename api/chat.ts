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

