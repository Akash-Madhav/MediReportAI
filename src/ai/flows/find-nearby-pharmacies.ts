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
import { fetchAndFormatPharmacies } from '@/services/pharmacy-service';
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";

const FindNearbyPharmaciesInputSchema = z.object({
    latitude: z.number().describe('The latitude of the user\'s location.'),
    longitude: z.number().describe('The longitude of the user\'s location.'),
    userId: z.string().describe('The ID of the user performing the search.')
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
        try {
            // Use the dedicated service to fetch and format data
            const pharmacies = await fetchAndFormatPharmacies(input.latitude, input.longitude);
            
            // Save the correctly formatted data to the database
            const dbRef = ref(db, `nearby_pharmacies/${input.userId}`);
            await set(dbRef, pharmacies);

            return { pharmacies };

        } catch (error: any) {
            console.error('Error in findNearbyPharmaciesFlow:', error);
            // The service will throw a detailed error, which we pass along.
            throw new Error('Could not fetch nearby pharmacies. ' + error.message);
        }
    }
);
