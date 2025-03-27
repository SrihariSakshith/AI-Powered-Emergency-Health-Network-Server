import express from 'express';
import { getAllHospitals, getRecommendedHospitals } from './hospitalController.js';

const router = express.Router();

router.get('/all', getAllHospitals);
router.get('/recommended', getRecommendedHospitals);

// Ensure these routes are correctly defined and return JSON responses

export default router;