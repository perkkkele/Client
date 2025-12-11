import { API_URL } from "./config";

export interface LoginResponse {
    accessToken: string;
    refresh: string;
}

export interface RegisterResponse {
    user: {
        _id: string;
        email: string;
    };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al iniciar sesión");
    }

    return response.json();
}

export async function register(email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al registrar usuario");
    }

    return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await fetch(`${API_URL}/auth/refresh_access_token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al refrescar token");
    }

    return response.json();
}
