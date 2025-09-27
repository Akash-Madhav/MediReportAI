'use server';

/**
 * @fileOverview AI-powered decision support for medical professionals.
 *
 * - provideDecisionSupport - A function that analyzes extracted medical data and provides suggested follow-ups and risk summaries.
 * - ProvideDecisionSupportInput - The input type for the provideDecisionSupport function.
 * - ProvideDecisionSupportOutput - The return type for the provideDecisionSupport function.
 */

import {reportAi} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDecisionSupportInputSchema = z.object({
  extractedValues: z.array(
    z.object({
      test: z.string().describe('The name of the medical test.'),
      value: z.union([z.number(), z.string()]).describe('The value of the test.'),
      unit: z.string().optional().describe('The unit of measurement for the test.'),
      referenceRange: z
        .object({
          low: z.number().optional().describe('The lower bound of the reference range.'),
          high: z.number().optional().describe('The upper bound of the reference range.'),
        })
        .optional()
        .describe('The reference range for the test.'),
      status: z.enum(['normal', 'abnormal']).optional().describe('The status of the test result.'),
    })
  ).describe('The extracted values from the medical report.'),
  patientInfo: z.string().describe('Relevant information about the patient.'),
});

export type ProvideDecisionSupportInput = z.infer<typeof ProvideDecisionSupportInputSchema>;

const ProvideDecisionSupportOutputSchema = z.object({
  suggestedFollowUps: z.array(
    z.object({
      test: z.string().describe('The name of the follow-up test.'),
      reason: z.string().describe('The reason for the suggested follow-up.'),
      priority: z.string().describe('The priority of the suggested follow-up.'),
    })
  ).describe('The suggested follow-up tests based on the extracted data.'),
  riskSummary: z.array(
    z.object({
      condition: z.string().describe('The potential medical condition.'),
      confidence: z.string().describe('The confidence level of the risk assessment.'),
      note: z.string().describe('Additional notes or observations.'),
    })
  ).describe('A summary of potential risks based on the extracted data.'),
  patientExplanation: z.string().describe('A patient-friendly explanation of the findings.'),
});

export type ProvideDecisionSupportOutput = z.infer<typeof ProvideDecisionSupportOutputSchema>;

export async function provideDecisionSupport(input: ProvideDecisionSupportInput): Promise<ProvideDecisionSupportOutput> {
  return provideDecisionSupportFlow(input);
}

const prompt = reportAi.definePrompt({
  name: 'provideDecisionSupportPrompt',
  input: {schema: ProvideDecisionSupportInputSchema},
  output: {schema: ProvideDecisionSupportOutputSchema},
  prompt: `You are an AI assistant that helps medical professionals by providing decision support based on medical report data.

  Analyze the extracted medical data provided below, along with relevant patient information, and provide the following:

  1.  Suggested Follow-Ups:  Recommend any necessary follow-up tests, including the test name, the reason for the follow-up, and the priority.
  2.  Risk Summary:  Summarize any potential medical conditions or risks identified from the data, including the condition, the confidence level of the assessment, and any additional notes.
  3.  Patient Explanation: Provide a patient-friendly explanation of the findings in simple terms.

  Here's the extracted medical data:
  {{#each extractedValues}}
  - Test: {{test}}, Value: {{value}}{{#if unit}} {{unit}}{{/if}}, Reference Range: {{#if referenceRange}}{{#if referenceRange.low}}{{referenceRange.low}} - {{/if}}{{#if referenceRange.high}}{{referenceRange.high}}{{/if}}{{/if}}, Status: {{status}}
  {{/each}}

  Patient Information: {{{patientInfo}}}
  \n  Ensure that your suggestions and summaries are evidence-based and clinically relevant.
  \n  Follow the output schema and provide arrays where appropriate.
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

const provideDecisionSupportFlow = reportAi.defineFlow(
  {
    name: 'provideDecisionSupportFlow',
    inputSchema: ProvideDecisionSupportInputSchema,
    outputSchema: ProvideDecisionSupportOutputSchema,
  },
  async input => {
    // This flow now only returns the analysis, it does not save to the database.
    const {output} = await withRetry(() => prompt(input));
    return output!;
  }
);
