import express from 'express';
import {
  getAllSesiAbsensi,
  getSesiAbsensiById,
  getSesiAbsensiByTanggal,
  createSesiAbsensi,
  updateSesiAbsensi,
  deleteSesiAbsensi,
  addAbsensiToSesi,
  removeAbsensiFromSesi,
  bulkAddAbsensiToSesi,
} from '../controllers/sesiAbsensiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSesiAbsensi);
router.get('/by-tanggal', authenticateToken, getSesiAbsensiByTanggal);
router.get('/:id', authenticateToken, getSesiAbsensiById);
router.post('/', authenticateToken, createSesiAbsensi);
router.put('/:id', authenticateToken, updateSesiAbsensi);
router.delete('/:id', authenticateToken, deleteSesiAbsensi);

// Absensi management within sesi
router.post('/:sesiId/absensi', authenticateToken, addAbsensiToSesi);
router.post('/:sesiId/absensi/bulk', authenticateToken, bulkAddAbsensiToSesi);
router.delete('/:sesiId/absensi/:absensiId', authenticateToken, removeAbsensiFromSesi);

export default router;

