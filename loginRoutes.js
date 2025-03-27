import express from 'express';
import { handleLogin } from './loginController.js';

const router = express.Router();

// Ensure the route path is `/login/login`
router.post('/login/login', handleLogin);

// Add a catch-all route for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

export default router;