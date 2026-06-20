const fs = require('fs');
const pdfParse = require('pdf-parse');

const cleanText = (text) => {
  return text
    // Replace multiple spaces with a single space
    .replace(/[ \t]+/g, ' ')
    // Remove empty lines and consecutive line breaks
    .replace(/\n\s*\n/g, '\n')
    // Remove common unwanted characters
    .replace(/\f/g, '') // form feeds
    .trim();
};

const chunkText = (text, minTokens = 700, maxTokens = 1000, overlapTokens = 150) => {
  // Approximate tokens to characters (1 token ~= 4 chars)
  const minChars = minTokens * 4;
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const chunks = [];
  const paragraphs = text.split('\n');

  let currentChunk = '';
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    // If adding this paragraph exceeds our chunk limit and we've reached min size
    if (currentChunk.length + para.length > maxChars && currentChunk.length > minChars) {
      chunks.push(currentChunk.trim());

      // Calculate overlap from the end of the current chunk
      let overlapText = currentChunk.slice(-overlapChars);
      const firstSpace = overlapText.indexOf(' ');
      if (firstSpace !== -1) {
        overlapText = overlapText.slice(firstSpace + 1);
      }
      currentChunk = overlapText + '\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + para;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((chunk, index) => ({
    chunk_id: `chunk_${String(index + 1).padStart(3, '0')}`,
    content: chunk,
  }));
};

const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    // Step 3: Clean Text
    const cleanedText = cleanText(data.text);

    // Step 4: Semantic Chunking
    const chunks = chunkText(cleanedText);

    return {
      text: cleanedText,
      chunks: chunks,
      metadata: {
        total_pages: data.numpages,
        info: data.info
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to parse PDF file.');
  }
};

module.exports = {
  extractTextFromPdf,
  cleanText,
  chunkText
};
