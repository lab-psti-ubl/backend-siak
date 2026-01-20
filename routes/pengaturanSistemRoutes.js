import express from 'express';
import {
  getPengaturanSistem,
  updatePengaturanSistem,
  getEnableEarlyDeparture,
  getLanguage,
  getSystemType,
} from '../controllers/pengaturanSistemController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getPengaturanSistem);
router.get('/enable-early-departure', authenticateToken, getEnableEarlyDeparture);
router.get('/language', authenticateToken, getLanguage);
router.get('/system-type', authenticateToken, getSystemType);
router.put('/', authenticateToken, updatePengaturanSistem);

export default router;

