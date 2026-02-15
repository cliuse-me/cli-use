import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from 'dotenv';

// Ensure env vars are loaded
config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey,
});

// Create a specialized search tool function wrapper
// Note: google.tools.googleSearch() might need to be awaited or configured differently
// based on the exact SDK version. We will use the simplest form.
const googleSearchTool = google.tools.googleSearch({});

export interface PredictionResult {
  text: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
}

export const getBitcoinPrediction = async (): Promise<PredictionResult> => {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-pro'),
      tools: {
        googleSearch: googleSearchTool,
      },
      maxSteps: 5,
      system:
        'You are a crypto analyst. Your goal is to predict the Bitcoin price for the next hour based on real-time data.',
      prompt:
        'Search for the latest current Bitcoin price, recent volatility, and immediate news. Based on this, predict the price for the next hour. Your output MUST strictly follow this format: "According to Gemini Pro 3, the most likely price for bitcoin in the next hour is: [Price]" followed by a very brief (1 sentence) reasoning.\n\nCRITICAL: On a new line at the very end, output strictly one word: "SIGNAL:BUY" or "SIGNAL:SELL" or "SIGNAL:HOLD".',
    } as any);

    const signalMatch = text.match(/SIGNAL:(BUY|SELL|HOLD)/i);
    const signal = signalMatch ? (signalMatch[1].toUpperCase() as 'BUY' | 'SELL' | 'HOLD') : 'HOLD';
    const cleanText = text.replace(/SIGNAL:(BUY|SELL|HOLD)/gi, '').trim();

    return { text: cleanText, signal };
  } catch (error: any) {
    console.error('AI Error:', error);
    return {
      text: `Error retrieving prediction: ${error.message || 'Unknown error'}. Ensure GEMINI_API_KEY or GOOGLE_API_KEY is set.`,
      signal: 'HOLD',
    };
  }
};

export const getAgentStrategy = async (price: string): Promise<string> => {
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: 'You are a high-frequency trading bot optimizer.',
      prompt: `Given Bitcoin price ${price}, suggest a super concise 1-hour scalping strategy (max 10 words).`,
    } as any);
    return text;
  } catch (error) {
    return 'Momentum scalp on volatility.';
  }
};
