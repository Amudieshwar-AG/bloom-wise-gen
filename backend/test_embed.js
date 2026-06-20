require('dotenv').config();
const fetch = require('node-fetch') || global.fetch;

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }

  const batch = ["Hello", "World"];
  const requests = batch.map(text => ({
    model: 'models/text-embedding-004',
    content: { parts: [{ text: text }] }
  }));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Batch Embed API error:', errText);
    } else {
      const data = await response.json();
      console.log('Success, generated embeddings:', data.embeddings?.length);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

test();
