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

const findPharmaciesPrompt = ai.definePrompt({
    name: 'findNearbyPharmaciesPrompt',
    input: { schema: FindNearbyPharmaciesInputSchema },
    output: { schema: FindNearbyPharmaciesOutputSchema },
    prompt: `You are a helpful local guide. A user is looking for pharmacies near their location.
    
    Their current location is latitude: {{latitude}} and longitude: {{longitude}}.

    Please find a list of 10 nearby pharmacies. For each pharmacy, provide a unique ID, its name, full address, and its precise latitude and longitude coordinates.
    
    Return the data strictly in the required JSON format.
    `,
});

const findNearbyPharmaciesFlow = ai.defineFlow(
    {
        name: 'findNearbyPharmaciesFlow',
        inputSchema: FindNearbyPharmaciesInputSchema,
        outputSchema: FindNearbyPharmaciesOutputSchema,
    },
    async (input) => {
        try {
            // Use Gemini to generate the pharmacy list
            const { output } = await findPharmaciesPrompt(input);

            if (!output || !output.pharmacies) {
                throw new Error('AI failed to generate pharmacy data.');
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
