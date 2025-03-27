import express from 'express';
import { getContacts } from './contactListController.js';

const router = express.Router();

router.get('/api/contacts', getContacts);

export default router;