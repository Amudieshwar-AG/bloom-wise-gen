const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Helper to get Gemini client based on key roles: 13/16 marks, 2 marks, or OCR
const getAiClient = (keyRole = '13_16') => {
  let key = '';
  
  if (keyRole === '13_16') {
    key = process.env.GEMINI_API_KEY_13_16 || process.env.GEMINI_API_KEY;
  } else if (keyRole === '2_MARK') {
    key = process.env.GEMINI_API_KEY_2_MARK || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;
  } else if (keyRole === 'OCR') {
    key = process.env.GEMINI_API_KEY_2_MARK || process.env.GEMINI_API_KEY_OCR || process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;
  }
  
  return new GoogleGenAI({ apiKey: key ? key.trim() : key });
};

const extractTextFromImagePdf = async (filePath) => {
  const doOCR = async (client) => {
    let uploadedFile = null;
    try {
      const absolutePath = path.resolve(filePath);
      console.log(`extractTextFromImagePdf filePath: "${filePath}", absolutePath: "${absolutePath}"`);
      if (!fs.existsSync(absolutePath)) {
        console.error(`ERROR: File does not exist at absolute path: "${absolutePath}"`);
      } else {
        const stats = fs.statSync(absolutePath);
        console.log(`File exists. Size: ${stats.size} bytes`);
      }

      console.log('Uploading PDF to Gemini File API for OCR...');
      uploadedFile = await client.files.upload({
        file: absolutePath,
        config: {
          mimeType: 'application/pdf'
        }
      });
      
      console.log(`File uploaded successfully: ${uploadedFile.uri}`);
      
      // Wait for processing if necessary
      let getFile = await client.files.get({ name: uploadedFile.name });
      let fileState = getFile.state ? getFile.state.toUpperCase() : '';
      console.log(`Initial file state in app: "${fileState}" for file name: "${uploadedFile.name}"`);
      
      while (fileState === 'PROCESSING') {
        console.log('Waiting for Google to process the PDF...');
        await new Promise(r => setTimeout(r, 3000));
        getFile = await client.files.get({ name: uploadedFile.name });
        fileState = getFile.state ? getFile.state.toUpperCase() : '';
      }
      
      console.log(`Final file state in app before generateContent: "${fileState}"`);
      
      if (fileState === 'FAILED') {
        throw new Error('Google failed to process the PDF file.');
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: 'application/pdf'
            }
          },
          "Extract all text, formulas, and math content from this document accurately. Preserve structure. If there are math equations, write them clearly."
        ]
      });
      return { text: response.text, uploadedFile };
    } catch (err) {
      if (uploadedFile && uploadedFile.name) {
        try {
          await client.files.delete({ name: uploadedFile.name });
        } catch (delErr) {
          console.error('Failed to clean up file on error:', delErr);
        }
      }
      throw err;
    }
  };

  let ai = getAiClient('OCR');
  try {
    const result = await doOCR(ai);
    if (result.uploadedFile && result.uploadedFile.name) {
      try {
        await ai.files.delete({ name: result.uploadedFile.name });
        console.log('Deleted temporary file from Google servers.');
      } catch (e) {
        console.error('Failed to clean up file:', e);
      }
    }
    return result.text;
  } catch (error) {
    const isKeyError = error.message.includes('API_KEY_INVALID') || 
                       error.message.includes('key not valid') || 
                       error.message.includes('API key expired') || 
                       error.message.includes('key expired') ||
                       error.message.includes('denied access') ||
                       error.message.includes('PERMISSION_DENIED') ||
                       (error.status === 400) ||
                       (error.status === 403);
    if (isKeyError) {
      console.warn('OCR API key invalid, expired, or project blocked. Retrying OCR with key GEMINI_API_KEY_13_16...');
      const fallbackAi = getAiClient('13_16');
      try {
        const result = await doOCR(fallbackAi);
        if (result.uploadedFile && result.uploadedFile.name) {
          try {
            await fallbackAi.files.delete({ name: result.uploadedFile.name });
            console.log('Deleted temporary file from Google servers (fallback).');
          } catch (e) {
            console.error('Failed to clean up file:', e);
          }
        }
        return result.text;
      } catch (fallbackError) {
        console.error('Fallback OCR failed too:', fallbackError);
        throw new Error('Failed to perform OCR on PDF even with fallback key.');
      }
    } else {
      console.error('Error extracting text from image PDF with Gemini:', error);
      throw new Error('Failed to perform OCR on PDF with Gemini.');
    }
  }
};

