import { API_URL } from "./config";

export interface ChatMessage {
    _id: string;
    chat: string;
    user: string | { _id: string; email: string };
    message?: string;
    type: "TEXT" | "IMAGE";
    isFromBot?: boolean;
    isFromProfessional?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SendMessageResponse {
    ok: boolean;
    chat_message: ChatMessage;
}

interface GetMessagesResponse {
    messages: ChatMessage[];
    total: number;
}

export async function sendTextMessage(
    token: string,
    chatId: string,
    message: string,
    isFromBot: boolean = false
): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: chatId, message, isFromBot }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al enviar mensaje");
    }

    const data: SendMessageResponse = await response.json();
    return data.chat_message;
}

export async function sendImage(
    token: string,
    chatId: string,
    imageUri: string
): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append("chat_id", chatId);

    // Get the file name and type from the URI
    const uriParts = imageUri.split("/");
    const fileName = uriParts[uriParts.length - 1];
    const fileType = fileName.split(".").pop() || "jpg";

    // Append the image file
    formData.append("image", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
    } as any);

    const response = await fetch(`${API_URL}/chat/message/image`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - fetch will set it automatically with boundary
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al enviar imagen");
    }

    const data: SendMessageResponse = await response.json();
    return data.chat_message;
}

export async function getMessages(
    token: string,
    chatId: string
): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/chat/message/${chatId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.msg || "Error al obtener mensajes");
    }

    const data: GetMessagesResponse = await response.json();
    return data.messages || [];
}

export async function getTotalMessages(
    token: string,
    chatId: string
): Promise<{ total: number }> {
    const response = await fetch(`${API_URL}/chat/message/total/${chatId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener total de mensajes");
    }

    return response.json();
}

export async function getLastMessage(
    token: string,
    chatId: string
): Promise<ChatMessage | null> {
    const response = await fetch(`${API_URL}/chat/message/last/${chatId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener último mensaje");
    }

    return response.json();
}
