require('dotenv').config();
const fs = require('fs');

// Create a dummy file if it doesn't exist
if (!fs.existsSync('./test_dummy')) {
  fs.writeFileSync('./test_dummy', 'dummy pdf content');
}

// Mock req and res objects
const req = {
  file: {
    path: './test_dummy' // dummy path
  },
  body: {
    twoMark: '10',
    thirteenMark: '5',
    thirteenPattern: '8+5',
    sixteenMark: '3',
    sixteenPattern: '10+6',
    difficulty: 'Medium',
    withAnswers: 'true'
  }
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('RESPONSE STATUS:', this.statusCode || 200);
    console.log('RESPONSE BODY:', JSON.stringify(data, null, 2));
  }
};

// Get the services so we can mock them BEFORE requiring controller
const pdfService = require('./src/services/pdfService');
const geminiService = require('./src/services/geminiService');
const chromaService = require('./src/services/chromaService');

// Mock pdf extraction to return 1 chunk
pdfService.extractTextFromPdf = async () => {
  return {
    chunks: [{ chunk_id: 'chunk_001', content: 'The Bloom Taxonomy classification has six cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.' }]
  };
};

// Mock embeddings to return dummy vector
geminiService.generateEmbeddings = async (texts) => {
  return texts.map(() => Array(1536).fill(0.1));
};

// Mock ChromaDB store and query
chromaService.storeChunks = async () => true;
chromaService.querySimilarChunks = async () => {
  return [{ chunk_id: 'chunk_001', content: 'The Bloom Taxonomy classification has six cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.' }];
};
chromaService.deleteCollection = async () => true;

// Now require controller (which will call the mocked services)
const { generateQuestions } = require('./src/controllers/questionController');

async function run() {
  console.log('Running mock request to generateQuestions controller...');
  try {
    await generateQuestions(req, res);
  } catch (err) {
    console.error('Unhandled error in run:', err);
  }
}

run();