const https = require('https');

const generateEmbeddings = async (texts) => {
  try {
    const embeddings = [];
    let apiKey = process.env.GEMINI_API_KEY_2_MARK || process.env.GEMINI_API_KEY_OCR || process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.trim();
    const batchSize = 100; // Batch up to 100 chunks per request

    console.log(`Generating embeddings for ${texts.length} chunks in batches of ${batchSize}...`);

    const makeRequest = (apiKeyToUse, postData) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKeyToUse}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(body));
            } else {
              console.error('Batch Embed API error:', body);
              reject(new Error(`API Error: ${res.statusCode} - ${body}`));
            }
          });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
      });
    };

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const requests = batch.map(text => ({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text: text }] }
      }));

      const postData = JSON.stringify({ requests });
      
      let data;
      try {
        data = await makeRequest(apiKey, postData);
      } catch (err) {
        const isKeyOrPermError = err.message.includes('API Error: 400') || 
                                 err.message.includes('API Error: 403') ||
                                 err.message.includes('API_KEY_INVALID') || 
                                 err.message.includes('key not valid') ||
                                 err.message.includes('denied access') ||
                                 err.message.includes('PERMISSION_DENIED');
        if (isKeyOrPermError) {
          console.warn('Embeddings API key invalid or project denied. Retrying with key GEMINI_API_KEY_13_16...');
          const fallbackKey = (process.env.GEMINI_API_KEY_13_16 || process.env.GEMINI_API_KEY || '').trim();
          data = await makeRequest(fallbackKey, postData);
        } else {
          throw err;
        }
      }
      
      // Ensure we push the embedding values
      if (data.embeddings && data.embeddings.length > 0) {
        for (const embed of data.embeddings) {
          embeddings.push(embed.values);
        }
      }
    }
    
    console.log(`Successfully generated ${embeddings.length} embeddings.`);
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings with Gemini.');
  }
};

