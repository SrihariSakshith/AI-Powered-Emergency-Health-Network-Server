import express from 'express';
import { handleLogin } from './loginController.js';

const router = express.Router();

// Ensure the route path is `/login/login`
router.post('/login/login', handleLogin);

export default router;