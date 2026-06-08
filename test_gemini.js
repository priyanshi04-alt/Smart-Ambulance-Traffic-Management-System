const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Loaded API Key length:", apiKey ? apiKey.length : 0);
if (apiKey) {
  console.log("Key starts with:", apiKey.substring(0, 5));
}

const tests = [
  { name: 'v1beta gemini-1.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent' },
  { name: 'v1 gemini-1.5-flash', url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent' },
  { name: 'v1beta gemini-pro', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent' },
  { name: 'v1 gemini-pro', url: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent' },
  { name: 'v1beta gemini-2.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent' }
];

async function runTests() {
  for (const t of tests) {
    console.log(`\nTesting ${t.name}...`);
    try {
      const res = await fetch(`${t.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      if (res.ok) {
        console.log("Success! Response snippet:", JSON.stringify(data).substring(0, 150));
        console.log(`=== WINNER: ${t.name} ===`);
        process.exit(0);
      } else {
        console.log("Error response:", JSON.stringify(data));
      }
    } catch (err) {
      console.log("Fetch error:", err.message);
    }
  }
}

runTests();
