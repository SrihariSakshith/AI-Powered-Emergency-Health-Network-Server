import express from 'express';
import { submitContactForm } from './contactController.js';

const router = express.Router();

router.post('/api/contact', submitContactForm);

export default router;