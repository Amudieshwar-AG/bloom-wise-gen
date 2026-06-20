require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function test() {
  const ai = new GoogleGenAI({});
  
  // Create a dummy text file to act as PDF
  fs.writeFileSync('test_gemini_dummy.txt', 'This is some text inside the uploaded document.');
  
  let uploadedFile = null;
  try {
    console.log('Uploading test file...');
    uploadedFile = await ai.files.upload({
      file: 'test_gemini_dummy.txt',
      mimeType: 'text/plain'
    });
    console.log('Upload success. File URI:', uploadedFile.uri);
    
    console.log('Generating content using fileData structure...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType
          }
        },
        "Describe the contents of this file."
      ]
    });
    
    console.log('Generation success! Response text:\n', response.text);
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    if (uploadedFile && uploadedFile.name) {
      try {
        await ai.files.delete({ name: uploadedFile.name });
        console.log('Deleted temporary file from Google.');
      } catch (delError) {
        console.error('Clean up failed:', delError.message);
      }
    }
    // delete local dummy file
    if (fs.existsSync('test_gemini_dummy.txt')) {
      fs.unlinkSync('test_gemini_dummy.txt');
    }
  }
}

test();
