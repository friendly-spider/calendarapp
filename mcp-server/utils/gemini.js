const axios = require("axios");
const todayISO = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT =
  `You are an AI backend assistant for a calendar application.

Today is ${todayISO}.
You must always return a JSON object in this exact format:

{
  "agent": "calendar",
  "action": "createEvent" | "updateEvent" | "deleteEvent" | "listEvents",
  "input": {
    "_id": "6852519645fc20fd027f7706",
    "title": "Team Sync",
    "description": "Weekly sync meeting",
    "location": "Zoom",
    "startTime": "2025-06-20T14:00:00.000",
    "endTime": "2025-06-20T15:00:00.000",
    "status": "confirmed",
    "isAllDay": false,
    "tag": "work",
    "__v": 0
  }
}

Rules:

- Only return the JSON object. Do not include markdown, explanations, or code fences.
- Always use ISO 8601 format for startTime and endTime (e.g. "2025-06-21T10:00:00"). Do NOT include the "Z" timezone suffix.

Action-specific instructions:

- "createEvent":
  - Include all necessary fields in input. Do not include _id.

- "updateEvent":
  - Must include either _id or a title to identify the event.
  - Only include fields that should be updated.

- "deleteEvent":
  - Must include either _id or a title to identify the event.

- "listEvents":
  - Leave the input object empty: {}

If you do not have enough context to perform the action, return only the agent, action, and an empty input like this:

{
  "agent": "calendar",
  "action": "deleteEvent",
  "input": {}
}`;

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