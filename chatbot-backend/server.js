const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// In-memory chat history
let chatHistory = [];

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    chatHistory.push({ role: "user", text: userMessage });
    chatHistory = chatHistory.slice(-20);

    const history = chatHistory.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chatSession = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 200 },
    });

    const result = await chatSession.sendMessage(userMessage);
    const botReply = result.response.text();

    chatHistory.push({ role: "bot", text: botReply });

    res.json({ reply: botReply });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ reply: "Sorry, something went wrong!" });
  }
});

app.get("/history", (req, res) => {
  res.json(chatHistory);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
