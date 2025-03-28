import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;
const apiKey = process.env.GEMINI_API_KEY;

// MongoDB and AI Variables
let client;
let db;
let model;
let medicalData;
let chatHistories = [];

// ✅ MongoDB Connection
async function initializeMongoDB() {
    try {
        client = new MongoClient(mongoURI, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        db = client.db(dbName);
        console.log("✅ MongoDB connected successfully.");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        db = null; // Prevent crash if MongoDB fails
    }
}

// ✅ Gemini AI Initialization
async function initializeGemini() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        medicalData = await fetchAllData();
        model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `You are a medical chatbot providing health-related guidance and hospital recommendations. Never disclose passwords, personal information, or admin details. Respond in plain text format. Extracted database:\n${medicalData}`,
        });
        console.log("✅ Gemini AI initialized successfully.");
    } catch (error) {
        console.error("❌ Gemini AI initialization failed:", error);
    }
}

// ✅ Fetch Data from MongoDB
async function fetchAllData() {
    if (!db) return "Medical data unavailable.";

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
        console.error("❌ Error fetching data:", error);
        return "Medical data unavailable.";
    }
}

// ✅ Basic Test Route (Frontend & Backend Check)
app.get("/", (req, res) => {
    res.send({ message: "Frontend & Backend are connected!" });
});

// ✅ Chatbot Route
app.post("/chat/chatbot", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        if (!model) {
            return res.status(500).json({ error: "AI model not initialized. Try again later." });
        }

        const chatSession = model.startChat({
            history: chatHistories,
        });

        const result = await chatSession.sendMessage(message);

        if (!result || !result.response) {
            return res.status(500).json({ error: "AI response error. Try again later." });
        }

        const responseText = result.response.text();
        chatHistories.push({ role: "user", parts: [{ text: message }] });
        chatHistories.push({ role: "model", parts: [{ text: responseText }] });

        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Error in handleChat:", error);
        res.status(500).json({ error: "Server error. Try again later." });
    }
});

// ✅ Start Server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await initializeMongoDB();
    await initializeGemini();
});
