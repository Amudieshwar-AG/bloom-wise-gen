require('dotenv').config();
const { generateQuestionsFromContext } = require('./src/services/groqService');

const testChunks = [
  {
    chunk_id: 'chunk_001',
    content: 'The Bloom Taxonomy classification has six cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.'
  }
];

const testConfig = {
  twoMark: 1,
  thirteenMark: 1,
  thirteenPattern: '8+5',
  sixteenMark: 1,
  sixteenPattern: '10+6',
  difficulty: 'Medium',
  withAnswers: true
};

async function test() {
  console.log('Starting Groq API test...');
  console.log('Using API key prefix:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.slice(0, 10) + '...' : 'Undefined');
  
  try {
    const result = await generateQuestionsFromContext(testChunks, testConfig);
    console.log('Raw output from Groq:\n', result);
    const parsed = JSON.parse(result);
    console.log('Successfully parsed output:', JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

test();
