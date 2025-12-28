/**
 * Google Places API (New) Service
 * Provides real-time address suggestions using the modern Places API
 * https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PlacePrediction {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    city: string | null;
    country: string | null;
    lat: number;
    lng: number;
}

/**
 * Get address predictions/suggestions as user types
 * Uses the new Places API Autocomplete endpoint
 */
export async function getPlacePredictions(
    input: string,
    sessionToken?: string
): Promise<PlacePrediction[]> {
    if (!input || input.trim().length < 3) {
        return [];
    }

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        return [];
    }

    try {
        const response = await fetch(
            'https://places.googleapis.com/v1/places:autocomplete',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                },
                body: JSON.stringify({
                    input: input.trim(),
                    languageCode: 'es',
                    includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'point_of_interest'],
                    ...(sessionToken && { sessionToken }),
                }),
            }
        );

        const data = await response.json();

        console.log('Places Autocomplete response:', JSON.stringify(data).substring(0, 500));

        if (data.suggestions) {
            return data.suggestions
                .filter((s: any) => s.placePrediction)
                .map((s: any) => ({
                    placeId: s.placePrediction.placeId,
                    description: s.placePrediction.text?.text || '',
                    mainText: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text || '',
                    secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
                }));
        }

        if (data.error) {
            console.error('Places API error:', data.error);
        }

        return [];
    } catch (error) {
        console.error('Places autocomplete error:', error);
        return [];
    }
}

/**
 * Get full details for a selected place
 * Uses the new Places API Place Details endpoint
 */
export async function getPlaceDetails(
    placeId: string,
    sessionToken?: string
): Promise<PlaceDetails | null> {
    if (!placeId) {
        return null;
    }

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured');
        return null;
    }

    try {
        // The new API uses the place ID in the URL path
        const url = `https://places.googleapis.com/v1/places/${placeId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
            },
        });

        const data = await response.json();

        console.log('Place Details response:', JSON.stringify(data).substring(0, 800));

        if (data.error) {
            console.error('Place Details API error:', data.error);
            return null;
        }

        if (data.location) {
            // Extract city and country from address components
            let city: string | null = null;
            let country: string | null = null;

            if (data.addressComponents) {
                for (const component of data.addressComponents) {
                    const types = component.types || [];
                    if (types.includes('locality')) {
                        city = component.longText;
                    } else if (types.includes('administrative_area_level_2') && !city) {
                        city = component.longText;
                    } else if (types.includes('administrative_area_level_1') && !city) {
                        city = component.longText;
                    }
                    if (types.includes('country')) {
                        country = component.longText;
                    }
                }
            }

            console.log('Extracted location data:', {
                formattedAddress: data.formattedAddress,
                city,
                country,
                lat: data.location.latitude,
                lng: data.location.longitude,
            });

            return {
                placeId,
                formattedAddress: data.formattedAddress || data.displayName?.text || '',
                city,
                country,
                lat: data.location.latitude,
                lng: data.location.longitude,
            };
        }

        return null;
    } catch (error) {
        console.error('Place details error:', error);
        return null;
    }
}

/**
 * Generate a unique session token for autocomplete billing optimization
 */
export function generateSessionToken(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

