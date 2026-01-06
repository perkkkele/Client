import { API_URL } from "./config";

const CALENDAR_API_URL = `${API_URL}/calendar`;

/**
 * Get calendar connection status
 */
export async function getCalendarStatus(token: string): Promise<{
    connected: boolean;
    provider: "google" | "outlook" | null;
    lastSync: string | null;
}> {
    const response = await fetch(`${CALENDAR_API_URL}/status`, {
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
    const response = await fetch(`${CALENDAR_API_URL}/google/auth`, {
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
    const response = await fetch(`${CALENDAR_API_URL}/outlook/auth`, {
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
    const response = await fetch(`${CALENDAR_API_URL}/disconnect`, {
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
    const response = await fetch(`${CALENDAR_API_URL}/sync`, {
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

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description?: string;
    location?: string;
    source: "google" | "outlook" | "twinpro";
}

/**
 * Get calendar events for a date range
 */
export async function getCalendarEvents(
    token: string,
    startDate: string,
    endDate: string
): Promise<{
    events: CalendarEvent[];
    connected: boolean;
    provider?: "google" | "outlook";
}> {
    const response = await fetch(
        `${CALENDAR_API_URL}/events?startDate=${startDate}&endDate=${endDate}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to get calendar events");
    }

    return response.json();
}
