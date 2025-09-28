'use server';
/**
 * @fileOverview An AI assistant for the application that can answer questions about the app and general health topics.
 *
 * - assistant - A function that handles the chat interaction.
 * - AssistantInput - The input type for the assistant function.
 */

import { chatAi } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AssistantInputSchema = z.object({
  messages: z.array(MessageSchema),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function assistant(input: AssistantInput): Promise<string> {
  // Ensure the last message is from the user
  if (input.messages.length === 0 || input.messages[input.messages.length - 1].role !== 'user') {
    throw new Error('The last message in the history must be from the user.');
  }
  
  return assistantFlow(input);
}

const assistantFlow = chatAi.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const assistantPrompt = chatAi.definePrompt({
      name: 'assistantPrompt',
      system: `You are a helpful AI assistant for a medical dashboard application called MediReportAI.
Your role is to assist users with questions about the application and provide information on general health topics.

When asked about the app, explain its features like:
- Dashboard: An overview of their health.
- Reports: Where they can upload and see analysis of medical reports (e.g., bloodwork).
- Prescriptions: Where they can upload and analyze prescriptions for drug interactions.
- Pharmacies: A tool to find nearby pharmacies.

When asked about general health topics (e.g., "what are the symptoms of a cold?"), provide helpful, clear, and concise information.

IMPORTANT: For any questions that are medically complex, diagnostic in nature, or about personal health data, you MUST decline to answer and advise the user to consult a healthcare professional. DO NOT provide medical advice.

Keep your answers brief and to the point.
`,
      messages: input.messages,
      output: { schema: z.string() },
    });

    const { output } = await assistantPrompt();
    return output || 'Sorry, I could not generate a response. Please try again.';
  }
);
