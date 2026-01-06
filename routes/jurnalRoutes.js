import express from 'express';
import {
  getAllJurnal,
  getJurnalById,
  getJurnalByJadwalId,
  getJurnalByTanggal,
  getJurnalByJadwalIdAndTanggal,
  createJurnal,
  updateJurnal,
  deleteJurnal,
} from '../controllers/jurnalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllJurnal);
router.get('/by-tanggal', authenticateToken, getJurnalByTanggal);
router.get('/by-jadwal-tanggal', authenticateToken, getJurnalByJadwalIdAndTanggal);
router.get('/by-jadwal/:jadwalId', authenticateToken, getJurnalByJadwalId);
router.get('/:id', authenticateToken, getJurnalById);
router.post('/', authenticateToken, createJurnal);
router.put('/:id', authenticateToken, updateJurnal);
router.delete('/:id', authenticateToken, deleteJurnal);

export default router;

