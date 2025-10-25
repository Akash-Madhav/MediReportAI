'use server';

/**
 * @fileOverview A flow to find nearby pharmacies using a dedicated service.
 * 
 * - findNearbyPharmacies - A function that fetches pharmacy data.
 * - FindNearbyPharmaciesInput - The input type for the findNearbyPharmacies function.
 * - FindNearbyPharmaciesOutput - The return type for the findNearbyPharmacies function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";

const FindNearbyPharmaciesInputSchema = z.object({
    latitude: z.number().describe('The latitude of the user\'s location.'),
    longitude: z.number().describe('The longitude of the user\'s location.'),
    userId: z.string().describe('The ID of the user performing the search.')
});
export type FindNearbyPharmaciesInput = z.infer<typeof FindNearbyPharmaciesInputSchema>;

const PharmacySchema = z.object({
    id: z.string().describe("A unique identifier for the pharmacy."),
    name: z.string().describe("The name of the pharmacy."),
    address: z.string().describe("The full address of the pharmacy."),
    distance: z.number().optional().describe("The distance in meters from the user's location."),
    coords: z.object({
        lat: z.number().describe("The latitude of the pharmacy."),
        lng: z.number().describe("The longitude of the pharmacy."),
    }),
});

const FindNearbyPharmaciesOutputSchema = z.object({
    pharmacies: z.array(PharmacySchema),
});
export type FindNearbyPharmaciesOutput = z.infer<typeof FindNearbyPharmaciesOutputSchema>;


export async function findNearbyPharmacies(input: FindNearbyPharmaciesInput): Promise<FindNearbyPharmaciesOutput> {
  return findNearbyPharmaciesFlow(input);
}


// This tool simulates a call to a real Places API.
// In a production app, this would use an HTTP client to call the Google Maps Places API.
const getNearbyPharmaciesTool = ai.defineTool(
    {
        name: 'getNearbyPharmacies',
        description: 'Get a list of nearby pharmacies based on latitude and longitude.',
        inputSchema: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }),
        outputSchema: FindNearbyPharmaciesOutputSchema,
    },
    async ({ latitude, longitude }) => {
        console.log(`Simulating search for pharmacies near: ${latitude}, ${longitude}`);
        // In a real implementation, you would call the Google Places API here.
        // For this demo, we return mock data that resembles the API response.
        return {
            pharmacies: [
                { id: 'mock1', name: 'City Central Pharmacy', address: '101 Medical Plaza, Downtown', coords: { lat: latitude + 0.01, lng: longitude - 0.01 }, distance: 1200 },
                { id: 'mock2', name: 'Wellness Drug Store', address: '255 Health St, Suburbia', coords: { lat: latitude - 0.02, lng: longitude + 0.015 }, distance: 2500 },
                { id: 'mock3', name: 'The Corner Apothecary', address: '8 Bleecker St, Old Town', coords: { lat: latitude + 0.005, lng: longitude + 0.005 }, distance: 800 },
            ]
        };
    }
);


const findNearbyPharmaciesFlow = ai.defineFlow(
    {
        name: 'findNearbyPharmaciesFlow',
        inputSchema: FindNearbyPharmaciesInputSchema,
        outputSchema: FindNearbyPharmaciesOutputSchema,
    },
    async (input) => {
        try {
            // Use the structured tool instead of a generic prompt.
            const output = await getNearbyPharmaciesTool(input);

            if (!output || !output.pharmacies) {
                throw new Error('Pharmacy tool failed to return data.');
            }
            
            // Save the correctly formatted data to the database
            const dbRef = ref(db, `nearby_pharmacies/${input.userId}`);
            // Use a format that works well with Firebase RTDB (object with keys)
            const pharmaciesToSave = output.pharmacies.reduce((acc: any, pharmacy) => {
                acc[pharmacy.id] = {
                    name: pharmacy.name,
                    address: pharmacy.address,
                    distance: pharmacy.distance,
                    coords: pharmacy.coords,
                };
                return acc;
            }, {});

            await set(dbRef, pharmaciesToSave);

            return output;

        } catch (error: any) {
            console.error('Error in findNearbyPharmaciesFlow:', error);
            // The service will throw a detailed error, which we pass along.
            throw new Error('Could not fetch nearby pharmacies. ' + error.message);
        }
    }
);
