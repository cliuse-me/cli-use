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

export interface OrderPlan {
  price: number;
  amountUSD: number;
  side: 'BUY' | 'SELL';
}

export interface PredictionResult {
  text: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  orderPlan: OrderPlan[];
}

export const getBitcoinPrediction = async (): Promise<PredictionResult> => {
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-pro'),
      tools: {
        googleSearch: googleSearchTool,
      },
      maxSteps: 5,
      system: 'You are a crypto analyst managing a $100,000 portfolio.',
      prompt:
        'Search for the latest current Bitcoin price, recent volatility, and immediate news. Based on this, predict the price for the next hour.\n\n1. Provide a brief 1-sentence reasoning.\n2. Create a "Order Plan" for the $100,000 capital. Define 3-5 price levels (trenches) to enter or exit positions.\n3. CRITICAL: Output a JSON block at the end strictly following this schema: \n```json\n{ "signal": "BUY"|"SELL"|"HOLD", "orders": [{ "price": 95000, "amountUSD": 20000, "side": "BUY" }] }\n```',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    let orderPlan: OrderPlan[] = [];
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const data = JSON.parse(jsonStr);
        signal = data.signal || 'HOLD';
        orderPlan = data.orders || [];
      } catch (e) {
        console.error('Failed to parse AI JSON', e);
      }
    }

    const cleanText = text
      .replace(/```json[\s\S]*```/g, '')
      .replace(/\{[\s\S]*\}/g, '')
      .trim();

    return { text: cleanText || text, signal, orderPlan };
  } catch (error: unknown) {
    console.error('AI Error:', error);
    return {
      text: `Error retrieving prediction: ${(error as Error).message || 'Unknown error'}. Ensure GEMINI_API_KEY or GOOGLE_API_KEY is set.`,
      signal: 'HOLD',
      orderPlan: [],
    };
  }
};

export interface AgentStrategyResult {
  text: string;
  action: 'BUY' | 'SELL';
}

export const getAgentStrategy = async (price: string): Promise<AgentStrategyResult> => {
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: 'You are a high-frequency trading bot optimizer.',
      prompt: `Given Bitcoin price ${price}, suggest a concise 1-hour scalping strategy (max 25 words). Describe specifically how orders will be placed (e.g. "Ladder limit orders down"). \n\nCRITICAL: End with "ACTION:BUY" or "ACTION:SELL".`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const actionMatch = text.match(/ACTION:(BUY|SELL)/i);
    const action = actionMatch ? (actionMatch[1].toUpperCase() as 'BUY' | 'SELL') : 'BUY';
    const cleanText = text.replace(/ACTION:(BUY|SELL)/gi, '').trim();

    return { text: cleanText, action };
  } catch {
    return { text: 'Momentum scalp on volatility.', action: 'BUY' };
  }
};
