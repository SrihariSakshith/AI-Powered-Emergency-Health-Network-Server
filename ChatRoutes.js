import express from 'express';
import { handleChat } from './geminiController.js';

const router = express.Router();

router.post('/chatbot', handleChat);

export default router;