require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({});
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: "Hello world"
    });
    console.log("Success with single string:", response.embeddings?.length);
  } catch (e) {
    console.error(`Failed with gemini-embedding-2:`, e.message);
  }
}

test();
