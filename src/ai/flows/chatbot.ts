'use server';
/**
 * @fileOverview A simple chatbot that answers basic medical questions and suggests consulting a doctor for complex ones.
 *
 * - chatbot - A function that handles the chatbot conversation.
 * - ChatbotInput - The input type for the chatbot function.
 */

import { chatAi } from '@/ai/genkit';
import { z } from 'zod';
import { Message, Part } from 'genkit/content';

// Define the Zod schema for a single message part
const PartSchema = z.object({
  text: z.string(),
  // Add other part types like media if needed, for now just text
});

// Define the Zod schema for a single message
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(PartSchema),
});

const ChatbotInputSchema = z.object({
  messages: z.array(MessageSchema),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

export async function chatbot(input: ChatbotInput): Promise<string> {
  const { output } = await chatbotPrompt(input);
  if (output === null) {
    return "I'm sorry, I couldn't process that. Could you please rephrase?";
  }
  return output;
}

const chatbotPrompt = chatAi.definePrompt(
  {
    role:'user',
    name: 'chatbotPrompt',
    input: { schema: ChatbotInputSchema },
    output: { schema: z.string().nullable() },
    system: `You are a helpful AI medical assistant. Your role is to answer basic medical questions.
You are not a doctor and you must make that clear.
If a user asks a complex question, a question that requires a diagnosis, or asks for medical advice, you must decline to answer and firmly advise them to consult a qualified healthcare professional.
For basic, general knowledge questions (e.g., "What are the symptoms of a common cold?"), provide a helpful and informative answer.
Keep your answers concise and easy to understand.
`,
    messages: (input) => input.messages as Message[],
  },
);
