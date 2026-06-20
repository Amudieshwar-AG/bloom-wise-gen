require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({});
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      if (model.name.includes('embed')) {
        console.log("Found embed model:", model.name);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

test();
