"use server";

/**
 * @fileOverview A flow to create a medication reminder and eventually send a notification.
 * 
 * - createReminder - A function that saves a reminder to the database.
 * - CreateReminderInput - The input type for the createReminder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, push, set } from "firebase/database";
import { db } from "@/lib/firebase";

const CreateReminderInputSchema = z.object({
    patientId: z.string().describe('The ID of the user for whom the reminder is being created.'),
    prescriptionId: z.string().optional().describe('The ID of the source prescription.'),
    medicineName: z.string().describe('The name of the medicine for the reminder.'),
});
export type CreateReminderInput = z.infer<typeof CreateReminderInputSchema>;

// The output is just a success message for now.
const CreateReminderOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
export type CreateReminderOutput = z.infer<typeof CreateReminderOutputSchema>;

export async function createReminder(input: CreateReminderInput): Promise<CreateReminderOutput> {
  return createReminderFlow(input);
}

const createReminderFlow = ai.defineFlow(
    {
        name: 'createReminderFlow',
        inputSchema: CreateReminderInputSchema,
        outputSchema: CreateReminderOutputSchema,
    },
    async (input) => {
        try {
            const newReminderRef = push(ref(db, `reminders/${input.patientId}`));
            
            // For now, we'll create a default reminder: Daily at 9:00 AM
            await set(newReminderRef, {
                patientId: input.patientId,
                prescriptionId: input.prescriptionId || null,
                medicineName: input.medicineName,
                time: "09:00",
                recurrence: "Daily",
                enabled: true,
            });

            // Placeholder for sending a notification
            // In a real application, you would trigger a push notification service here.
            console.log(`[Notification Stub] A reminder for ${input.medicineName} has been set.`);

            return { success: true, message: "Reminder created successfully." };

        } catch (error: any) {
            console.error('Error in createReminderFlow:', error);
            throw new Error('Could not create reminder. ' + error.message);
        }
    }
);
