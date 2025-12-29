import { API_URL } from './config';
import { Linking } from 'react-native';

export interface PaymentSession {
    sessionId: string;
    url: string;
}

export interface PaymentRecord {
    _id: string;
    date: string;
    time: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    paidAt?: string;
    refundedAt?: string;
    professional: {
        _id: string;
        firstname: string;
        lastname: string;
        publicName?: string;
        avatar?: string;
        profession?: string;
    };
    client: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
        email: string;
    };
    serviceType: string;
    type: 'presencial' | 'videoconference';
}

/**
 * Create a Stripe Checkout session for an appointment
 * @param token - Auth token
 * @param appointmentId - The appointment ID to pay for
 * @returns Checkout session with URL to redirect to
 */
export async function createCheckoutSession(
    token: string,
    appointmentId: string
): Promise<PaymentSession> {
    const response = await fetch(`${API_URL}/payment/checkout/${appointmentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
}

/**
 * Open the Stripe Checkout page in the browser
 * @param token - Auth token  
 * @param appointmentId - The appointment ID to pay for
 */
export async function initiatePayment(
    token: string,
    appointmentId: string
): Promise<boolean> {
    try {
        const session = await createCheckoutSession(token, appointmentId);

        // Open the Stripe Checkout URL in the browser
        const canOpen = await Linking.canOpenURL(session.url);
        if (canOpen) {
            await Linking.openURL(session.url);
            return true;
        } else {
            console.error('[Payment] Cannot open URL:', session.url);
            return false;
        }
    } catch (error) {
        console.error('[Payment] Error initiating payment:', error);
        throw error;
    }
}

/**
 * Get payment history for the current user
 * @param token - Auth token
 * @param role - 'client' or 'professional'
 * @returns Array of payment records
 */
export async function getPaymentHistory(
    token: string,
    role: 'client' | 'professional' = 'client'
): Promise<PaymentRecord[]> {
    const response = await fetch(`${API_URL}/payment/history?role=${role}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get payment history');
    }

    return response.json();
}

/**
 * Request a refund for an appointment
 * @param token - Auth token
 * @param appointmentId - The appointment ID to refund
 */
export async function requestRefund(
    token: string,
    appointmentId: string
): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/payment/refund/${appointmentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process refund');
    }

    return response.json();
}

/**
 * Format price in cents to display format
 * @param cents - Amount in cents
 * @param currency - Currency code (default: EUR)
 * @returns Formatted price string (e.g., "50€")
 */
export function formatPrice(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;

    switch (currency.toUpperCase()) {
        case 'EUR':
            return `${amount.toFixed(0)}€`;
        case 'USD':
            return `$${amount.toFixed(2)}`;
        case 'GBP':
            return `£${amount.toFixed(2)}`;
        default:
            return `${amount.toFixed(2)} ${currency}`;
    }
}

export default {
    createCheckoutSession,
    initiatePayment,
    getPaymentHistory,
    requestRefund,
    formatPrice,
};
