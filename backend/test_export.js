const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  format: 'docx',
  questions: [
    {
      number: 1,
      marks: 13,
      bloom: 'Analyze',
      text: 'Analyze the impact of AI on society.',
      topic: 'Artificial Intelligence',
      modelAnswer: '1. Economic shifts\n2. Job automation\n3. Ethical concerns'
    },
    {
      number: 2,
      marks: 2,
      bloom: 'Remember',
      text: 'What is the full form of AI?',
      topic: 'Artificial Intelligence',
      modelAnswer: 'Artificial Intelligence'
    }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/export',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  const fileStream = fs.createWriteStream('test_output.docx');
  res.pipe(fileStream);
  
  fileStream.on('finish', () => {
    console.log('Downloaded test_output.docx successfully!');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
