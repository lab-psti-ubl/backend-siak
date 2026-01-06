import express from 'express';
import {
  getAllSuratIzin,
  getSuratIzinById,
  getSuratIzinByStatus,
  createSuratIzin,
  updateSuratIzin,
  deleteSuratIzin,
  verifySuratIzin,
} from '../controllers/suratIzinController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSuratIzin);
router.get('/by-status', authenticateToken, getSuratIzinByStatus);
// Public route for verification (no auth required) - must be before /:id
router.get('/verification/:id', getSuratIzinById);
router.get('/:id', authenticateToken, getSuratIzinById);
router.post('/', authenticateToken, createSuratIzin);
router.put('/:id', authenticateToken, updateSuratIzin);
router.put('/:id/verify', authenticateToken, verifySuratIzin);
router.delete('/:id', authenticateToken, deleteSuratIzin);

export default router;

