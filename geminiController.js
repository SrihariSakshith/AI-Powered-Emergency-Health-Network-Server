import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient } from 'mongodb';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let hospitalData = '';
let donorData = ''; // Added donors data storage
let model;
let chatHistory = {}; // Temporary session-based storage

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);

      const hospitalCollection = db.collection('Hospitals');
      const donorsCollection = db.collection('Donors'); // ✅ Added donors collection

      // Fetch hospital data
      const hospitals = await hospitalCollection.find({}).toArray();
      hospitalData = JSON.stringify(hospitals, null, 2);

      // Fetch donor data
      const donors = await donorsCollection.find({}).toArray();
      donorData = JSON.stringify(donors, null, 2);

      console.log("✅ MongoDB Connected. Hospital and donor data loaded.");

      await initializeGemini();
      return;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      retries -= 1;
      console.log(`Retrying MongoDB connection (${retries} retries left)...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Failed to connect to MongoDB after multiple retries.');
  process.exit(1);
}

async function initializeGemini() {
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a hospital assistant bot designed to provide hospital and donor-related information. 
      
    - Always provide accurate and reliable data, but remind users to verify with the hospital.
    - Present hospital and donor details in plain text format.
    - If a user asks about hospitals, provide details from the following database:
      
    ${hospitalData}

    - If a user asks about blood donors, provide details from the following donor database:

    ${donorData}`,
  });
  console.log("✅ AI Model Initialized with Hospital and Donor Data.");
}

export const handleChat = async (req, res) => {
  const { message, sessionId } = req.body; // Expect sessionId from frontend

  if (!message || !sessionId) {
    return res.status(400).json({ success: false, message: 'Message and sessionId are required.' });
  }

  try {
    if (!model) {
      console.error('❌ Error: Model initialization failed.');
      return res.status(500).json({ success: false, message: 'AI Model is not initialized. Try restarting the server.' });
    }

    // Retrieve previous interaction for continuity
    const previousContext = chatHistory[sessionId] || '';
    const chat = model.startChat();

    // Append previous interaction as context
    const input = previousContext ? `Previous: ${previousContext}\nUser: ${message}` : message;

    const result = await chat.sendMessage(input);
    const responseText = result.response.text();

    // Store last interaction per session
    chatHistory[sessionId] = `User: ${message}\nBot: ${responseText}`;

    res.json({ success: true, reply: responseText });
  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
  }
};


// ✅ Ensure AI is initialized only after DB connection
connectToDatabase().catch(console.error);
