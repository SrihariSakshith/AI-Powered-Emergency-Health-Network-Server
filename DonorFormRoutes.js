import express from 'express';
import { submitDonorData } from './donorFormController.js';

const router = express.Router();

router.post('/api/donors', submitDonorData);

export default router;