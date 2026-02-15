import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('No API Key');
  process.exit(1);
}

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('Fetching:', url.replace(apiKey as string, 'HIDDEN_KEY'));

    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
      console.log('✅ Available Models:');
      data.models.forEach((m) => console.log(' - ' + m.name));
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
