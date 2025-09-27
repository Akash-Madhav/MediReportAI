'use server';

/**
 * @fileOverview An AI agent for extracting key data from medical reports using an LLM.
 *
 * - extractMedicalData - A function that handles the medical data extraction process.
 * - ExtractMedicalDataInput - The input type for the extractMedicalData function.
 * - ExtractMedicalDataOutput - The return type for the extractMedicalData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMedicalDataInputSchema = z.object({
  reportText: z
    .string()
    .optional()
    .describe('The text content of the medical report to be analyzed.'),
  reportDataUri: z
    .string()
    .optional()
    .describe(
      "A medical report file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMedicalDataInput = z.infer<typeof ExtractMedicalDataInputSchema>;

const ExtractedValueSchema = z.object({
  test: z.string().describe('The name of the medical test performed.'),
  value: z.union([z.number(), z.string()]).describe('The value of the test result.'),
  unit: z.string().optional().describe('The unit of measurement for the test result.'),
  referenceRange: z
    .object({low: z.number().optional(), high: z.number().optional()})
    .optional()
    .describe('The reference range for the test result.'),
  status:
    z.enum(['normal', 'abnormal']).optional().describe('The status of the test result.'),
});

const ExtractMedicalDataOutputSchema = z.object({
  extractedValues: z
    .array(ExtractedValueSchema)
    .describe('An array of extracted medical test results from the report.'),
});
export type ExtractMedicalDataOutput = z.infer<typeof ExtractMedicalDataOutputSchema>;

export async function extractMedicalData(input: ExtractMedicalDataInput): Promise<ExtractMedicalDataOutput> {
  return extractMedicalDataFlow(input);
}

const extractMedicalDataPrompt = ai.definePrompt({
  name: 'extractMedicalDataPrompt',
  input: {schema: ExtractMedicalDataInputSchema},
  output: {schema: ExtractMedicalDataOutputSchema},
  prompt: `You are an AI assistant specialized in extracting key medical data from reports.
  Your goal is to accurately and efficiently process medical information by identifying and extracting relevant data points.
  Apply reasoning to include only the most important and relevant information in the extracted values.

  Here is the medical report:
  {{#if reportText}}{{reportText}}{{/if}}
  {{#if reportDataUri}}{{media url=reportDataUri}}{{/if}}

  Please extract the key medical data from the report, focusing on specific test results and their corresponding values, units, reference ranges, and statuses.
  Return the extracted data in the following JSON format:
  {
    "extractedValues": [
      {
        "test": "Test Name",
        "value": "Test Value",
        "unit": "Unit of Measurement",
        "referenceRange": {
          "low": "Lower Reference Value",
          "high": "Upper Reference Value"
        },
        "status": "normal" | "abnormal"
      }
    ]
  }
  Ensure that the extracted data is accurate, complete, and well-formatted.
`,
});

const extractMedicalDataFlow = ai.defineFlow(
  {
    name: 'extractMedicalDataFlow',
    inputSchema: ExtractMedicalDataInputSchema,
    outputSchema: ExtractMedicalDataOutputSchema,
  },
  async input => {
    const {output} = await extractMedicalDataPrompt(input);
    return output!;
  }
);
