require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({});
  const texts = ["Hello", "World"];

  const models = ['text-embedding-004', 'gemini-embedding-2', 'models/text-embedding-004'];

  for (const model of models) {
    try {
      const response = await ai.models.embedContent({
        model: model,
        contents: texts
      });
      console.log(`Success with ${model}:`, response.embeddings?.length);
    } catch (e) {
      console.error(`Failed with ${model}:`, e.message);
    }
  }
}

test();
