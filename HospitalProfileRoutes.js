import express from 'express';
import { getHospital, updateHospital, deleteDonation } from './hospitalProfileController.js';

const router = express.Router();

router.get('/api/hospital/:username', getHospital);
router.put('/api/hospital/:username', updateHospital);
router.delete('/api/hospital/:username/donation', deleteDonation);

export default router;