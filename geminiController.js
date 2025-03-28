import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient } from 'mongodb';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let hospitalData = ''; // Now it stores hospital data instead of medical data
let model;

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);
      const hospitalCollection = db.collection('Hospitals'); // Use 'Hospitals' collection
      const documents = await hospitalCollection.find({}).toArray();
      hospitalData = JSON.stringify(documents, null, 2);
      console.log("✅ MongoDB Connected. Hospital data loaded.");

      // ✅ Initialize AI model **only after** fetching hospital data
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
    systemInstruction: `You are a hospital assistant bot designed to provide hospital-related information and recommend hospitals based on user queries. 
      
    - Always provide accurate and reliable data, but remind users to verify with the hospital for the latest details. 
    - Do NOT format responses using asterisks (*), underscores (_), bullet points, or markdown-like formatting. 
    - Present hospital names and details in a plain text format without special characters. 
    - If listing multiple hospitals, separate them using commas or line breaks, but do NOT use numbering or special symbols. 
      
    Here is the extracted hospital database:\n${hospitalData}`,
  });
  console.log("✅ AI Model Initialized with Hospital Data.");
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
    
    const text = result.response.text();

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
  }
};

// ✅ Ensure AI is initialized only after DB connection
connectToDatabase().catch(console.error);
