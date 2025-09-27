'use server';

/**
 * @fileOverview A flow to find nearby pharmacies using the MapmyIndia Atlas API.
 * 
 * - findNearbyPharmacies - A function that fetches pharmacy data.
 * - FindNearbyPharmaciesInput - The input type for the findNearbyPharmacies function.
 * - FindNearbyPharmaciesOutput - The return type for the findNearbyPharmacies function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

const FindNearbyPharmaciesInputSchema = z.object({
    latitude: z.number().describe('The latitude of the user\'s location.'),
    longitude: z.number().describe('The longitude of the user\'s location.'),
});
export type FindNearbyPharmaciesInput = z.infer<typeof FindNearbyPharmaciesInputSchema>;

const PharmacySchema = z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    distance: z.number().optional(),
    coords: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
});

const FindNearbyPharmaciesOutputSchema = z.object({
    pharmacies: z.array(PharmacySchema),
});
export type FindNearbyPharmaciesOutput = z.infer<typeof FindNearbyPharmaciesOutputSchema>;


export async function findNearbyPharmacies(input: FindNearbyPharmaciesInput): Promise<FindNearbyPharmaciesOutput> {
  return findNearbyPharmaciesFlow(input);
}

// Function to get the access token
async function getMapmyIndiaToken(): Promise<string> {
    const clientId = process.env.MAPMYINDIA_CLIENT_ID;
    const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;
    const apiKey = process.env.MAPMYINDIA_API_KEY;

    if (!clientId || !clientSecret || !apiKey) {
        throw new Error('MapmyIndia credentials are not fully configured.');
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


const findNearbyPharmaciesFlow = ai.defineFlow(
    {
        name: 'findNearbyPharmaciesFlow',
        inputSchema: FindNearbyPharmaciesInputSchema,
        outputSchema: FindNearbyPharmaciesOutputSchema,
    },
    async (input) => {
        
        try {
            const accessToken = await getMapmyIndiaToken();
            const url = `https://atlas.mappls.com/api/places/nearby/json?keywords=pharmacy&refLocation=${input.latitude},${input.longitude}`;

            const response = await fetch(url, {
                method: 'GET', // Correct method is GET for this endpoint
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
            
            const pharmacies = (data.suggestedLocations || []).map((location: any) => ({
                id: location.eLoc,
                name: location.placeName,
                address: location.placeAddress,
                distance: location.distance,
                coords: {
                    lat: location.latitude,
                    lng: location.longitude,
                }
            }));

            return { pharmacies };
        } catch (error: any) {
            console.error('Failed to fetch from MapmyIndia API:', error);
            throw new Error('Could not fetch nearby pharmacies. ' + error.message);
        }
    }
);
