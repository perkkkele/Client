import { API_URL } from "./config";

export type UserType = 'user' | 'userpro';
export type CategoryType = 'legal' | 'salud' | 'hogar' | 'educacion' | 'fitness' | 'otros';

export interface User {
    _id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    avatar?: string;
    userType: UserType;
    // Intereses profesionales (para usuarios normales)
    interests?: string[];
    // Campos específicos para userpro (profesionales)
    profession?: string;
    category?: CategoryType;
    description?: string;
    rating?: number;
    ratingCount?: number;
    isOnline?: boolean;
    isFeatured?: boolean;
    createdAt?: string;
    lastActive?: string;
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
    data: { firstname?: string; lastname?: string; interests?: string[] }
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

export async function updateAvatar(
    token: string,
    imageUri: string
): Promise<User> {
    return new Promise((resolve, reject) => {
        // Get the file name and type from the URI
        const uriParts = imageUri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split(".").pop() || "jpg";

        console.log("Uploading avatar:", { imageUri, fileName, fileType });

        const formData = new FormData();
        formData.append("avatar", {
            uri: imageUri,
            name: fileName,
            type: `image/${fileType}`,
        } as any);

        // Use XMLHttpRequest instead of fetch for more reliable file uploads in React Native
        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", `${API_URL}/user/me`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.onload = () => {
            console.log("Avatar upload response status:", xhr.status);

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error("Error al procesar respuesta del servidor"));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.msg || error.message || `Error ${xhr.status}`));
                } catch (e) {
                    reject(new Error(`Error del servidor (${xhr.status})`));
                }
            }
        };

        xhr.onerror = () => {
            console.error("XHR error:", xhr.status, xhr.statusText);
            reject(new Error("Error de red al subir la imagen. Verifica tu conexión."));
        };

        xhr.ontimeout = () => {
            reject(new Error("Tiempo de espera agotado al subir la imagen"));
        };

        xhr.timeout = 30000; // 30 second timeout
        xhr.send(formData);
    });
}

export async function deleteAccount(token: string): Promise<{ msg: string }> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al eliminar la cuenta");
    }

    return response.json();
}
