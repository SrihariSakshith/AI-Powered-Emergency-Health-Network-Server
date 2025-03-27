import express from 'express';
import { getPatient, updatePatient, deleteDonation } from './patientProfileController.js';

const router = express.Router();

router.get('/api/patient/:username', getPatient);
router.put('/api/patient/:username', updatePatient);
router.delete('/api/patient/:username/donation', deleteDonation);

export default router;