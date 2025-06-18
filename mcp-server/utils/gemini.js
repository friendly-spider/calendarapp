const axios = require("axios");

const SYSTEM_PROMPT = `
You are a backend assistant for a calendar application.
Respond ONLY with JSON using this structure:

{
  "agent": "calendar",
  "action": "createEvent",
  "input": {
    "title": "Team Sync",
    "startTime": "2025-06-22T15:00:00Z",
    "endTime": "2025-06-22T16:00:00Z",
    "tag": "work",
    ...
  }
}

Do NOT use markdown. Do NOT include \`\`\`. Only return raw JSON.
`;

async function invokeGemini(prompt) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4
    }
  };

  try {
    const res = await axios.post(endpoint, requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text.trim();

    // Clean any markdown code block syntax
    const cleaned = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    throw new Error("Failed to get valid response from Gemini.");
  }
}

module.exports = { invokeGemini };