require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({});
  const texts = ["Hello", "World"];

  try {
    const requests = texts.map(t => ({
      model: 'gemini-embedding-2',
      content: { parts: [{ text: t }] }
    }));
    
    // Test if batchEmbedContents exists
    if (typeof ai.models.batchEmbedContents === 'function') {
      const response = await ai.models.batchEmbedContents({
        model: 'gemini-embedding-2',
        requests: requests
      });
      console.log("Success with batchEmbedContents:", response.embeddings?.length);
    } else {
      console.log("ai.models.batchEmbedContents is NOT a function");
    }
  } catch (e) {
    console.error(`Failed with batchEmbedContents:`, e.message);
  }
}

test();
