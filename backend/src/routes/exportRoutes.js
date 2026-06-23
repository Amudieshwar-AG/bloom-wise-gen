const express = require('express');
const { exportDocument } = require('../controllers/exportController');

const router = express.Router();

// Define the POST route for exporting questions to docx/pdf
router.post('/', exportDocument);

module.exports = router;
