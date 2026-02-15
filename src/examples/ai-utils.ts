import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from 'dotenv';

// Ensure env vars are loaded
config();

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey,
});

// Create a specialized search tool function wrapper
// Note: google.tools.googleSearch() might need to be awaited or configured differently
// based on the exact SDK version. We will use the simplest form.
const googleSearchTool = google.tools.googleSearch({});

export const getBitcoinPrediction = async (): Promise<string> => {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-pro-latest'),
      tools: {
        googleSearch: googleSearchTool,
      },
      maxSteps: 5,
      system:
        'You are a crypto analyst. Your goal is to predict the Bitcoin price for the next hour based on real-time data.',
      prompt:
        'Search for the latest current Bitcoin price, recent volatility, and immediate news. Based on this, predict the price for the next hour. Your output MUST strictly follow this format: "According to Gemini Pro 3, the most likely price for bitcoin in the next hour is: [Price]" followed by a very brief (1 sentence) reasoning.',
    } as any);
    return text;
  } catch (error: any) {
    console.error('AI Error:', error);
    return `Error retrieving prediction: ${error.message || 'Unknown error'}. Ensure GEMINI_API_KEY or GOOGLE_API_KEY is set.`;
  }
};
