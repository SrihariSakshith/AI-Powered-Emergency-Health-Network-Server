import express from 'express';
import { handleChat } from './geminiController.js'; // Ensure handleChat is imported correctly

const router = express.Router();

// Define the chat route
router.post('/chat', handleChat);

export default router;