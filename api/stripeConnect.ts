/**
 * Stripe Connect API Client
 * 
 * API functions for managing Stripe Connect accounts for professionals.
 */

import { API_URL } from './config';
import { Linking } from 'react-native';

// Types

export interface ConnectStatus {
    connected: boolean;
    accountId?: string;
    onboarded: boolean;
    detailsSubmitted?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    requirements?: {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue: string[];
        pendingVerification: string[];
    };
}

export interface ConnectBalance {
    pending: number;      // Céntimos pendientes
    available: number;    // Céntimos disponibles
    currency: string;
}

export interface Payout {
    id: string;
    amount: number;       // Céntimos
    currency: string;
    status: string;
    arrivalDate: string;
    createdAt: string;
}

export interface FeeBreakdown {
    total: number;
    platformFee: number;
    platformFeePercentage: number;
    professionalAmount: number;
}

// API Functions

/**
 * Start the Stripe Connect onboarding process
 * Returns a URL to redirect the professional to Stripe's onboarding
 */
export async function startOnboarding(token: string): Promise<{ onboardingUrl: string; accountId: string }> {
    const response = await fetch(`${API_URL}/connect/onboard`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error iniciando onboarding');
    }

    const data = await response.json();
    return {
        onboardingUrl: data.onboardingUrl,
        accountId: data.accountId,
    };
}

/**
 * Open the Stripe onboarding page in the browser
 */
export async function openOnboarding(token: string): Promise<boolean> {
    try {
        const { onboardingUrl } = await startOnboarding(token);

        const canOpen = await Linking.canOpenURL(onboardingUrl);
        if (canOpen) {
            await Linking.openURL(onboardingUrl);
            return true;
        } else {
            console.error('[StripeConnect] Cannot open URL:', onboardingUrl);
            return false;
        }
    } catch (error) {
        console.error('[StripeConnect] Error opening onboarding:', error);
        throw error;
    }
}

/**
 * Get the current status of the professional's connected account
 */
export async function getConnectStatus(token: string): Promise<ConnectStatus> {
    const response = await fetch(`${API_URL}/connect/status`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo estado de cuenta');
    }

    return response.json();
}

/**
 * Get a link to the Stripe Express dashboard
 */
export async function getLoginLink(token: string): Promise<string> {
    const response = await fetch(`${API_URL}/connect/login-link`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo enlace al dashboard');
    }

    const data = await response.json();
    return data.dashboardUrl;
}

/**
 * Open the Stripe Express dashboard in the browser
 */
export async function openStripeDashboard(token: string): Promise<boolean> {
    try {
        const url = await getLoginLink(token);

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
            return true;
        } else {
            console.error('[StripeConnect] Cannot open URL:', url);
            return false;
        }
    } catch (error) {
        console.error('[StripeConnect] Error opening dashboard:', error);
        throw error;
    }
}

/**
 * Get the balance of the connected account
 */
export async function getBalance(token: string): Promise<ConnectBalance> {
    const response = await fetch(`${API_URL}/connect/balance`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo balance');
    }

    const data = await response.json();
    return data.balance;
}

/**
 * Get recent payouts
 */
export async function getPayouts(token: string, limit: number = 10): Promise<Payout[]> {
    const response = await fetch(`${API_URL}/connect/payouts?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo transferencias');
    }

    const data = await response.json();
    return data.payouts;
}

/**
 * Get fee breakdown for a specific amount
 */
export async function getFeePreview(token: string, amountInCents: number): Promise<FeeBreakdown> {
    const response = await fetch(`${API_URL}/connect/fee-preview?amount=${amountInCents}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error calculando comisión');
    }

    const data = await response.json();
    return data.breakdown;
}

/**
 * Format cents to display price
 */
export function formatCents(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;
    switch (currency.toUpperCase()) {
        case 'EUR':
            return `${amount.toFixed(2).replace('.', ',')} €`;
        case 'USD':
            return `$${amount.toFixed(2)}`;
        default:
            return `${amount.toFixed(2)} ${currency}`;
    }
}

export default {
    startOnboarding,
    openOnboarding,
    getConnectStatus,
    getLoginLink,
    openStripeDashboard,
    getBalance,
    getPayouts,
    getFeePreview,
    formatCents,
};
