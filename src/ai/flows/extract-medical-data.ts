'use server';

/**
 * @fileOverview An AI agent for extracting key data from medical reports using an LLM.
 *
 * - extractMedicalData - A function that handles the medical data extraction process.
 * - ExtractMedicalDataInput - The input type for the extractMedicalData function.
 * - ExtractMedicalDataOutput - The return type for the extractMedicalData function.
 */

import {reportAi} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';

const ExtractMedicalDataInputSchema = z.object({
  reportText: z
    .string()
    .optional()
    .describe('The text content of the medical report to be analyzed.'),
  reportDataUri: z
    .string()
    .optional()
    .describe(
      "A medical report file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Supported types: PDF, DOCX."
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

const extractMedicalDataPrompt = reportAi.definePrompt({
  name: 'extractMedicalDataPrompt',
  input: {
    schema: z.object({
      reportText: z.string().optional(),
      reportDataUri: z.string().optional(),
    }),
  },
  output: {schema: ExtractMedicalDataOutputSchema},
  prompt: `You are an AI assistant specialized in extracting key medical data from reports.
  Your goal is to accurately and efficiently process medical information by identifying and extracting relevant data points.
  Apply reasoning to include only the most important and relevant information in the extracted values.

  Here is the medical report:
  {{#if reportText}}
    {{{reportText}}}
  {{else}}
    {{media url=reportDataUri}}
  {{/if}}

  Please extract the key medical data from the report, focusing on specific test results and their corresponding values, units, reference ranges, and statuses.
  Return the extracted data in the following JSON format. Do not add any extra commentary or explanation.
`,
});

async function extractTextFromDataUri(dataUri: string): Promise<string> {
  const [metadata, base64Data] = dataUri.split(',');
  const mimeType = metadata.split(':')[1].split(';')[0];
  const buffer = Buffer.from(base64Data, 'base64');

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({buffer});
    return result.value;
  } else {
    // For PDFs and other types, we will pass the data URI directly to the model
    return '';
  }
}


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

const extractMedicalDataFlow = reportAi.defineFlow(
  {
    name: 'extractMedicalDataFlow',
    inputSchema: ExtractMedicalDataInputSchema,
    outputSchema: ExtractMedicalDataOutputSchema,
  },
  async input => {
    let reportText: string | undefined = input.reportText;
    let reportDataUri: string | undefined = input.reportDataUri;

    if (!reportText && !reportDataUri) {
        throw new Error('No report content provided. Please either paste text or upload a file.');
    }
    
    // If a file is uploaded, handle it.
    if (reportDataUri) {
      // For DOCX, we extract text. For PDF, we'll pass the URI directly.
      const text = await extractTextFromDataUri(reportDataUri);
      if (text) {
        reportText = text;
        reportDataUri = undefined; // Unset data URI as we are using extracted text.
      }
    }
    
    if (!reportText && !reportDataUri) {
        throw new Error('Could not extract text or prepare data from the provided source.');
    }

    // This flow now only returns the analysis, it does not save to the database.
    const {output} = await withRetry(() => extractMedicalDataPrompt({ reportText, reportDataUri }));
    return output!;
  }
);
