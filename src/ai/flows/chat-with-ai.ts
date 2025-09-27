'use server';

/**
 * @fileOverview An AI agent that can chat with the user.
 *
 * - chatWithAi - A function that handles the chat process.
 * - ChatWithAiInput - The input type for the chatWithAiInput function.
 * - ChatWithAiOutput - The return type for the chatWithAiInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithAiInputSchema = z.object({
  messages: z.array(MessageSchema).describe('The history of the conversation.'),
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
  output: {schema: z.string().nullable()},
  prompt: `You are a powerful and versatile AI assistant, much like ChatGPT.
Your goal is to provide accurate, helpful, and engaging responses to the user's queries.
You can handle a wide range of topics, from answering general knowledge questions to helping with creative tasks.

CONVERSATION HISTORY:
{{#each messages}}
- {{role}}: {{content}}
{{/each}}

Based on the conversation history, please provide a helpful and well-formatted response to the user's last message.
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
    
    // Handle cases where the model might return a null output.
    if (output === null) {
      return "I'm sorry, I couldn't generate a response. Could you please try rephrasing your question?";
    }
    
    return output;
  }
);
