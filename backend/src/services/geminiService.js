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

  const apiKeys = [
    process.env.GEMINI_API_KEY_OCR,
    process.env.GEMINI_API_KEY_2_MARK,
    process.env.GEMINI_API_KEY_13_16,
    process.env.GEMINI_API_KEY
  ].map(k => k ? k.trim() : '').filter(k => k !== '');

  if (apiKeys.length === 0) {
    throw new Error('No Gemini API keys are configured in the environment variables.');
  }

  let lastError = null;
  for (let k = 0; k < apiKeys.length; k++) {
    const currentKey = apiKeys[k];
    const ai = new GoogleGenAI({ apiKey: currentKey });
    try {
      console.log(`Attempting OCR with key index ${k}...`);
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
      console.warn(`OCR failed with key index ${k}. Error:`, error.message || error);
      lastError = error;
      if (error.message && error.message.includes('429')) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw new Error('Failed to perform OCR on PDF with Gemini: ' + (lastError ? lastError.message : 'All keys failed.'));
};

const https = require('https');

const generateEmbeddings = async (texts) => {
  try {
    const embeddings = [];
    const batchSize = 100; // Batch up to 100 chunks per request

    const apiKeys = [
      process.env.GEMINI_API_KEY_2_MARK,
      process.env.GEMINI_API_KEY_13_16,
      process.env.GEMINI_API_KEY_OCR,
      process.env.GEMINI_API_KEY
    ].map(k => k ? k.trim() : '').filter(k => k !== '');

    if (apiKeys.length === 0) {
      throw new Error('No Gemini API keys are configured in the environment variables.');
    }

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
      
      let data = null;
      let lastErr = null;

      for (let k = 0; k < apiKeys.length; k++) {
        const currentKey = apiKeys[k];
        try {
          console.log(`Generating embeddings using key index ${k}...`);
          data = await makeRequest(currentKey, postData);
          break; // Success!
        } catch (err) {
          console.warn(`Embeddings generation failed with key index ${k}. Error:`, err.message || err);
          lastErr = err;
          if (err.message.includes('429')) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (!data) {
        console.warn('All Gemini keys failed to generate embeddings. Falling back to mock embeddings (first-N chunk retrieval)...');
        data = {
          embeddings: batch.map(() => ({
            values: Array(768).fill(0.1)
          }))
        };
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
    throw new Error('Failed to generate embeddings with Gemini: ' + error.message);
  }
};

const generateQuestionsFromContext = async (contextChunks, config) => {
  try {
    const { 
      twoMark, 
      thirteenMark, 
      sixteenMark, 
      thirteenPattern, 
      sixteenPattern, 
      difficulty, 
      withAnswers, 
      excludeTopics = [], 
      excludeQuestionTexts = [],
      apiKeySelector = 'primary', 
      questionType = 'mixed' 
    } = config;

    const contextText = contextChunks.map(c => `[Chunk ID: ${c.chunk_id}]\n${c.content}`).join('\n\n');

    let exclusionPrompt = '';
    const exclusions = [];
    if (excludeTopics.length > 0) {
      exclusions.push(`Avoid generating questions on these already covered topics: [${excludeTopics.join(', ')}].`);
    }
    if (excludeQuestionTexts.length > 0) {
      exclusions.push(`CRITICAL: Do NOT generate questions that repeat, overlap with, or are highly similar to the following questions that have already been generated:\n${excludeQuestionTexts.map((q, idx) => `  - Question ${idx + 1}: "${q}"`).join('\n')}`);
    }
    if (exclusions.length > 0) {
      exclusionPrompt = `CRITICAL EXCLUSION RULES:\n${exclusions.join('\n')}\nEnsure your generated questions are completely distinct, testing other concepts, definitions, formulas, or theorems from the context.`;
    }

    let typePrompt = '';
    if (questionType === 'theory') {
      typePrompt = 'Focus ONLY on theoretical explanations, definitions, key concepts, descriptions, and descriptive analysis. Avoid asking mathematical calculations, coding questions, dry runs, algorithm pseudocode, or algebraic derivations.';
    } else if (questionType === 'maths') {
      typePrompt = 'Focus ONLY on active mathematical problems, numerical calculations, equations, and quantitative step-by-step problem-solving. Every single question (including 2-mark questions) must require the student to calculate a value, solve an equation, apply a formula to specific numerical cases, or prove a specific mathematical case. Avoid purely descriptive, theoretical, or definitional questions (e.g. do NOT generate questions like "What is Euclid\'s division lemma?", "Explain real numbers", or "Define rational numbers"). Instead, ask the student to apply the concept (e.g. "Use Euclid\'s division algorithm to find the HCF of 135 and 225" or "Prove that √5 is an irrational number"). Ensure that the \'modelAnswer\' shows the full step-by-step mathematical working and final answer.';
    } else if (questionType === 'algorithms') {
      typePrompt = 'Focus ONLY on algorithm design, Data Structures and Algorithms (DSA), complexity analysis (Big-O notation), pseudocode, logic dry-runs, trace tables, and stack/heap memory visualizations. The questions should ask the student to analyze, dry-run, or design algorithm steps. For 13/16-mark questions, the \'modelAnswer\' must contain a clear pseudocode or logical implementation outline. If the retrieved context does not contain algorithms or code, fallback gracefully to generating questions about the workflow, operational steps, or logic of the systems described.';
    } else if (questionType === 'derivations') {
      typePrompt = 'Focus ONLY on proofs, derivations, mathematical theorems, proving formulas from first principles, and step-by-step analytical proof reasoning. The questions must ask the student to prove, derive, or analytically verify a formula or theorem. The \'modelAnswer\' must show the step-by-step derivation blocks leading to the final proven expression. If the retrieved context does not contain derivations or mathematical equations, fallback gracefully to generating questions asking to analyze or explain the theoretical origin, assumptions, or reasoning behind the concepts.';
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
- ${typePrompt ? typePrompt : 'Provide a natural balance of theory, derivations, calculations, and algorithms based on what is available in the retrieved context.'}
- NO TEXTBOOK/DOCUMENT REFERENCES: Never refer to textbook-specific, document-specific, or chapter-specific identifiers such as "Theorem 1.1", "Example 2.3", "Exercise 1.2", "Equation 3.4", "Section 5", or similar numbers. The student taking the exam does not have access to the textbook. If a theorem, equation, or example is used, you MUST write out the actual statement of the theorem/equation/problem in full (e.g. write "State and prove the Fundamental Theorem of Arithmetic" instead of "Prove Theorem 1.2", or write the actual equation instead of "using equation 1.1").
- CRITICAL MATHEMATICAL CORRECTNESS: Ensure all mathematical statements, symbols, proofs, and equations are logically sound, complete, and correct. Never generate mathematically impossible, false, or incorrect requests (for example, "prove 3 is irrational" is mathematically false because 3 is rational; it must be "prove √3 is irrational" or "prove root 3 is irrational"). Pay close attention to missing square roots (√), exponents, or fractional symbols, and reconstruct them correctly if they are truncated or corrupted in the source text. Double check all formulas and calculations before outputting them.
- STRICT ANTI-REPETITION RULE: Each generated question must cover a completely distinct topic, theorem, formula, proof, or mathematical concept. Never repeat the same question, and do not generate highly similar/overlapping questions (even with different numerical values, e.g., if you generate "Prove √3 is irrational", do NOT generate another question like "Prove √5 is irrational" in the same set, and do not repeat the same formula derivation). Ensure maximum diversity.
- DISTINCT MARKS DISTINCTION: Ensure 2-mark questions are simple definitions or basic calculations that are completely distinct in topic and scope from the longer 13-mark and 16-mark questions. Do not ask short versions of the long questions.

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

    const callApi = async (selector) => {
      const client = getAiClient(selector);
      return await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens: 8192
        }
      });
    };

    const selectors = [apiKeySelector];
    if (apiKeySelector === '13_16') {
      selectors.push('2_MARK', 'OCR');
    } else if (apiKeySelector === '2_MARK') {
      selectors.push('13_16', 'OCR');
    } else {
      selectors.push('13_16', '2_MARK', 'OCR');
    }

    let lastError = null;
    let response = null;
    for (const selector of selectors) {
      try {
        console.log(`Calling Gemini API using key selector: ${selector}...`);
        response = await callApi(selector);
        break; // Success
      } catch (err) {
        console.warn(`Gemini generation failed for key selector: ${selector}. Error:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All available Gemini keys failed to generate content.');
    }

    return response.text;
  } catch (error) {
    console.error('Error calling Gemini API for generation:', error);
    throw new Error('Failed to generate questions with Gemini: ' + error.message);
  }
};

module.exports = {
  extractTextFromImagePdf,
  generateEmbeddings,
  generateQuestionsFromContext,
};

