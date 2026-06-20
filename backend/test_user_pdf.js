const { extractTextFromPdf } = require('./src/services/pdfService');
const path = require('path');

const userPdfPath = 'c:/Users/deves/OneDrive/Desktop/bloom-wise-gen/backend/src/uploads/dd3aa15281f149790dc569b0ca445d16';

async function run() {
  console.log('Testing text extraction on the uploaded PDF file:', userPdfPath);
  try {
    const result = await extractTextFromPdf(userPdfPath);
    console.log('Text extraction successful!');
    console.log('Number of pages:', result.metadata.total_pages);
    console.log('Number of chunks:', result.chunks.length);
    if (result.chunks.length > 0) {
      console.log('First chunk preview:', result.chunks[0].content.slice(0, 200));
    }
  } catch (err) {
    console.error('Text extraction failed with error:');
    console.error(err);
  }
}

run();
