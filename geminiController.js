import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient } from 'mongodb';

dotenv.config(); // Load environment variables

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let medicalData = '';
let model;

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);
      const collection = db.collection('medicalData'); // Change this to your collection name
      const documents = await collection.find({}).toArray();
      medicalData = JSON.stringify(documents, null, 2);
      console.log("✅ MongoDB Connected. Medical data loaded.");
      return;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      retries -= 1;
      console.log(`Retrying MongoDB connection (${retries} retries left)...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Failed to connect to MongoDB after multiple retries.');
  process.exit(1); // Exit if all retries fail
}

async function initializeGemini() {
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a medical bot designed to answer medical-related questions and recommend hospitals. Always provide accurate and reliable health information, but remind users to consult a doctor for medical advice. Do not disclose passwords, patient info, or admin info. Do not use markdown, stars, or next-line characters. Provide plain text responses. Here is the extracted medical database:\n${medicalData}`,
  });
  console.log("✅ AI Model Initialized.");
}

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

// Initialize database and model on startup
connectToDatabase().then(initializeGemini).catch(console.error);
