import express from 'express';
import { getRaportVerification } from '../controllers/raportController.js';

const router = express.Router();

// Public route for verification (no auth required)
router.get('/verification/:nisn', getRaportVerification);

export default router;

