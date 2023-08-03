const https = require('https');

const data = JSON.stringify({
  "messages": [{"role":"user","content":"Say hi"}],
  "max_tokens": 800,
  "temperature": 0.7,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "top_p": 0.95,
  "stop": null
});

const options = {
  hostname: 'alfalakai.openai.azure.com',
  path: '/openai/deployments/completion35/chat/completions?api-version=2023-03-15-preview',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'api-key': 'YOUR_API_KEY'
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
