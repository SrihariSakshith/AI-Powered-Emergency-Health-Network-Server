import express from 'express';
import { getAllDonors, addDonor, deleteDonor } from './donorListController.js';

const router = express.Router();

// Define routes for donors
router.get('/all', getAllDonors); // Fetch all donors
router.post('/add', addDonor); // Add a new donor
router.delete('/:username', deleteDonor); // Delete a donor by username

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

export default router;