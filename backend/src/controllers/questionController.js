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
      questionType: req.body.questionType || 'mixed',
    };

    // 1 & 2. Extract and chunk text from the uploaded PDF
    let chunks = [];
    let extractedText = '';
    
    // Prioritize Gemini OCR for math, derivation, and algorithm PDF sources to preserve mathematical symbols (e.g. √3) and structured code.
    const isMathOrTechnical = ['maths', 'derivations', 'algorithms'].includes(config.questionType);
    
    if (isMathOrTechnical) {
      try {
        console.log('Technical question type focus selected. Attempting high-fidelity Gemini OCR first...');
        extractedText = await extractTextFromImagePdf(filePath);
      } catch (ocrError) {
        console.warn('Gemini OCR failed for technical PDF. Falling back to pdf-parse...', ocrError.message);
      }
    }
    
    if (!extractedText) {
      try {
        console.log('Attempting text extraction using pdf-parse...');
        const parsed = await extractTextFromPdf(filePath);
        extractedText = parsed.text || '';
      } catch (parseError) {
        console.warn('pdf-parse failed to read PDF structure.', parseError.message);
      }
    }
    
    // If not a technical type (so we ran pdf-parse first) and it yielded no text, or if we still have no text
    if (!extractedText || !extractedText.trim()) {
      try {
        console.log('No text extracted or only whitespace. Attempting Gemini OCR fallback...');
        extractedText = await extractTextFromImagePdf(filePath);
      } catch (ocrError) {
        console.error('Gemini OCR fallback failed:', ocrError.message);
      }
    }
    
    if (extractedText && extractedText.trim()) {
      const { chunkText } = require('../services/pdfService');
      chunks = chunkText(extractedText);
    } else {
      throw new Error('The uploaded PDF appears to be empty, corrupted, or has no readable text. Please upload a valid study material PDF.');
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
      let geminiQuestionsString;
      let geminiFailed = false;
      try {
        geminiQuestionsString = await generateQuestionsFromContext(topChunks, longQuestionConfig);
        const cleanedString = geminiQuestionsString.replace(/```json/g, '').replace(/```/g, '').trim();
        longQuestions = JSON.parse(cleanedString);
        if (!Array.isArray(longQuestions)) {
          longQuestions = longQuestions.questions || [];
        }
      } catch (e) {
        console.warn('Gemini 13/16 mark generation failed, checking for Groq fallback:', e.message);
        geminiFailed = true;
      }

      if (geminiFailed) {
        if (useGroq) {
          try {
            console.log('Generating 13/16 mark questions using Groq fallback...');
            const groqService = require('../services/groqService');
            const groqQuestionsString = await groqService.generateQuestionsFromContext(topChunks, {
              ...longQuestionConfig,
              twoMark: 0,
              thirteenMark: config.thirteenMark,
              sixteenMark: config.sixteenMark
            });
            const parsed = JSON.parse(groqQuestionsString);
            longQuestions = parsed.questions || parsed;
          } catch (groqErr) {
            console.error('Groq 13/16 mark fallback failed:', groqErr.message);
            throw new Error('Failed to generate 13/16-mark questions with both Gemini and Groq: ' + groqErr.message);
          }
        } else {
          throw new Error('Gemini generation failed, and Groq is not configured as a fallback. Please check your Gemini API key status.');
        }
      }
    }
    
    questions.push(...longQuestions);

    // Step B: Generate 2-mark questions using Groq if key is present (otherwise use Gemini)
    if (Number(config.twoMark) > 0) {
      const excludeTopics = longQuestions.map(q => q.topic).filter(t => t && t.trim() !== '');
      const excludeQuestionTexts = longQuestions.map(q => q.text).filter(t => t && t.trim() !== '');
      const shortQuestionConfig = { 
        twoMark: config.twoMark, 
        difficulty: config.difficulty, 
        withAnswers: config.withAnswers,
        excludeTopics: excludeTopics,
        excludeQuestionTexts: excludeQuestionTexts,
        questionType: config.questionType
      };
      
      // We pass the top 3 chunks to Groq to stay under rate limits
      const groqChunks = topChunks.slice(0, 3);
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

    // Programmatic auto-repair of common math errors (like converting "prove 3 is irrational" to "prove √3 is irrational")
    const fixMathPhrasing = (text) => {
      if (typeof text !== 'string') return text;
      
      // Match "prove/show that <number> is (an) irrational" (case-insensitive)
      let repaired = text.replace(
        /\b(prove|show)\s+(that\s+)?(\d+)\s+is\s+(an\s+)?irrational\b/gi,
        (match, verb, thatWord, num, anWord) => {
          return `${verb} ${thatWord || ''}√${num} is ${anWord || ''}irrational`;
        }
      );
      
      return repaired;
    };

    questions.forEach((q) => {
      if (q.text) q.text = fixMathPhrasing(q.text);
      if (q.modelAnswer) q.modelAnswer = fixMathPhrasing(q.modelAnswer);
    });

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
