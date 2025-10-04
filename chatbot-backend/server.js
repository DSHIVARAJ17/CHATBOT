

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(bodyParser.json());

// ✅ In-memory chat history
let chatHistory = [];

// ✅ Chat route with memory
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // Save user message to memory
    chatHistory.push({ role: "user", text: userMessage });

    // Keep only last 20 messages
    chatHistory = chatHistory.slice(-20);

    // Map to Gemini-compatible history
    const history = chatHistory.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // Start chat session
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chatSession = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 200 },
    });

    // Send latest message
    const result = await chatSession.sendMessage(userMessage);
    const botReply = result.response.text();

    // Save bot reply
    chatHistory.push({ role: "bot", text: botReply });

    res.json({ reply: botReply });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ reply: "Sorry, something went wrong!" });
  }
});

// ✅ Endpoint to view history
app.get("/history", (req, res) => {
  res.json(chatHistory);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
