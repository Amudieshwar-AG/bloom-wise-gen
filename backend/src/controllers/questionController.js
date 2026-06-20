const { extractTextFromPdf, chunkText } = require('../services/pdfService');
const { generateEmbeddings, generateQuestionsFromContext, extractTextFromImagePdf } = require('../services/geminiService');
const { storeChunks, querySimilarChunks, deleteCollection } = require('../services/chromaService');
const fs = require('fs');
const crypto = require('crypto');

const generateQuestions = async (req, res) => {
  let collectionName = null;
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    // Extract configuration from the form data
    const config = {
      twoMark: req.body.twoMark || 0,
      thirteenMark: req.body.thirteenMark || 0,
      sixteenMark: req.body.sixteenMark || 0,
      thirteenPattern: req.body.thirteenPattern || 'single',
      sixteenPattern: req.body.sixteenPattern || 'single',
      difficulty: req.body.difficulty || 'Medium',
      withAnswers: req.body.withAnswers,
    };

    // 1 & 2. Extract and chunk text from the uploaded PDF
    let chunks = [];
    try {
      const parsed = await extractTextFromPdf(filePath);
      chunks = parsed.chunks || [];
    } catch (parseError) {
      console.warn('pdf-parse failed to read PDF structure. Proceeding to OCR fallback...', parseError.message);
    }
    
    // Fallback: If pdf-parse couldn't extract text (e.g., scanned/image-based PDF)
    if (!chunks || chunks.length === 0) {
      console.log('No text extracted using pdf-parse. Falling back to Gemini OCR...');
      const ocrText = await extractTextFromImagePdf(filePath);
      if (ocrText && ocrText.trim()) {
        const { chunkText } = require('../services/pdfService');
        chunks = chunkText(ocrText);
      }
      
      if (!chunks || chunks.length === 0) {
        throw new Error('The uploaded PDF appears to be empty, corrupted, or has no readable text. Please upload a valid study material PDF.');
      }
    }

    // Validate if the document contains sufficient content (reject short/single-topic PDFs)
    const totalCharCount = chunks.reduce((acc, chunk) => acc + (chunk.content ? chunk.content.length : 0), 0);
    if (totalCharCount < 2000) { // ~300-350 words minimum
      return res.status(400).json({
        error: 'The uploaded document contains too little content (less than ~300 words). Please upload a comprehensive semester unit, chapter, or study material PDF with sufficient text to generate a full question bank.'
      });
    }

    // 3. Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);
    
    // Assign embeddings to chunks
    for (let i = 0; i < chunks.length; i++) {
      chunks[i].embedding = embeddings[i];
    }

    // 4. Store chunks in ChromaDB
    // Use a unique collection name for this document to isolate the context
    collectionName = `doc_${crypto.randomBytes(8).toString('hex')}`;
    await storeChunks(collectionName, chunks);

    // 5 & 6. Query Understanding and Query Embedding
    const queryText = `Extract important concepts, definitions, formulas, and key topics for an exam.`;
    const queryEmbeddings = await generateEmbeddings([queryText]);
    const queryEmbeddingVector = queryEmbeddings[0];

    // 7. Similarity Search / Retrieval
    // Retrieve the top 10 most relevant chunks
    const topChunks = await querySimilarChunks(collectionName, queryEmbeddingVector, 10);

    // 8 & 9. Context Assembly and Question Generation
    let questions = [];
    const useGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_key_here' && process.env.GROQ_API_KEY.trim() !== '';

    // Step A: Generate 13 & 16 mark questions using Gemini (takes up to 10 chunks of context)
    const longQuestionConfig = { ...config, twoMark: 0, apiKeySelector: '13_16' };
    let longQuestions = [];
    
    if (Number(config.thirteenMark) > 0 || Number(config.sixteenMark) > 0) {
      console.log('Generating 13/16 mark questions using Gemini...');
      const geminiQuestionsString = await generateQuestionsFromContext(topChunks, longQuestionConfig);
      try {
        const cleanedString = geminiQuestionsString.replace(/```json/g, '').replace(/```/g, '').trim();
        longQuestions = JSON.parse(cleanedString);
        if (!Array.isArray(longQuestions)) {
          longQuestions = longQuestions.questions || [];
        }
      } catch (e) {
        console.error('Failed to parse Gemini output as JSON:', geminiQuestionsString);
        throw new Error('Failed to generate 13/16-mark questions. Gemini output was not valid JSON.');
      }
    }
    
    questions.push(...longQuestions);

    // Step B: Generate 2-mark questions using Groq if key is present (otherwise use Gemini)
    if (Number(config.twoMark) > 0) {
      const excludeTopics = longQuestions.map(q => q.topic).filter(t => t && t.trim() !== '');
      const shortQuestionConfig = { 
        twoMark: config.twoMark, 
        difficulty: config.difficulty, 
        withAnswers: config.withAnswers,
        excludeTopics: excludeTopics
      };
      
      // We pass the top 6 chunks to Groq to stay under 12,000 TPM limit
      const groqChunks = topChunks.slice(0, 6);
      let shortQuestions = [];
      let groqFailed = false;

      if (useGroq) {
        try {
          console.log('Generating 2-mark questions using Groq...');
          const groqService = require('../services/groqService');
          const groqQuestionsString = await groqService.generateQuestionsFromContext(groqChunks, shortQuestionConfig);
          const parsed = JSON.parse(groqQuestionsString);
          shortQuestions = parsed.questions || parsed;
        } catch (e) {
          console.warn('Groq generation failed or rate limited, falling back to Gemini:', e.message);
          groqFailed = true;
        }
      }

      if (!useGroq || groqFailed) {
        console.log('Generating 2-mark questions using Gemini (fallback on 2_MARK key)...');
        const geminiShortConfig = { ...shortQuestionConfig, thirteenMark: 0, sixteenMark: 0, apiKeySelector: '2_MARK' };
        const geminiQuestionsString = await generateQuestionsFromContext(topChunks, geminiShortConfig);
        try {
          const cleanedString = geminiQuestionsString.replace(/```json/g, '').replace(/```/g, '').trim();
          shortQuestions = JSON.parse(cleanedString);
          if (!Array.isArray(shortQuestions)) {
            shortQuestions = shortQuestions.questions || [];
          }
        } catch (e) {
          console.error('Failed to parse Gemini output for 2-marks as JSON:', geminiQuestionsString);
          throw new Error('Failed to generate 2-mark questions with Gemini fallback.');
        }
      }

      questions.push(...shortQuestions);
    }

    // Sort questions by marks (2-marks first, then 13, then 16) and renumber sequentially
    questions.sort((a, b) => Number(a.marks) - Number(b.marks));
    questions.forEach((q, idx) => {
      q.number = idx + 1;
      q.id = `q${idx + 1}`;
    });

    res.json({ questions });
  } catch (error) {
    console.error('Error in generateQuestions controller:', error);
    res.status(500).json({ error: 'Failed to generate questions from PDF. ' + error.message });
  } finally {
    // Clean up: Delete the uploaded file after processing
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Clean up: Delete the ChromaDB collection to free up memory
    if (collectionName) {
      await deleteCollection(collectionName);
    }
  }
};

module.exports = {
  generateQuestions,
};
