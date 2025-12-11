import { API_URL } from "./config";

export interface User {
    _id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    avatar?: string;
}

export async function getMe(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuario");
    }

    return response.json();
}

export async function getUsers(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/user`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuarios");
    }

    return response.json();
}

export async function getUser(token: string, userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuario");
    }

    return response.json();
}

export async function updateUser(
    token: string,
    data: { firstname?: string; lastname?: string }
): Promise<User> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al actualizar usuario");
    }

    return response.json();
}
