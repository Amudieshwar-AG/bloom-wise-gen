const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function test() {
  const ai = new GoogleGenAI({});
  
  // Create a dummy pdf file
  fs.writeFileSync('test_dummy', 'dummy content');
  
  try {
    const uploadedFile = await ai.files.upload({
      file: 'test_dummy',
      mimeType: 'application/pdf'
    });
    console.log("Success with mimeType", uploadedFile);
  } catch (e) {
    console.error("Error with mimeType at top level:", e.message);
  }

  try {
    const uploadedFile = await ai.files.upload({
      file: 'test_dummy',
      config: {
        mimeType: 'application/pdf'
      }
    });
    console.log("Success with config.mimeType", uploadedFile);
  } catch (e) {
    console.error("Error with config.mimeType:", e.message);
  }
}

test();
