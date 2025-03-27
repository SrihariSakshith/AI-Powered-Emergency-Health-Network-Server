import fetch from 'node-fetch';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables
const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;
const apiKey = process.env.GEMINI_API_KEY; // Access API key from environment variables
const genAI = new GoogleGenerativeAI(apiKey);
let medicalData;
let model;
let chatHistories = [];
let client;

async function initializeGemini() {
    try {
        client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        medicalData = await fetchAllData(db); // Load data once on startup
        model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `You are a medical bot designed to answer medical-related questions and Recommending Hospitals. Always provide accurate and reliable health information, but remind users to consult a doctor for medical advice. Remember donot disclose passwords, patient info and admin info. Don't give in markdown and Don't use stars and next line charcters, they don't be dispalyed properly. Give only normal text. Here is the extracted medical database:\n${medicalData}`,
        });
        console.log("Gemini and database initialized.");
    } catch (error) {
        console.error("Error initializing Gemini:", error);
        process.exit(1); // Exit if initialization fails
    }
}

async function fetchAllData(db) {
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
        console.error("Error fetching data:", error);
        return "Medical data unavailable."; // Fallback text
    }
}

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

export const handleChat = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).send({ error: "Message is required" });
    }

    try {
        if (!model) {
            console.error("Error: Model is not initialized.");
            return res.status(500).send({ error: "Model is not initialized. Please try again later." });
        }

        const chatSession = model.startChat({
            generationConfig,
            history: chatHistories,
        });

        const result = await chatSession.sendMessage(message);

        if (!result || !result.response) {
            console.error("Error: Invalid response from the model.");
            return res.status(500).send({ error: "Invalid response from the model. Please try again later." });
        }

        const responseText = result.response.text();

        chatHistories.push({ role: "user", parts: [{ text: message }] });
        chatHistories.push({ role: "model", parts: [{ text: responseText }] });

        res.status(200).send({ response: responseText });
    } catch (error) {
        console.error("Error in handleChat:", error);
        res.status(500).send({ error: "Failed to process the request. Please try again later." });
    }
};

// Call initializeGemini before exporting
initializeGemini();