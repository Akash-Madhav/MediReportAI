'use server';

/**
 * @fileOverview A simple chatbot that answers basic medical questions and suggests consulting a doctor for complex ones.
 */

import { chatAi } from '@/ai/genkit';
import { z } from 'zod';
import { Message, Part } from 'genkit/content';

// Schema for a single message part
const PartSchema = z.object({
  text: z.string(),
  // Extend with image, video, etc., if needed
});

// Schema for a single message (user or model)
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(PartSchema),
});

// Chat input schema — with first message check
const ChatbotInputSchema = z.object({
  messages: z.array(MessageSchema).refine(
    (messages) => messages.length > 0 && messages[0].role === 'user',
    {
      message: 'The first message must be from the user.',
    }
  ),
});

export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

// Main chatbot function
export async function chatbot(input: ChatbotInput): Promise<string> {
  try {
    // Validate with Zod manually if needed
    ChatbotInputSchema.parse(input);

    const { output } = await chatbotPrompt(input);

    if (output === null) {
      return "I'm sorry, I couldn't process that. Could you please rephrase?";
    }

    return output;
  } catch (err: any) {
    console.error('Chatbot error:', err);
    return err.message || 'Something went wrong.';
  }
}

// Genkit prompt definition
const chatbotPrompt = chatAi.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: ChatbotInputSchema },
  output: { schema: z.string().nullable() },
  system: `You are a helpful AI medical assistant. Your role is to answer basic medical questions.
You are not a doctor and you must make that clear.
If a user asks a complex question, a question that requires a diagnosis, or asks for medical advice, you must decline to answer and firmly advise them to consult a qualified healthcare professional.
For basic, general knowledge questions (e.g., "What are the symptoms of a common cold?"), provide a helpful and informative answer.
Keep your answers concise and easy to understand.`,
  messages: (input) => input.messages as Message[],
});