const generateQuestionsFromContext = async (contextChunks, config) => {
  try {
    const { twoMark, thirteenMark, sixteenMark, thirteenPattern, sixteenPattern, difficulty, withAnswers, excludeTopics = [], apiKeySelector = 'primary' } = config;
    const ai = getAiClient(apiKeySelector);

    const contextText = contextChunks.map(c => `[Chunk ID: ${c.chunk_id}]\n${c.content}`).join('\n\n');

    let exclusionPrompt = '';
    if (excludeTopics.length > 0) {
      exclusionPrompt = `CRITICAL RULE: Avoid generating questions on the following topics as they are already covered: [${excludeTopics.join(', ')}]. Instead, focus on other definitions, formulas, concepts, or topics present in the retrieved context to maximize total syllabus coverage.`;
    }

    // Build pattern instructions
    let patternInstructions = '';
    if (thirteenMark > 0) {
      if (thirteenPattern === '8+5') {
        patternInstructions += `- Each of the 13-mark questions must be split into two sub-questions: part (a) worth 8 marks and part (b) worth 5 marks. Format the question text as "a) [Question part A] (8 marks)\\nb) [Question part B] (5 marks)".\n`;
      } else if (thirteenPattern === '7+6') {
        patternInstructions += `- Each of the 13-mark questions must be split into two sub-questions: part (a) worth 7 marks and part (b) worth 6 marks. Format the question text as "a) [Question part A] (7 marks)\\nb) [Question part B] (6 marks)".\n`;
      } else {
        patternInstructions += `- Each of the 13-mark questions must be a single standalone 13-mark question.\n`;
      }
    }
    if (sixteenMark > 0) {
      if (sixteenPattern === '8+8') {
        patternInstructions += `- Each of the 16-mark questions must be split into two sub-questions: part (a) worth 8 marks and part (b) worth 8 marks. Format the question text as "a) [Question part A] (8 marks)\\nb) [Question part B] (8 marks)".\n`;
      } else if (sixteenPattern === '10+6') {
        patternInstructions += `- Each of the 16-mark questions must be split into two sub-questions: part (a) worth 10 marks and part (b) worth 6 marks. Format the question text as "a) [Question part A] (10 marks)\\nb) [Question part B] (6 marks)".\n`;
      } else {
        patternInstructions += `- Each of the 16-mark questions must be a single standalone 16-mark question.\n`;
      }
    }

    const prompt = `You are the core document analysis engine of BloomAI, an expert exam question generator specializing in Bloom's Taxonomy.
Your task is to generate examination questions based STRICTLY on the retrieved context provided below.

IMPORTANT RULES:
- Never generate questions without using the retrieved context.
- Use retrieved chunks as the source of truth.
- Always maintain chunk-to-question traceability (include the source chunk_id).
- Ensure Bloom's Taxonomy compliance.
- Maintain a ${difficulty || 'Medium'} difficulty level.
- For 16-mark questions: If you cannot formulate a highly complex 16-mark question using the theory alone, you MUST directly extract a question or worked example from the PDF context and use it as the question.
- ${exclusionPrompt}

Configuration:
- Generate exactly ${twoMark || 0} questions worth 2 marks.
- Generate exactly ${thirteenMark || 0} questions worth 13 marks.
- Generate exactly ${sixteenMark || 0} questions worth 16 marks.
${patternInstructions}
- Target Difficulty: ${difficulty || 'Medium'}
- Include Answers: ${withAnswers === 'true' || withAnswers === true}
- CRITICAL: To save tokens and avoid response corruption, DO NOT write full essay answers or long paragraphs for the 'modelAnswer'. Instead, provide a highly concise bulleted outline/marking scheme of the expected answer key (e.g., "• Core concept definition (3 marks) \n• Explaining the 3 requirements (6 marks) \n• Key benefit (4 marks)").
- If any question is split (like 8+5, 7+6, 8+8, or 10+6), ensure the 'modelAnswer' contains a concise bulleted marking scheme for each sub-question part, clearly labeled.
- Before formulating any 13-mark or 16-mark question, internally verify that the retrieved context contains sufficient technical detail and depth to warrant that mark value.

Rules for the JSON Output:
- Respond strictly with a valid JSON array of objects.
- Each object must have the following structure:
{
  "id": "q1", // unique string identifier
  "number": 1, // integer starting from 1
  "marks": 2, // integer: either 2, 13, or 16. Even if a question is split into sub-questions (e.g. 8+5), the 'marks' field should reflect the total marks of the question (i.e. 13 or 16).
  "bloom": "Remember", // string: strictly one of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
  "text": "The text of the question?", // string (include sub-questions separated by newlines with their marks if split, e.g. "a) Explain... (8 marks)\nb) Explain... (5 marks)")
  "topic": "The topic covered", // string
  "sourceChunkIds": ["chunk_001"], // array of string chunk IDs used to generate this
  "hasAnswer": true, // boolean
  "modelAnswer": "Concise marking scheme outline (bullets and key details only)" // include only if Include Answers is true
}

Do NOT wrap the JSON in markdown blocks (e.g., \`\`\`json). Return ONLY the raw JSON array.

Retrieved Context:
${contextText}
`;

    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          number: { type: 'integer' },
          marks: { type: 'integer' },
          bloom: { type: 'string' },
          text: { type: 'string' },
          topic: { type: 'string' },
          sourceChunkIds: {
            type: 'array',
            items: { type: 'string' }
          },
          hasAnswer: { type: 'boolean' },
          modelAnswer: { type: 'string' }
        },
        required: ['id', 'number', 'marks', 'bloom', 'text', 'topic', 'sourceChunkIds', 'hasAnswer', 'modelAnswer']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        maxOutputTokens: 8192
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error calling Gemini API for generation:', error);
    throw new Error('Failed to generate questions with Gemini.');
  }
};

module.exports = {
  extractTextFromImagePdf,
  generateEmbeddings,
  generateQuestionsFromContext,
};

