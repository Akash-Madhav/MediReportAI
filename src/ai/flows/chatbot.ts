'use server';

/**
 * @fileOverview A simple chatbot that answers basic medical questions and suggests consulting a doctor for complex ones.
 */

import { chatAi } from '@/ai/genkit';
import { z } from 'zod';
import { Message } from 'genkit';

// Chat input schema
const ChatbotInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
});

export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

// Main chatbot function
export async function chatbot(input: ChatbotInput): Promise<string> {
    const { output } = await chatbotPrompt(input);

    if (output === null) {
      return "I'm sorry, I couldn't process that. Could you please rephrase?";
    }

    return output;
}

// Genkit prompt definition
const chatbotPrompt = chatAi.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: ChatbotInputSchema },
  output: { schema: z.string().nullable() },
  system: `You are a helpful AI medical assistant. Your role is to provide general information about diseases, symptoms, and potential actions.

When a user asks about a disease or symptom, you should provide:
1.  A brief, easy-to-understand overview.
2.  General precautions or at-home care suggestions.
3.  Commonly associated over-the-counter medicines that may help.

IMPORTANT: You are an AI and not a real doctor. You MUST end every single response with a clear, bold disclaimer: "**Disclaimer: I am an AI assistant and not a medical professional. The information I provide is for informational purposes only. Please consult with a qualified healthcare provider for any medical advice, diagnosis, or treatment.**"

Do not provide a diagnosis. Keep your answers helpful but general.`,
  messages: (input) => input.messages as Message[],
});
