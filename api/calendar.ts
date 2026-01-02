import { API_HOST, API_PORT } from "./index";

const API_URL = `http://${API_HOST}:${API_PORT}/api/calendar`;

/**
 * Get calendar connection status
 */
export async function getCalendarStatus(token: string): Promise<{
    connected: boolean;
    provider: "google" | "outlook" | null;
    lastSync: string | null;
}> {
    const response = await fetch(`${API_URL}/status`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get calendar status");
    }

    return response.json();
}

/**
 * Get Google Calendar auth URL
 */
export async function getGoogleAuthUrl(token: string): Promise<{ url: string }> {
    const response = await fetch(`${API_URL}/google/auth`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get Google auth URL");
    }

    return response.json();
}

/**
 * Get Outlook Calendar auth URL
 */
export async function getOutlookAuthUrl(token: string): Promise<{ url: string }> {
    const response = await fetch(`${API_URL}/outlook/auth`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get Outlook auth URL");
    }

    return response.json();
}

/**
 * Disconnect calendar
 */
export async function disconnectCalendar(token: string): Promise<void> {
    const response = await fetch(`${API_URL}/disconnect`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to disconnect calendar");
    }
}

/**
 * Sync calendar manually
 */
export async function syncCalendar(token: string): Promise<{ lastSync: string }> {
    const response = await fetch(`${API_URL}/sync`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to sync calendar");
    }

    return response.json();
}
