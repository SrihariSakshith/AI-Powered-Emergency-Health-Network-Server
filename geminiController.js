require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Load API Key
const apiKey = process.env.GEMINI_API_KEY;
console.log("🔄 API Key:", apiKey ? "Loaded" : "Not Loaded");

const genAI = new GoogleGenerativeAI(apiKey);

// MongoDB Connection
const url = process.env.MONGODB_URI;
console.log("🔄 MongoDB URI:", url ? "Loaded" : "Not Loaded");

const client = new MongoClient(url);
let medicalData = '';

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('hospitalDB'); // Change this to your DB name
    const collection = database.collection('medicalData'); // Change this to your collection name

    const documents = await collection.find({}).toArray();
    medicalData = JSON.stringify(documents, null, 2);
    console.log("✅ MongoDB Connected. Medical data loaded.");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

// Initialize Model
let model;
async function initializeGemini() {
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a medical bot designed to answer medical-related questions and recommend hospitals. Always provide accurate and reliable health information, but remind users to consult a doctor for medical advice. Do not disclose passwords, patient info, or admin info. Do not use markdown, stars, or next-line characters. Provide plain text responses. Here is the extracted medical database:\n${medicalData}`,
  });
  console.log("✅ AI Model Initialized.");
}

// Middleware
app.use(express.json());
app.use(cors());

// Route to handle user messages
app.post('/chat', handleChat);

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectToDatabase();
  await initializeGemini();
});

// Ensure handleChat is exported as a named export
export const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }

  try {
    if (!model) {
      console.error('❌ Error: Model initialization failed.');
      return res.status(500).json({ success: false, message: 'AI Model is not initialized. Try restarting the server.' });
    }

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
  }
};
