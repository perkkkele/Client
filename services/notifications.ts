import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '../api/config';

// Try to import Device - it may not be available in Expo Go
let Device: any = null;
try {
    Device = require('expo-device');
} catch (e) {
    console.log('[Notifications] expo-device not available (Expo Go mode)');
}

// Configure how notifications are handled when the app is in foreground
// Only set handler if notifications module is fully available
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (e) {
    console.log('[Notifications] Could not set notification handler');
}

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string | null>} - The Expo push token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
    // Skip if running in Expo Go or web
    if (!Device) {
        console.log('[Notifications] Device module not available, skipping push registration');
        return null;
    }

    let token: string | null = null;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('[Notifications] Must use physical device for push notifications');
        return null;
    }

    // Check current permission status
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not already granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return null;
        }

        // Get the Expo push token
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'e8a0fe50-f353-4074-b8e8-d7d966c3e5ea',
        });
        token = pushTokenData.data;
        console.log('[Notifications] Push token:', token);

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#137fec',
            });
        }
    } catch (error) {
        console.error('[Notifications] Error getting push token:', error);
        return null;
    }

    return token;
}

/**
 * Register the push token with the backend
 * @param {string} authToken - The user's auth token
 * @param {string} pushToken - The Expo push token
 */
export async function registerPushTokenWithServer(
    authToken: string,
    pushToken: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/user/push-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ pushToken }),
        });

        if (!response.ok) {
            console.error('[Notifications] Failed to register push token with server');
            return false;
        }

        console.log('[Notifications] Push token registered with server');
        return true;
    } catch (error) {
        console.error('[Notifications] Error registering push token:', error);
        return false;
    }
}

/**
 * Update notification settings on the server
 * @param {string} authToken - The user's auth token
 * @param {boolean} enabled - Whether notifications are enabled
 */
export async function updateNotificationSettings(
    authToken: string,
    enabled: boolean
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/user/notifications`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ notificationsEnabled: enabled }),
        });

        if (!response.ok) {
            console.error('[Notifications] Failed to update notification settings');
            return false;
        }

        console.log('[Notifications] Notification settings updated:', enabled);
        return true;
    } catch (error) {
        console.error('[Notifications] Error updating notification settings:', error);
        return false;
    }
}

/**
 * Add a listener for notification responses (when user taps notification)
 * @param {Function} callback - Function to call with the notification response
 * @returns {Notifications.EventSubscription} - Subscription to remove when done
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add a listener for incoming notifications (while app is in foreground)
 * @param {Function} callback - Function to call with the notification
 * @returns {Notifications.EventSubscription} - Subscription to remove when done
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Schedule a local notification (for testing)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {number} seconds - Seconds delay before showing
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    seconds: number = 1
): Promise<string> {
    return Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
        },
    });
}

export default {
    registerForPushNotifications,
    registerPushTokenWithServer,
    updateNotificationSettings,
    addNotificationResponseListener,
    addNotificationReceivedListener,
    scheduleLocalNotification,
};
