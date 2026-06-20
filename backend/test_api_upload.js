const http = require('http');
const fs = require('fs');

// Create a dummy PDF file
fs.writeFileSync('./test_upload.pdf', '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 40 >>\nstream\nBT /F1 12 Tf 72 712 Td (The Bloom Taxonomy classification has six cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000223 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n314\n%%EOF');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const payloadHeader = 
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="twoMark"\r\n\r\n1\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="thirteenMark"\r\n\r\n1\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="sixteenMark"\r\n\r\n1\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="thirteenPattern"\r\n\r\n8+5\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="sixteenPattern"\r\n\r\n10+6\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="difficulty"\r\n\r\nMedium\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="withAnswers"\r\n\r\ntrue\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="pdf"; filename="test_upload.pdf"\r\n` +
  `Content-Type: application/pdf\r\n\r\n`;

const payloadFooter = `\r\n--${boundary}--\r\n`;

const fileData = fs.readFileSync('./test_upload.pdf');
const contentLength = Buffer.byteLength(payloadHeader) + fileData.length + Buffer.byteLength(payloadFooter);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/questions/generate',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': contentLength
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('API RESPONSE STATUS:', res.statusCode);
    console.log('API RESPONSE BODY:', body);
  });
});

req.on('error', (err) => {
  console.error('Request failed:', err);
});

req.write(payloadHeader);
req.write(fileData);
req.write(payloadFooter);
req.end();
