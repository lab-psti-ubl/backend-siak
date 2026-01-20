import express from 'express';
import {
  getAllJurnalTahfiz,
  getJurnalTahfizById,
  getJurnalTahfizByJadwalId,
  getJurnalTahfizByTanggal,
  getJurnalTahfizByJadwalIdAndTanggal,
  createJurnalTahfiz,
  updateJurnalTahfiz,
  deleteJurnalTahfiz,
  deletePertemuanJurnalTahfiz,
} from '../controllers/jurnalTahfizController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllJurnalTahfiz);
router.get('/by-tanggal', authenticateToken, getJurnalTahfizByTanggal);
router.get('/by-jadwal-tanggal', authenticateToken, getJurnalTahfizByJadwalIdAndTanggal);
router.get('/by-jadwal/:jadwalId', authenticateToken, getJurnalTahfizByJadwalId);
router.get('/:id', authenticateToken, getJurnalTahfizById);
router.post('/', authenticateToken, createJurnalTahfiz);
router.put('/:id', authenticateToken, updateJurnalTahfiz);
router.delete('/pertemuan/:id', authenticateToken, deletePertemuanJurnalTahfiz);
router.delete('/:id', authenticateToken, deleteJurnalTahfiz);

export default router;

