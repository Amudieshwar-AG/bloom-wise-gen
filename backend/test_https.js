require('dotenv').config();
const https = require('https');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const texts = ["Hello", "World"];

  const requests = texts.map(t => ({
    model: 'models/gemini-embedding-2',
    content: { parts: [{ text: t }] }
  }));

  const postData = JSON.stringify({ requests });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("Success! Status:", res.statusCode);
          resolve(JSON.parse(data));
        } else {
          console.error("Error! Status:", res.statusCode, data);
          reject(new Error(`API Error ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

test().catch(console.error);
