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
        const errorData = await response.json();
        // Create error with code and reason for suspension handling
        const error: any = new Error(errorData.message || "Error al iniciar sesión");
        error.code = errorData.code;
        error.reason = errorData.reason;
        throw error;
    }

    return response.json();
}

export async function register(
    email: string,
    password: string,
    userType: 'user' | 'userpro' = 'user',
    acceptAnalytics: boolean = false
): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userType, acceptAnalytics }),
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

export async function loginWithGoogle(
    idToken: string,
    userType?: 'user' | 'userpro'
): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken, userType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // Create error with code and reason for suspension handling
        const error: any = new Error(errorData.message || "Error al iniciar sesión con Google");
        error.code = errorData.code;
        error.reason = errorData.reason;
        throw error;
    }

    return response.json();
}

export async function changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cambiar la contraseña");
    }

    return response.json();
}
