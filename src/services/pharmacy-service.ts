import type { Pharmacy } from '@/lib/types';
import fetch from 'node-fetch';

// Function to get the access token from MapmyIndia
async function getMapmyIndiaToken(): Promise<string> {
    const clientId = process.env.MAPMYINDIA_CLIENT_ID;
    const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('MapmyIndia client credentials are not fully configured.');
    }

    const tokenUrl = 'https://outpost.mappls.com/api/security/oauth/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('MapmyIndia Token API Error:', errorBody);
        throw new Error(`Failed to get MapmyIndia token with status ${response.status}`);
    }

    const data: any = await response.json();
    return data.access_token;
}

/**
 * Fetches nearby pharmacies from the MapmyIndia API and transforms the data
 * into the application's Pharmacy format.
 * @param latitude - The user's latitude.
 * @param longitude - The user's longitude.
 * @returns A promise that resolves to an array of Pharmacy objects.
 */
export async function fetchAndFormatPharmacies(latitude: number, longitude: number): Promise<Omit<Pharmacy, 'id'>[]> {
    try {
        const accessToken = await getMapmyIndiaToken();
        const url = `https://atlas.mappls.com/api/places/nearby/json?keywords=pharmacy&refLocation=${latitude},${longitude}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('MapmyIndia API Error:', errorBody);
            throw new Error(`MapmyIndia API request failed with status ${response.status}`);
        }

        const data: any = await response.json();
        
        // This is the critical part: correctly map the fields from the API response.
        // The API returns 'lat' and 'lng' for coordinates.
        const pharmacies = (data.suggestedLocations || []).map((location: any) => ({
            id: location.eLoc, // This will be used as the key in Firebase
            name: location.placeName,
            address: location.placeAddress,
            distance: location.distance,
            coords: {
                lat: location.lat, // Correct field is 'lat'
                lng: location.lng, // Correct field is 'lng'
            }
        }));

        return pharmacies;

    } catch (error: any) {
        console.error('Failed to fetch and format from MapmyIndia API:', error);
        // Re-throw the error to be handled by the calling flow
        throw error;
    }
}
