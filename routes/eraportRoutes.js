import express from 'express';
import {
  generateERaport,
  getERaport,
  getERaportByMurid,
} from '../controllers/eraportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post('/generate', generateERaport);
router.get('/', getERaport);
router.get('/by-murid', getERaportByMurid);

export default router;

