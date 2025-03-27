import express from 'express';
import { getDonors, deleteDonor, addDonor } from './donorListController.js';

const router = express.Router();

router.get('/api/donors', getDonors);
router.delete('/api/donors/:username', deleteDonor);
router.post('/api/donors', addDonor);

export default router;