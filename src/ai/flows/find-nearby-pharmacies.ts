'use server';

/**
 * @fileOverview A flow to find nearby pharmacies using the MapmyIndia API.
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


const findNearbyPharmaciesFlow = ai.defineFlow(
    {
        name: 'findNearbyPharmaciesFlow',
        inputSchema: FindNearbyPharmaciesInputSchema,
        outputSchema: FindNearbyPharmaciesOutputSchema,
    },
    async (input) => {
        const apiKey = process.env.MAPMYINDIA_API_KEY;
        if (!apiKey) {
            throw new Error('MapmyIndia API key is not configured.');
        }

        const url = `https://atlas.mappls.com/api/places/nearby/json?keywords=pharmacy&refLocation=${input.latitude},${input.longitude}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
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
