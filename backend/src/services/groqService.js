const https = require('https');

// Helper to make a single direct HTTPS request to Groq API
const callGroqWithRetry = async (prompt, apiKey) => {
  let attempts = 3;
  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    try {
      if (i > 0) {
        console.warn(`Groq rate limited. Retrying attempt ${i + 1}/${attempts} after 3s delay...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      return await callGroq(prompt, apiKey);
    } catch (err) {
      lastError = err;
      if (!err.message.includes('Rate Limit') && !err.message.includes('429')) {
        throw err;
      }
    }
  }
  throw lastError || new Error('Groq API failed after multiple retries.');
};

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
    const { 
      twoMark, 
      thirteenMark = 0, 
      sixteenMark = 0, 
      thirteenPattern = 'single', 
      sixteenPattern = 'single', 
      difficulty, 
      withAnswers, 
      excludeTopics = [], 
      excludeQuestionTexts = [],
      questionType = 'mixed' 
    } = config;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
      throw new Error('Groq API Key is not configured in the environment variables.');
    }

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
      typePrompt = 'Focus ONLY on algorithm design, Data Structures and Algorithms (DSA), complexity analysis (Big-O notation), pseudocode, logic dry-runs, trace tables, and stack/heap memory visualizations. The questions should ask the student to analyze, dry-run, or design algorithm steps. The \'modelAnswer\' must contain a clear pseudocode or logical implementation outline. If the retrieved context does not contain algorithms or code, fallback gracefully to generating questions about the workflow, operational steps, or logic of the systems described.';
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
- Ensure Bloom's Taxonomy compliance (Remember, Understand, Apply, Analyze, Evaluate, Create).
- Maintain a ${difficulty || 'Medium'} difficulty level.
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

Rules for the JSON Output:
- Respond strictly with a valid JSON object containing a single key "questions" which maps to an array of question objects. Example:
{
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "marks": 2, // integer: 2, 13, or 16
      "bloom": "Remember", // string: strictly one of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
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
    const response = await callGroqWithRetry(prompt, apiKey);
    return response;
  } catch (error) {
    console.error('Error in Groq generation service:', error);
    throw new Error('Failed to generate questions with Groq: ' + error.message);
  }
};

module.exports = {
  generateQuestionsFromContext
};
