import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const reportAi = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_REPORTS})],
  model: 'googleai/gemini-2.5-flash',
});

export const prescriptionAi = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_PRESCRIPTIONS})],
    model: 'googleai/gemini-2.5-flash',
});


export const chatAi = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
    model: 'googleai/gemini-2.5-flash',
});


// Default ai instance for components that may not have a specific key
export const ai = reportAi;
