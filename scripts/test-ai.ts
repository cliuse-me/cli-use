import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';

dotenv.config();

async function testWorker() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: No API Key found.');
    process.exit(1);
  }

  console.log('✅ API Key found.');

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    console.log('⏳ Sending test prompt to Gemini 2.0 Flash...');
    const { text } = await generateText({
      model: google('models/gemini-2.0-flash'),
      prompt: 'Say hello',
    });
    console.log('✅ Success! Response:', text);
  } catch (error) {
    console.error('❌ API Request Failed:', error);
  }
}

testWorker();
