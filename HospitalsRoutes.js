import express from 'express';
import { getAllHospitals, getRecommendedHospitals } from './hospitalController.js';

const router = express.Router();

// Define routes for hospitals
router.get('/all', getAllHospitals); // Fetch all hospitals
router.get('/recommended', getRecommendedHospitals); // Fetch recommended hospitals

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

export default router;