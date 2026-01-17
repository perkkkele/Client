import { API_URL } from "./config";

export interface Notification {
    _id: string;
    type: "escalation" | "appointment" | "review" | "earnings" | "billing" | "system";
    subType: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority: "high" | "medium" | "low";
    isRead: boolean;
    createdAt: string;
}

export interface NotificationPreferences {
    escalations: boolean;
    appointments: boolean;
    reviews: boolean;
    earnings: boolean;
    billing: boolean;
    system: boolean;
}

/**
 * Obtener notificaciones del profesional
 */
export async function getNotifications(
    token: string,
    professionalId: string,
    page: number = 1,
    limit: number = 20,
    type?: string
): Promise<{ notifications: Notification[]; total: number } | null> {
    try {
        let url = `${API_URL}/notifications/${professionalId}?page=${page}&limit=${limit}`;
        if (type) url += `&type=${type}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Error fetching notifications");
            return null;
        }

        const result = await response.json();
        return {
            notifications: result.data.notifications,
            total: result.data.pagination.total,
        };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return null;
    }
}

/**
 * Obtener conteo de notificaciones no leídas
 */
export async function getUnreadCount(
    token: string,
    professionalId: string
): Promise<number> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${professionalId}/unread-count`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) return 0;

        const result = await response.json();
        return result.data.count;
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return 0;
    }
}

/**
 * Marcar notificación como leída
 */
export async function markAsRead(
    token: string,
    notificationId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${notificationId}/read`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.ok;
    } catch (error) {
        console.error("Error marking as read:", error);
        return false;
    }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(
    token: string,
    professionalId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${professionalId}/read-all`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.ok;
    } catch (error) {
        console.error("Error marking all as read:", error);
        return false;
    }
}

/**
 * Obtener preferencias de notificación
 */
export async function getPreferences(
    token: string,
    professionalId: string
): Promise<NotificationPreferences | null> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${professionalId}/preferences`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) return null;

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return null;
    }
}

/**
 * Actualizar preferencias de notificación
 */
export async function updatePreferences(
    token: string,
    professionalId: string,
    preferences: Partial<NotificationPreferences>
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${professionalId}/preferences`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(preferences),
            }
        );
        return response.ok;
    } catch (error) {
        console.error("Error updating preferences:", error);
        return false;
    }
}

/**
 * Eliminar una notificación
 */
export async function deleteNotification(
    token: string,
    notificationId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${notificationId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.ok;
    } catch (error) {
        console.error("Error deleting notification:", error);
        return false;
    }
}

export const notificationsApi = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getPreferences,
    updatePreferences,
    deleteNotification,
};
