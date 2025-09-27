'use server';

/**
 * @fileOverview An AI agent that can chat with the user about their medical data.
 *
 * - chatWithAi - A function that handles the chat process.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithAiInputSchema = z.object({
  messages: z.array(MessageSchema).describe('The history of the conversation.'),
  reportData: z.string().describe("The user's summarized medical report data."),
  prescriptionData: z
    .string()
    .describe("The user's summarized prescription data."),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.string().describe("The AI's response to the user's query.");
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(
  input: ChatWithAiInput
): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: {schema: ChatWithAiInputSchema},
  output: {schema: z.string()},
  prompt: `You are a friendly and helpful AI medical assistant. Your role is to answer questions about a user's health based on the data they have provided.

  Here is the user's medical history. Use it as the primary source of truth to answer their questions.
  
  SUMMARY OF MEDICAL REPORTS:
  {{{reportData}}}
  
  SUMMARY OF PRESCRIPTIONS:
  {{{prescriptionData}}}
  
  ---
  
  You are now in a conversation with the user.
  
  CONVERSATION HISTORY:
  {{#each messages}}
  - {{role}}: {{content}}
  {{/each}}
  
  Based on the conversation history and the provided medical data, please provide a helpful and accurate response to the user's latest query.
  
  Answer the user's last message.
  `,
});

const chatWithAiFlow = ai.defineFlow(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async input => {
    const {output} = await chatPrompt(input);
    return output!;
  }
);
