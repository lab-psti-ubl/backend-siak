import express from 'express';
import {
  getActiveJenjang,
  getAllJenjang,
  setJenjang,
} from '../controllers/jenjangController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required for initialization)
router.get('/active', getActiveJenjang);
router.post('/', setJenjang); // Public for initial setup before login

// Protected routes (auth required)
router.use(authenticateToken);
router.get('/', getAllJenjang);

export default router;

