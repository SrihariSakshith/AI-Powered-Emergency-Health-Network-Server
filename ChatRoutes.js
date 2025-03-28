import express from 'express';
import { handleChat } from './geminiController.js';

const router = express.Router();

// Define the chat route
router.post('/chat', handleChat);

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

export default router;