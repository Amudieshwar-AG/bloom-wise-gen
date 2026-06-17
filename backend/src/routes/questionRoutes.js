const express = require('express');
const multer = require('multer');
const { generateQuestions } = require('../controllers/questionController');

const router = express.Router();

// Configure multer to save uploaded files to src/uploads/
const upload = multer({ dest: 'src/uploads/' });

// Define the POST route for generating questions from a PDF
router.post('/generate', upload.single('pdf'), generateQuestions);

module.exports = router;
