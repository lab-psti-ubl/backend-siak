import express from 'express';
import {
  getAllSesiAbsensiTahfiz,
  getSesiAbsensiTahfizById,
  getSesiAbsensiTahfizByTanggal,
  createSesiAbsensiTahfiz,
  updateSesiAbsensiTahfiz,
  deleteSesiAbsensiTahfiz,
  addAbsensiToSesiTahfiz,
  removeAbsensiFromSesiTahfiz,
  bulkAddAbsensiToSesiTahfiz,
} from '../controllers/sesiAbsensiTahfizController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSesiAbsensiTahfiz);
router.get('/by-tanggal', authenticateToken, getSesiAbsensiTahfizByTanggal);
router.get('/:id', authenticateToken, getSesiAbsensiTahfizById);
router.post('/', authenticateToken, createSesiAbsensiTahfiz);
router.put('/:id', authenticateToken, updateSesiAbsensiTahfiz);
router.delete('/:id', authenticateToken, deleteSesiAbsensiTahfiz);

// Absensi management within sesi tahfiz
router.post('/:sesiId/absensi', authenticateToken, addAbsensiToSesiTahfiz);
router.post('/:sesiId/absensi/bulk', authenticateToken, bulkAddAbsensiToSesiTahfiz);
router.delete('/:sesiId/absensi/:absensiId', authenticateToken, removeAbsensiFromSesiTahfiz);

export default router;

