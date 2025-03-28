import fetch from 'node-fetch';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;
const apiKey = process.env.GEMINI_API_KEY; // Access API key from environment variables

let db;
let geminiCollection;
let medicalData;
let model;
let chatHistories = [];
const MAX_CHAT_HISTORY = 50; // Limit chat history to avoid memory issues

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);
      geminiCollection = db.collection('Gemini');
      console.log(`✅ Connected to MongoDB database: ${dbName}`);
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

async function fetchAllData() {
  try {
    const collections = await db.listCollections().toArray();
    const data = {};
    for (const collection of collections) {
      const collectionName = collection.name;
      const collectionData = await db.collection(collectionName).find().toArray();
      data[collectionName] = collectionData;
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return 'Medical data unavailable.'; // Fallback text
  }
}

async function initializeGemini() {
  try {
    await connectToDatabase();
    medicalData = await fetchAllData(); // Load data once on startup
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `You are a medical bot designed to answer medical-related questions and recommend hospitals. Always provide accurate and reliable health information, but remind users to consult a doctor for medical advice. Do not disclose passwords, patient info, or admin info. Do not use markdown, stars, or next-line characters. Provide plain text responses. Here is the extracted medical database:\n${medicalData}`,
    });
    console.log('✅ Gemini and database initialized.');
  } catch (error) {
    console.error('❌ Error initializing Gemini:', error);
    process.exit(1); // Exit if initialization fails
  }
}

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

export const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    if (!model) {
      console.error('❌ Error: Model is not initialized.');
      return res.status(500).json({ success: false, message: 'Model is not initialized. Please try again later.' });
    }

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistories,
    });

    const result = await chatSession.sendMessage(message);

    if (!result || !result.response) {
      console.error('❌ Error: Invalid response from the model.');
      return res.status(500).json({ success: false, message: 'Invalid response from the model. Please try again later.' });
    }

    const responseText = result.response.text();

    // Manage chat history size
    chatHistories.push({ role: 'user', parts: [{ text: message }] });
    chatHistories.push({ role: 'model', parts: [{ text: responseText }] });
    if (chatHistories.length > MAX_CHAT_HISTORY) {
      chatHistories.shift(); // Remove the oldest entry
    }

    res.status(200).json({ success: true, response: responseText });
  } catch (error) {
    console.error('❌ Error in handleChat:', error);
    res.status(500).json({ success: false, message: 'Failed to process the request. Please try again later.' });
  }
};

// Fetch Gemini data by ID
export const getGeminiData = async (req, res) => {
  try {
    const { id } = req.params;
    const geminiData = await geminiCollection.findOne({ id });

    if (!geminiData) {
      return res.status(404).json({ success: false, message: 'Gemini data not found' });
    }

    res.json({ success: true, data: geminiData });
  } catch (error) {
    console.error('❌ Error fetching Gemini data:', error);
    res.status(500).json({ success: false, message: 'Error fetching Gemini data' });
  }
};

// Add new Gemini data
export const addGeminiData = async (req, res) => {
  try {
    const newData = req.body;

    if (!newData || !newData.id) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const existingData = await geminiCollection.findOne({ id: newData.id });
    if (existingData) {
      return res.status(409).json({ success: false, message: 'Gemini data with this ID already exists' });
    }

    await geminiCollection.insertOne(newData);
    res.status(201).json({ success: true, message: 'Gemini data added successfully' });
  } catch (error) {
    console.error('❌ Error adding Gemini data:', error);
    res.status(500).json({ success: false, message: 'Error adding Gemini data' });
  }
};

// Update Gemini data by ID
export const updateGeminiData = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const result = await geminiCollection.updateOne({ id }, { $set: updatedData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Gemini data not found or no changes made' });
    }

    res.json({ success: true, message: 'Gemini data updated successfully' });
  } catch (error) {
    console.error('❌ Error updating Gemini data:', error);
    res.status(500).json({ success: false, message: 'Error updating Gemini data' });
  }
};

// Delete Gemini data by ID
export const deleteGeminiData = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await geminiCollection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Gemini data not found' });
    }

    res.json({ success: true, message: 'Gemini data deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting Gemini data:', error);
    res.status(500).json({ success: false, message: 'Error deleting Gemini data' });
  }
};

// Initialize Gemini on startup
initializeGemini();