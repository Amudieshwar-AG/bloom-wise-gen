const fs = require('fs');
const pdfParse = require('pdf-parse');

const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to parse PDF file.');
  }
};

module.exports = {
  extractTextFromPdf,
};
