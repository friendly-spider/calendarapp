const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { invokeGemini } = require("./utils/gemini");
const { handleMCP } = require("./utils/handleMCP");
require("dotenv").config();

const Event = require("./models/Event");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
  console.log("Using database:", mongoose.connection.name);
});

// MCP-compatible query endpoint
app.post("/query", async (req, res) => {
  const { agent, action, input = {} } = req.body;

  if (agent !== "calendar") {
    return res.status(404).json({ error: "Unknown agent" });
  }

  try {
    let result;
    switch (action) {
      case "listEvents":
        result = await Event.find();
        break;
      case "createEvent":
        const newEvent = new Event(input);
        await newEvent.save();
        result = newEvent;
        break;
      case "updateEvent":
        result = await Event.findByIdAndUpdate(input._id, input, { new: true });
        break;
      case "deleteEvent":
        await Event.findByIdAndDelete(input._id);
        result = { success: true };
        break;
      case "listCalendars":
        result = await Calendar.find();
        break;
      case "createCalendar":
        const newCal = new Calendar(input);
        await newCal.save();
        result = newCal;
        break;
      default:
        return res.status(400).json({ error: "Unknown action" });
    }

    res.json({ result });
  } catch (err) {
    console.error("MCP query error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  try {
    const structured = await invokeGemini(prompt);
    if (!structured?.agent || !structured?.action) {
      throw new Error("Gemini did not return a valid MCP JSON.");
    }
    const result = await handleMCP(structured.agent, structured.action, structured.input || {});
    res.json({ result });
  } catch (err) {
    console.error("Gemini chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`MCP Server running on port ${PORT}`));
