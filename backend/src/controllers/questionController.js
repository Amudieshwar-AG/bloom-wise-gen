const { extractTextFromPdf } = require('../services/pdfService');
const { generateQuestionsFromText } = require('../services/geminiService');
const fs = require('fs');

const generateQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const filePath = req.file.path;
    
    // Extract configuration from the form data
    const config = {
      twoMark: req.body.twoMark || 0,
      thirteenMark: req.body.thirteenMark || 0,
      sixteenMark: req.body.sixteenMark || 0,
      difficulty: req.body.difficulty || 'Medium',
      withAnswers: req.body.withAnswers,
    };

    // 1. Extract text from the uploaded PDF
    const extractedText = await extractTextFromPdf(filePath);

    // 2. Generate questions from the text using Gemini and the user's config
    const questionsString = await generateQuestionsFromText(extractedText, config);

    // 3. Clean up: Delete the uploaded file after processing
    fs.unlinkSync(filePath);

    // 4. Parse the generated JSON and send it back
    const questions = JSON.parse(questionsString);
    res.json({ questions });
  } catch (error) {
    console.error('Error in generateQuestions controller:', error);
    res.status(500).json({ error: 'Failed to generate questions from PDF. ' + error.message });
  }
};

module.exports = {
  generateQuestions,
};
