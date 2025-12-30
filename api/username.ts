import { API_URL } from './config';

export interface UsernameProfile {
    userId: string;
    publicName: string;
    profession?: string;
    category?: string;
    avatar?: string;
    twinActive: boolean;
}

export interface UsernameAvailability {
    available: boolean;
    reason?: string | null;
}

export interface UsernameUpdateResult {
    success: boolean;
    username: string;
    qrUrl: string;
}

/**
 * Get professional by username
 * Used when opening QR code link
 */
export async function getByUsername(username: string): Promise<UsernameProfile> {
    const response = await fetch(`${API_URL}/username/${username}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Professional not found');
    }

    return response.json();
}

/**
 * Check if username is available
 */
export async function checkAvailability(username: string): Promise<UsernameAvailability> {
    const response = await fetch(`${API_URL}/username/available/${username}`);

    if (!response.ok) {
        throw new Error('Error checking availability');
    }

    return response.json();
}

/**
 * Set or update username (requires auth)
 */
export async function updateUsername(
    token: string,
    username: string
): Promise<UsernameUpdateResult> {
    const response = await fetch(`${API_URL}/username`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating username');
    }

    return response.json();
}

export default {
    getByUsername,
    checkAvailability,
    updateUsername,
};
