'use server';

/**
 * @fileOverview An AI assistant that can answer questions about the app, general health, and fetch user reports.
 *
 * - assistant - A function that handles the chat conversation.
 * - AssistantInput - The input type for the assistant function.
 */

import { chatAi } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";

// Define the schema for a single message in the conversation
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the input schema for the chatbot flow
const AssistantInputSchema = z.object({
  userId: z.string().describe("The unique ID of the user."),
  messages: z.array(MessageSchema).describe('The history of the conversation so far.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const ReportSummarySchema = z.object({
    name: z.string(),
    status: z.string(),
    abnormalResults: z.number(),
});

// Define a tool for the AI to get user reports from the database
const getUserReportsTool = chatAi.defineTool(
    {
        name: 'getUserReports',
        description: 'Retrieves a list of the user\'s medical reports, including their name, overall status, and a count of abnormal results.',
        inputSchema: z.object({
            userId: z.string().describe("The user's unique ID."),
        }),
        outputSchema: z.array(ReportSummarySchema),
    },
    async ({ userId }) => {
        console.log(`[Tool] Fetching reports for userId: ${userId}`);
        const userReportsRef = ref(db, `reports/${userId}`);
        const snapshot = await get(userReportsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const reportsData = snapshot.val();
        return Object.values(reportsData).map((report: any) => {
            const abnormalCount = report.extractedValues.filter((v: any) => v.status === 'abnormal').length;
            return {
                name: report.name,
                status: abnormalCount > 0 ? "Action Required" : "Normal",
                abnormalResults: abnormalCount,
            };
        });
    }
);


// Define the main prompt for the AI assistant
const assistantPrompt = chatAi.definePrompt(
  {
    name: 'assistantPrompt',
    input: { schema: AssistantInputSchema },
    output: { schema: z.string() },
    tools: [getUserReportsTool],
    system: `You are a helpful AI assistant for a medical dashboard application.
Your name is MediBot.
Your capabilities are:
1.  Answering questions about how to use the application.
2.  Providing general information about health and wellness topics.
3.  Looking up a user's medical reports from the database using the available tools when asked.

When providing medical information, ALWAYS include the following disclaimer at the end of your response: "Disclaimer: I am an AI assistant. This information is not a substitute for professional medical advice. Please consult with a healthcare provider for any health concerns."

If the user asks a question that is too complex, involves a diagnosis, or is about a specific medical condition that requires a doctor's expertise, you MUST decline to answer and strongly recommend they consult a healthcare professional.

Be friendly, conversational, and helpful.`,
    messages: [
      {
        role: 'user',
        content: `My user ID is {{userId}}. Here is our conversation history: {{jsonStringify messages}}`,
      },
    ],
  }
);


export async function assistant(input: AssistantInput): Promise<string> {
    const { output } = await assistantPrompt(input);
    return output ?? "Sorry, I'm having trouble responding right now. Please try again in a moment.";
}
