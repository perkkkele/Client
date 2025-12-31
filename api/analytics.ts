import { API_HOST, API_PORT } from "./config";

const BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

export type AnalyticsEventType = "profileView" | "conversationStart" | "conversationEnd" | "phoneCall";

export interface AnalyticsEventMetadata {
    durationSeconds?: number;
    source?: "app" | "web-widget" | "qr-code" | "direct-link";
    chatId?: string;
}

export interface AnalyticsSummary {
    profileViews: number;
    totalConversationSeconds: number;
    appointmentsBooked: number;
    phoneCalls: number;
}

/**
 * Registrar un evento de analíticas
 */
export async function recordEvent(
    token: string,
    professionalId: string,
    eventType: AnalyticsEventType,
    metadata?: AnalyticsEventMetadata
): Promise<{ eventId?: string }> {
    try {
        const response = await fetch(`${BASE_URL}/analytics/event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                professionalId,
                eventType,
                metadata,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Error recording analytics event:", error);
            return {};
        }

        const data = await response.json();
        return { eventId: data.eventId };
    } catch (error) {
        console.error("Error recording analytics event:", error);
        return {};
    }
}

/**
 * Obtener resumen de analíticas para el profesional actual
 */
export async function getSummary(
    token: string,
    professionalId: string
): Promise<AnalyticsSummary | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/analytics/summary/${professionalId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("Error getting analytics summary:", error);
            return null;
        }

        const result = await response.json();
        return result.data as AnalyticsSummary;
    } catch (error) {
        console.error("Error getting analytics summary:", error);
        return null;
    }
}

/**
 * Formatear duración en segundos a formato legible (ej: "45h 20m")
 */
export function formatDuration(totalSeconds: number): string {
    if (totalSeconds <= 0) return "0m";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes}m`;
    }
}
