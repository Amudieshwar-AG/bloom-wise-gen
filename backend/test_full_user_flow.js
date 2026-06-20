require('dotenv').config();
const { extractTextFromPdf } = require('./src/services/pdfService');
const { generateEmbeddings, generateQuestionsFromContext: generateGeminiQuestions } = require('./src/services/geminiService');
const { storeChunks, querySimilarChunks, deleteCollection } = require('./src/services/chromaService');
const groqService = require('./src/services/groqService');
const crypto = require('crypto');

const userPdfPath = 'c:/Users/deves/OneDrive/Desktop/bloom-wise-gen/backend/src/uploads/dd3aa15281f149790dc569b0ca445d16';

const config = {
  twoMark: '10',
  thirteenMark: '5',
  thirteenPattern: '8+5',
  sixteenMark: '3',
  sixteenPattern: '10+6',
  difficulty: 'Medium',
  withAnswers: 'true'
};

async function test() {
  let collectionName = null;
  try {
    console.log('1. Extracting text from PDF...');
    const { chunks } = await extractTextFromPdf(userPdfPath);
    console.log(`Success: Extracted ${chunks.length} chunks.`);

    console.log('2. Generating embeddings for chunks...');
    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`Success: Generated ${embeddings.length} embeddings.`);

    for (let i = 0; i < chunks.length; i++) {
      chunks[i].embedding = embeddings[i];
    }

    console.log('3. Storing chunks in ChromaDB...');
    collectionName = `test_doc_${crypto.randomBytes(8).toString('hex')}`;
    await storeChunks(collectionName, chunks);
    console.log(`Success: Stored in collection ${collectionName}.`);

    console.log('4. Generating query embedding...');
    const queryText = `Extract important concepts, definitions, formulas, and key topics for an exam.`;
    const queryEmbeddings = await generateEmbeddings([queryText]);
    const queryEmbeddingVector = queryEmbeddings[0];
    console.log('Success: Generated query embedding.');

    console.log('5. Querying ChromaDB...');
    const topChunks = await querySimilarChunks(collectionName, queryEmbeddingVector, 10);
    console.log(`Success: Retrieved ${topChunks.length} chunks.`);

    console.log('6. Generating 13/16 mark questions with Gemini...');
    const longQuestionConfig = { ...config, twoMark: 0 };
    const geminiQuestionsString = await generateGeminiQuestions(topChunks, longQuestionConfig);
    const cleanedString = geminiQuestionsString.replace(/```json/g, '').replace(/```/g, '').trim();
    let longQuestions = JSON.parse(cleanedString);
    if (!Array.isArray(longQuestions)) {
      longQuestions = longQuestions.questions || [];
    }
    console.log(`Success: Generated ${longQuestions.length} long questions from Gemini.`);

    console.log('7. Generating 2-mark questions with Groq...');
    const excludeTopics = longQuestions.map(q => q.topic).filter(t => t && t.trim() !== '');
    const shortQuestionConfig = { 
      twoMark: config.twoMark, 
      difficulty: config.difficulty, 
      withAnswers: config.withAnswers,
      excludeTopics: excludeTopics
    };
    
    const groqChunks = topChunks.slice(0, 6);
    const groqQuestionsString = await groqService.generateQuestionsFromContext(groqChunks, shortQuestionConfig);
    const parsed = JSON.parse(groqQuestionsString);
    const shortQuestions = parsed.questions || parsed;
    console.log(`Success: Generated ${shortQuestions.length} 2-mark questions from Groq.`);

    const merged = [...longQuestions, ...shortQuestions];
    merged.sort((a, b) => Number(a.marks) - Number(b.marks));
    merged.forEach((q, idx) => {
      q.number = idx + 1;
      q.id = `q${idx + 1}`;
    });

    console.log(`Success: Merged into ${merged.length} total questions.`);
    console.log(JSON.stringify(merged.slice(0, 3), null, 2)); // log first 3 questions
  } catch (err) {
    console.error('FLOW FAILED WITH ERROR:', err);
  } finally {
    if (collectionName) {
      console.log('Cleaning up Chroma collection...');
      await deleteCollection(collectionName);
    }
  }
}

test();
