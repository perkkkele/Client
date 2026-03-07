import { useState, useRef, useCallback } from 'react';
import { API_URL } from '../api/config';

interface UserCoords {
    lat: number;
    lng: number;
}

// Lazy-load expo-location to avoid crash when native module is not yet available
// (requires a new dev client build after installing expo-location)
let Location: typeof import('expo-location') | null = null;
try {
    Location = require('expo-location');
} catch (e) {
    console.warn('[useUserLocation] expo-location not available (needs native rebuild)');
}

/**
 * Hook for GPS-on-demand location with smart caching.
 * 
 * - Only requests GPS when the user activates proximity features
 * - Caches location in memory for the session
 * - Silently saves location to backend for habitual detection
 * - Gracefully degrades if expo-location native module is not available
 */
export function useUserLocation(token: string | null) {
    const [loading, setLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [moduleUnavailable, setModuleUnavailable] = useState(!Location);
    const cachedLocation = useRef<UserCoords | null>(null);

    /**
     * Request GPS location. Returns cached if available.
     * Shows permission dialog on first call.
     */
    const requestLocation = useCallback(async (): Promise<UserCoords | null> => {
        // If expo-location is not available, return null gracefully
        if (!Location) {
            setModuleUnavailable(true);
            console.warn('[useUserLocation] expo-location module not available');
            return null;
        }

        // Return cached immediately if available
        if (cachedLocation.current) {
            return cachedLocation.current;
        }

        setLoading(true);
        try {
            // Check/request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionDenied(true);
                setLoading(false);
                return null;
            }

            setPermissionDenied(false);

            // Get current position
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords: UserCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Cache for the session
            cachedLocation.current = coords;

            // Silently save to backend (fire-and-forget)
            if (token) {
                fetch(`${API_URL}/user/location`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(coords),
                }).catch(err => console.log('[useUserLocation] Silent save error:', err));
            }

            return coords;
        } catch (error) {
            console.error('[useUserLocation] Error getting location:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [token]);

    /**
     * Clear cached location (e.g., on logout)
     */
    const clearCache = useCallback(() => {
        cachedLocation.current = null;
    }, []);

    return {
        requestLocation,
        clearCache,
        loading,
        permissionDenied,
        moduleUnavailable,
        hasCache: cachedLocation.current !== null,
    };
}
