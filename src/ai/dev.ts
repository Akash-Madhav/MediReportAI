import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-prescriptions.ts';
import '@/ai/flows/extract-medical-data.ts';
import '@/ai/flows/provide-decision-support.ts';
