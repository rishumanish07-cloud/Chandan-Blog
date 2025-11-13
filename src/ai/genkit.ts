import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: "AIzaSyC0TPO07A_3g2bVtaYUFnS6TWt3cT6OD50"
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
