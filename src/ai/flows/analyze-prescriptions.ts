'use server';

/**
 * @fileOverview Prescription analysis flow using generative AI to extract medicine details and check for drug interactions.
 *
 * - analyzePrescription - A function that handles the prescription analysis process.
 * - AnalyzePrescriptionInput - The input type for the analyzePrescription function.
 * - AnalyzePrescriptionOutput - The return type for the analyzePrescription function.
 */

import {ai} from '@/ai/genkit';
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

const analyzePrescriptionPrompt = ai.definePrompt({
  name: 'analyzePrescriptionPrompt',
  input: {schema: AnalyzePrescriptionInputSchema},
  output: {schema: AnalyzePrescriptionOutputSchema},
  prompt: `You are a pharmacist analyzing a prescription.

  Extract the medicines, their dosages, frequencies, and routes of administration from the prescription photo.

  Also, check for potential drug interactions based on the extracted medicines.  If there are no interactions, return an empty array.
  Photo: {{media url=prescriptionDataUri}}
  `,
});

const analyzePrescriptionFlow = ai.defineFlow(
  {
    name: 'analyzePrescriptionFlow',
    inputSchema: AnalyzePrescriptionInputSchema,
    outputSchema: AnalyzePrescriptionOutputSchema,
  },
  async input => {
    const {output} = await analyzePrescriptionPrompt(input);
    return output!;
  }
);
