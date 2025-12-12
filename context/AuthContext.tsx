import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, userApi } from "../api";
import type { User } from "../api/user";

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    async function loadStoredAuth() {
        try {
            const storedToken = await SecureStore.getItemAsync("accessToken");
            const storedRefresh = await SecureStore.getItemAsync("refreshToken");

            if (storedToken) {
                setToken(storedToken);
                setRefreshToken(storedRefresh);

                try {
                    const userData = await userApi.getMe(storedToken);
                    setUser(userData);
                } catch (error) {
                    // Token might be expired, try to refresh
                    if (storedRefresh) {
                        try {
                            const { accessToken: newToken } = await authApi.refreshAccessToken(storedRefresh);
                            await SecureStore.setItemAsync("accessToken", newToken);
                            setToken(newToken);

                            const userData = await userApi.getMe(newToken);
                            setUser(userData);
                        } catch {
                            // Refresh failed, clear everything
                            await clearAuth();
                        }
                    } else {
                        await clearAuth();
                    }
                }
            }
        } catch (error) {
            console.log("Error loading stored auth:", error);
        } finally {
            setLoading(false);
        }
    }

    async function clearAuth() {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        setToken(null);
        setRefreshToken(null);
        setUser(null);
    }

    async function login(email: string, password: string) {
        const response = await authApi.login(email, password);

        await SecureStore.setItemAsync("accessToken", response.accessToken);
        await SecureStore.setItemAsync("refreshToken", response.refresh);

        setToken(response.accessToken);
        setRefreshToken(response.refresh);

        const userData = await userApi.getMe(response.accessToken);
        setUser(userData);
    }

    async function register(email: string, password: string) {
        await authApi.register(email, password);
        // After registration, log in automatically
        await login(email, password);
    }

    async function logout() {
        await clearAuth();
    }

    async function updateUserProfile(updatedUser: User) {
        setUser(updatedUser);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                refreshToken,
                loading,
                login,
                register,
                logout,
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
