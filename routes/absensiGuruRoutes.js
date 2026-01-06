import express from 'express';
import {
  getAllAbsensiGuru,
  getAbsensiGuruById,
  getAbsensiGuruByTanggal,
  getAbsensiGuruByGuruId,
  getAbsensiGuruByGuruIdAndTanggal,
  getAbsensiGuruDates,
  createAbsensiGuru,
  updateAbsensiGuru,
  deleteAbsensiGuru,
} from '../controllers/absensiGuruController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllAbsensiGuru);
router.get('/dates', authenticateToken, getAbsensiGuruDates);
router.get('/by-tanggal', authenticateToken, getAbsensiGuruByTanggal);
router.get('/by-guru-tanggal', authenticateToken, getAbsensiGuruByGuruIdAndTanggal);
router.get('/by-guru/:guruId', authenticateToken, getAbsensiGuruByGuruId);
router.get('/:id', authenticateToken, getAbsensiGuruById);
router.post('/', authenticateToken, createAbsensiGuru);
router.put('/:id', authenticateToken, updateAbsensiGuru);
router.delete('/:id', authenticateToken, deleteAbsensiGuru);

export default router;

