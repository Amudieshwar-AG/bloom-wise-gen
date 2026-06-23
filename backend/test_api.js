const http = require('http');
const fs = require('fs');

const run = async () => {
  const filePath = './src/uploads/742d147fef9d43a677fc90bf8ce2911b'; // Using an existing large file
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

  const payloadHeader = 
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="twoMark"\r\n\r\n10\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="thirteenMark"\r\n\r\n5\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="sixteenMark"\r\n\r\n3\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="thirteenPattern"\r\n\r\nsingle\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="sixteenPattern"\r\n\r\nsingle\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="difficulty"\r\n\r\nMedium\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="withAnswers"\r\n\r\nfalse\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="pdf"; filename="test.pdf"\r\n' +
    'Content-Type: application/pdf\r\n\r\n';

  const payloadFooter = '\r\n--' + boundary + '--\r\n';
  const fileData = fs.readFileSync(filePath);
  const contentLength = Buffer.byteLength(payloadHeader) + fileData.length + Buffer.byteLength(payloadFooter);

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/questions/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
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

  req.on('error', (err) => console.error(err));
  req.write(payloadHeader);
  req.write(fileData);
  req.write(payloadFooter);
  req.end();
};

run();
