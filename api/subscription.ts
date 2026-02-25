/**
 * Subscription API Client
 * 
 * Client-side API for subscription management
 */

import { API_URL } from "./config";

// Types
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    minutesIncluded: number;
    features: PlanFeatures;
}

export interface PlanFeatures {
    directoryListing: boolean;
    catalogAvatar: boolean;
    customAvatar: boolean;
    escalation: boolean;
    appointments: boolean;
    videoAppointments: boolean;
    integratedPayments: boolean;
    widget: boolean;
    qrCode: boolean;
    analytics: boolean;
    advancedReports: boolean;
    calendarSync: boolean;
    searchPriority: boolean;
}

export interface SubscriptionStatus {
    plan: 'starter' | 'professional' | 'premium';
    planName: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
    minutesIncluded: number;
    minutesUsed: number;
    minutesRemaining: number;
    extraMinutesUsed: number;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    features: PlanFeatures;
    verification: {
        identityVerified: boolean;
        professionalVerified: boolean;
    };
}

export interface UsageStats {
    minutesUsed: number;
    minutesIncluded: number;
    extraMinutesUsed: number;
    extraMinuteCost: number;
    minutesResetDate: string | null;
}

export interface CheckoutSession {
    sessionId: string;
    url: string;
}

export interface PlansResponse {
    plans: SubscriptionPlan[];
    extraMinuteCost: number;
}

export interface ProfessionalVerificationData {
    declarationAccepted: boolean;
    licenseNumber?: string;
    additionalInfo?: string;
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
    const response = await fetch(`${API_URL}/subscription/status`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error getting subscription status");
    }

    return response.json();
}

/**
 * Get all available plans
 */
export async function getPlans(): Promise<PlansResponse> {
    const response = await fetch(`${API_URL}/subscription/plans`, {
        method: "GET",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error getting plans");
    }

    return response.json();
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
    token: string,
    planId: 'professional' | 'premium',
    successUrl?: string,
    cancelUrl?: string
): Promise<CheckoutSession> {
    const response = await fetch(`${API_URL}/subscription/checkout`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            planId,
            successUrl,
            cancelUrl,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating checkout session");
    }

    return response.json();
}

/**
 * Upgrade or downgrade subscription
 */
export async function upgradeSubscription(
    token: string,
    planId: 'professional' | 'premium'
): Promise<{ success: boolean; previousPlan: string; newPlan: string; isUpgrade: boolean }> {
    const response = await fetch(`${API_URL}/subscription/upgrade`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
        const error = await response.json();
        // Check if we should use checkout instead
        if (error.useCheckout) {
            throw new Error('USE_CHECKOUT');
        }
        throw new Error(error.message || "Error upgrading subscription");
    }

    return response.json();
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(token: string): Promise<{ success: boolean; cancelAt?: string }> {
    const response = await fetch(`${API_URL}/subscription/cancel`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error canceling subscription");
    }

    return response.json();
}

/**
 * Get minute usage statistics
 */
export async function getUsage(token: string): Promise<UsageStats> {
    const response = await fetch(`${API_URL}/subscription/usage`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error getting usage");
    }

    return response.json();
}

/**
 * Submit professional verification
 */
export async function submitProfessionalVerification(
    token: string,
    data: ProfessionalVerificationData
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/subscription/verify-professional`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error submitting verification");
    }

    return response.json();
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
    token: string,
    featureName: string
): Promise<{
    feature: string;
    hasAccess: boolean;
    currentPlan: string;
    requiredPlan: string | null;
}> {
    const response = await fetch(`${API_URL}/subscription/feature/${featureName}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error checking feature access");
    }

    return response.json();
}
