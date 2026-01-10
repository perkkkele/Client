/**
 * useSubscription Hook
 * 
 * Provides subscription status and feature access control throughout the app.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { subscriptionApi } from "../api";
import type { SubscriptionStatus, PlanFeatures } from "../api/subscription";

// Feature names that can be checked
export type FeatureName = keyof PlanFeatures;

// Plan hierarchy for upgrade prompts
const PLAN_HIERARCHY = ["starter", "professional", "premium"] as const;

interface UseSubscriptionReturn {
    // Current subscription status
    status: SubscriptionStatus | null;
    loading: boolean;
    error: string | null;

    // Current plan info
    plan: "starter" | "professional" | "premium";
    planName: string;

    // Minute usage
    minutesUsed: number;
    minutesIncluded: number;
    minutesRemaining: number;
    extraMinutesUsed: number;

    // Verification badges
    isIdentityVerified: boolean;
    isProfessionalVerified: boolean;

    // Feature access check
    canAccess: (feature: FeatureName) => boolean;

    // Returns the required plan if feature is locked, null if accessible
    getRequiredPlan: (feature: FeatureName) => "professional" | "premium" | null;

    // Check if user can use more minutes
    canUseMinutes: boolean;

    // Refresh subscription data
    refresh: () => Promise<void>;
}

const DEFAULT_STATUS: SubscriptionStatus = {
    plan: "starter",
    planName: "Starter",
    status: "active",
    minutesIncluded: 10,
    minutesUsed: 0,
    minutesRemaining: 10,
    extraMinutesUsed: 0,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    features: {
        directoryListing: true,
        catalogAvatar: true,
        customAvatar: false,
        escalation: true,
        appointments: false,
        videoAppointments: false,
        integratedPayments: false,
        widget: false,
        qrCode: false,
        analytics: false,
        calendarSync: false,
        searchPriority: false,
    },
    verification: {
        identityVerified: false,
        professionalVerified: false,
    },
};

export function useSubscription(): UseSubscriptionReturn {
    const { token, user } = useAuth();
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await subscriptionApi.getSubscriptionStatus(token);
            setStatus(data);
            setError(null);
        } catch (err: any) {
            console.error("[useSubscription] Error fetching status:", err);
            setError(err.message);
            // Fall back to default starter status
            setStatus(DEFAULT_STATUS);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Refresh when user changes
    useEffect(() => {
        if (user?.subscription) {
            fetchStatus();
        }
    }, [user?.subscription?.plan, fetchStatus]);

    const currentStatus = status || DEFAULT_STATUS;

    const canAccess = useCallback(
        (feature: FeatureName): boolean => {
            return currentStatus.features[feature] || false;
        },
        [currentStatus]
    );

    const getRequiredPlan = useCallback(
        (feature: FeatureName): "professional" | "premium" | null => {
            if (canAccess(feature)) {
                return null;
            }

            // Find the minimum plan that includes this feature
            const FEATURE_REQUIREMENTS: Partial<Record<FeatureName, "professional" | "premium">> = {
                appointments: "professional",
                integratedPayments: "professional",
                widget: "professional",
                qrCode: "professional",
                analytics: "professional",
                videoAppointments: "premium",
                customAvatar: "premium",
                calendarSync: "premium",
                searchPriority: "premium",
            };

            return FEATURE_REQUIREMENTS[feature] || null;
        },
        [canAccess]
    );

    return {
        status,
        loading,
        error,
        plan: currentStatus.plan,
        planName: currentStatus.planName,
        minutesUsed: currentStatus.minutesUsed,
        minutesIncluded: currentStatus.minutesIncluded,
        minutesRemaining: currentStatus.minutesRemaining,
        extraMinutesUsed: currentStatus.extraMinutesUsed,
        isIdentityVerified: currentStatus.verification.identityVerified,
        isProfessionalVerified: currentStatus.verification.professionalVerified,
        canAccess,
        getRequiredPlan,
        canUseMinutes: currentStatus.status === "active",
        refresh: fetchStatus,
    };
}

export default useSubscription;
