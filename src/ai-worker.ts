import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Support multiple potential env var names for flexibility
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('Error: No API Key found. Set GEMINI_API_KEY or GOOGLE_API_KEY in .env');
  process.exit(1);
}

const google = createGoogleGenerativeAI({
  apiKey: apiKey,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  const prompt = line.trim();
  if (!prompt) return;

  try {
    const { text } = await generateText({
      model: google('models/gemini-2.0-flash'), // Updated to available model
      prompt: prompt,
    });

    // Output text handling for Rust consumption
    console.log(text.replace(/\n/g, '\\n'));
  } catch (error) {
    console.error('AI Error:', error);
  }
});
