const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

const generateQuestionsFromText = async (text, config) => {
  try {
    const { twoMark, thirteenMark, sixteenMark, difficulty, withAnswers } = config;

    const prompt = `You are an expert exam question generator specializing in Bloom's Taxonomy.
Based on the following extracted text, generate a JSON array of exam questions.

Configuration:
- Generate exactly ${twoMark || 0} questions worth 2 marks.
- Generate exactly ${thirteenMark || 0} questions worth 13 marks.
- Generate exactly ${sixteenMark || 0} questions worth 16 marks.
- Target Difficulty: ${difficulty || 'Medium'}
- Include Answers: ${withAnswers === 'true' || withAnswers === true}

Rules for the JSON Output:
- Respond strictly with a valid JSON array of objects.
- Each object must have the following structure:
{
  "id": "q1", // unique string identifier
  "number": 1, // integer starting from 1
  "marks": 2, // integer: either 2, 13, or 16
  "bloom": "Remember", // string: strictly one of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
  "text": "The text of the question?", // string
  "hasAnswer": true // boolean
}

Do NOT wrap the JSON in markdown blocks (e.g., \`\`\`json). Return ONLY the raw JSON array.

Extracted Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate content with Gemini.');
  }
};

module.exports = {
  generateQuestionsFromText,
};
