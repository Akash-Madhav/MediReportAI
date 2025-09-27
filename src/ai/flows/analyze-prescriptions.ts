'use server';

/**
 * @fileOverview Prescription analysis flow using generative AI to extract medicine details and check for drug interactions.
 *
 * - analyzePrescription - A function that handles the prescription analysis process.
 * - AnalyzePrescriptionInput - The input type for the analyzePrescription function.
 * - AnalyzePrescriptionOutput - The return type for the analyzePrescription function.
 */

import {prescriptionAi} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzePrescriptionInputSchema = z.object({
  prescriptionDataUri: z
    .string()
    .describe(
      "A photo of a prescription, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type AnalyzePrescriptionInput = z.infer<typeof AnalyzePrescriptionInputSchema>;

const AnalyzePrescriptionOutputSchema = z.object({
  medicines: z.array(
    z.object({
      name: z.string().describe('Name of the medicine.'),
      dosage: z.string().describe('Dosage of the medicine.'),
      frequency: z.string().describe('Frequency of the medicine.'),
      route: z.string().describe('Route of administration.'),
      reason: z.string().describe('The likely reason or condition this medicine is prescribed for.'),
    })
  ).describe('List of medicines extracted from the prescription.'),
  interactions: z.array(
    z.object({
      drugA: z.string().describe('Name of the first drug.'),
      drugB: z.string().describe('Name of the second drug.'),
      severity: z.enum(['low', 'moderate', 'high']).describe('Severity of the interaction.'),
      message: z.string().describe('Description of the interaction.'),
    })
  ).describe('List of potential drug interactions.'),
});

export type AnalyzePrescriptionOutput = z.infer<typeof AnalyzePrescriptionOutputSchema>;

export async function analyzePrescription(input: AnalyzePrescriptionInput): Promise<AnalyzePrescriptionOutput> {
  return analyzePrescriptionFlow(input);
}

const analyzePrescriptionPrompt = prescriptionAi.definePrompt({
  name: 'analyzePrescriptionPrompt',
  input: {schema: AnalyzePrescriptionInputSchema},
  output: {schema: AnalyzePrescriptionOutputSchema},
  prompt: `You are a pharmacist analyzing a prescription.

  Extract the medicines, their dosages, frequencies, and routes of administration from the prescription photo.
  Based on the medicine, provide the likely reason for its use.

  Also, check for potential drug interactions based on the extracted medicines.  If there are no interactions, return an empty array.
  Photo: {{media url=prescriptionDataUri}}
  `,
});

// Helper function to retry a promise-based function with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a retryable "Service Unavailable" error
      if (error.message && (error.message.includes('Service Unavailable') || error.message.includes('503'))) {
        if (i < retries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      } else {
        // Not a retryable error, throw immediately
        throw error;
      }
    }
  }
  // If all retries fail, throw the last error
  throw lastError;
}

const analyzePrescriptionFlow = prescriptionAi.defineFlow(
  {
    name: 'analyzePrescriptionFlow',
    inputSchema: AnalyzePrescriptionInputSchema,
    outputSchema: AnalyzePrescriptionOutputSchema,
  },
  async input => {
    // This flow now only returns the analysis, it does not save to the database.
    const {output} = await withRetry(() => analyzePrescriptionPrompt(input));
    return output!;
  }
);
