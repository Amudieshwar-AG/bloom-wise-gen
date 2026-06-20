const https = require('https');

// Helper to make a single direct HTTPS request to Groq API
const callGroq = async (prompt, apiKey) => {
  const postData = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const options = {
    hostname: 'api.groq.com',
    port: 443,
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
          try {
            const parsed = JSON.parse(body);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
              if (parsed.usage) {
                console.log('--- Groq Token Usage ---');
                console.log(`Prompt Tokens: ${parsed.usage.prompt_tokens}`);
                console.log(`Completion Tokens: ${parsed.usage.completion_tokens}`);
                console.log(`Total Tokens: ${parsed.usage.total_tokens}`);
                console.log('------------------------');
              }
              resolve(parsed.choices[0].message.content.trim());
            } else {
              reject(new Error('Invalid response structure from Groq'));
            }
          } catch (e) {
            reject(new Error('Failed to parse Groq response JSON: ' + e.message));
          }
        } else if (res.statusCode === 429) {
          console.error('Groq rate limit exceeded:', body);
          reject(new Error('Groq API Rate Limit Exceeded (12,000 TPM limit). Please wait 60 seconds before clicking generate again.'));
        } else {
          console.error('Groq API error details:', body);
          reject(new Error(`Groq API Error Status: ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

const generateQuestionsFromContext = async (contextChunks, config) => {
  try {
    const { twoMark, difficulty, withAnswers, excludeTopics = [] } = config;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
      throw new Error('Groq API Key is not configured in the environment variables.');
    }

    const contextText = contextChunks.map(c => `[Chunk ID: ${c.chunk_id}]\n${c.content}`).join('\n\n');

    let exclusionPrompt = '';
    if (excludeTopics.length > 0) {
      exclusionPrompt = `CRITICAL RULE: Avoid generating questions on the following topics as they are already covered: [${excludeTopics.join(', ')}]. Instead, focus on other definitions, formulas, concepts, or topics present in the retrieved context to maximize total syllabus coverage.`;
    }

    const prompt = `You are the core document analysis engine of BloomAI, an expert exam question generator specializing in Bloom's Taxonomy.
Your task is to generate examination questions based STRICTLY on the retrieved context provided below.

IMPORTANT RULES:
- Never generate questions without using the retrieved context.
- Use retrieved chunks as the source of truth.
- Always maintain chunk-to-question traceability (include the source chunk_id).
- Ensure Bloom's Taxonomy compliance (Remember, Understand, Apply, Analyze).
- Maintain a ${difficulty || 'Medium'} difficulty level.
- ${exclusionPrompt}

Configuration:
- Generate exactly ${twoMark || 0} questions worth 2 marks.
- Target Difficulty: ${difficulty || 'Medium'}
- Include Answers: ${withAnswers === 'true' || withAnswers === true}

Rules for the JSON Output:
- Respond strictly with a valid JSON object containing a single key "questions" which maps to an array of question objects. Example:
{
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "marks": 2,
      "bloom": "Remember",
      "text": "The text of the question?",
      "topic": "The topic covered",
      "sourceChunkIds": ["chunk_001"],
      "hasAnswer": true,
      "modelAnswer": "Optional model answer text"
    }
  ]
}
Each question object in the array must strictly have the structure specified above. Number the questions sequentially starting from 1.

Retrieved Context:
${contextText}
`;

    console.log('Sending question generation request to Groq API...');
    const response = await callGroq(prompt, apiKey);
    return response;
  } catch (error) {
    console.error('Error in Groq generation service:', error);
    throw new Error('Failed to generate questions with Groq: ' + error.message);
  }
};

module.exports = {
  generateQuestionsFromContext
};
