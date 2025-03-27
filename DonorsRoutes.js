import express from 'express';
import { getDonors, getUserLocation, getUserBloodGroup } from './donorsController.js';

const router = express.Router();

router.get('/api/donors', getDonors);
router.get('/api/user-location', getUserLocation); // Ensure this route is defined
router.get('/api/user-blood-group', getUserBloodGroup); // Ensure this route is defined

export default router;