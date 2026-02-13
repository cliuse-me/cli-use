import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_API_KEY is not set in .env');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const prompt = line.trim();
  if (!prompt) return;

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
    });
    // Write as a single line JSON to avoid newlines breaking protocol or just raw text
    // For this simple demo, we'll replace newlines with a marker or just print it.
    // Let's print raw text but ensure we emit a special end marker if needed.
    // Actually, Ratatui reads line by line. Let's send the text followed by a delimiter.
    
    console.log(text.replace(/
/g, '
')); 
  } catch (error) {
    console.error('AI Error:', error);
  }
});
