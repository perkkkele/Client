/**
 * Google Geocoding API Service
 * Validates addresses and returns coordinates (lat/lng)
 */

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GeocodingResult {
    address: string;          // Formatted address
    city: string | null;      // City name
    country: string | null;   // Country name
    lat: number;              // Latitude
    lng: number;              // Longitude
    placeId: string;          // Google Place ID
}

export interface GeocodingResponse {
    success: boolean;
    result?: GeocodingResult;
    error?: string;
}

/**
 * Geocode an address string to get coordinates and validated address
 * @param address - The address string to geocode
 * @returns GeocodingResponse with result or error
 */
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
    if (!address || address.trim().length === 0) {
        return { success: false, error: 'Dirección vacía' };
    }

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        return { success: false, error: 'API key no configurada' };
    }

    try {
        const encodedAddress = encodeURIComponent(address.trim());
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}&language=es`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const location = result.geometry.location;

            // Extract city and country from address components
            let city: string | null = null;
            let country: string | null = null;

            for (const component of result.address_components) {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('administrative_area_level_2') && !city) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            }

            return {
                success: true,
                result: {
                    address: result.formatted_address,
                    city,
                    country,
                    lat: location.lat,
                    lng: location.lng,
                    placeId: result.place_id,
                }
            };
        } else if (data.status === 'ZERO_RESULTS') {
            return { success: false, error: 'No se encontró la dirección. Por favor, verifica e intenta de nuevo.' };
        } else if (data.status === 'REQUEST_DENIED') {
            console.error('Geocoding API request denied:', data.error_message);
            return { success: false, error: 'Error de configuración de API' };
        } else {
            console.error('Geocoding API error:', data.status, data.error_message);
            return { success: false, error: `Error de geocodificación: ${data.status}` };
        }
    } catch (error: any) {
        console.error('Geocoding fetch error:', error);
        return { success: false, error: 'Error de conexión al validar la dirección' };
    }
}

/**
 * Reverse geocode coordinates to get an address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns GeocodingResponse with result or error
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResponse> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        return { success: false, error: 'API key no configurada' };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];

            let city: string | null = null;
            let country: string | null = null;

            for (const component of result.address_components) {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            }

            return {
                success: true,
                result: {
                    address: result.formatted_address,
                    city,
                    country,
                    lat,
                    lng,
                    placeId: result.place_id,
                }
            };
        } else {
            return { success: false, error: 'No se encontró la ubicación' };
        }
    } catch (error: any) {
        console.error('Reverse geocoding error:', error);
        return { success: false, error: 'Error de conexión' };
    }
}
