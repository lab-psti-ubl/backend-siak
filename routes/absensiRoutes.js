import express from 'express';
import {
  getAllAbsensi,
  getAbsensiById,
  getAbsensiByMuridId,
  getAbsensiByMuridIdAndTanggal,
  createAbsensi,
  updateAbsensi,
  deleteAbsensi,
  bulkCreateAbsensi,
  getSessionMetadata,
  updateSessionMetadata,
} from '../controllers/absensiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all absensi (with optional filters)
router.get('/', authenticateToken, getAllAbsensi);

// Get absensi by ID
router.get('/:id', authenticateToken, getAbsensiById);

// Get absensi by muridId
router.get('/by-murid/:muridId', authenticateToken, getAbsensiByMuridId);

// Get absensi by muridId and tanggal
router.get('/by-murid-tanggal/:muridId', authenticateToken, getAbsensiByMuridIdAndTanggal);

// Create absensi
router.post('/', authenticateToken, createAbsensi);

// Bulk create/update absensi
router.post('/bulk', authenticateToken, bulkCreateAbsensi);

// Update absensi
router.put('/:id', authenticateToken, updateAbsensi);

// Delete absensi
router.delete('/:id', authenticateToken, deleteAbsensi);

// Get session metadata
router.get('/session/metadata', authenticateToken, getSessionMetadata);

// Update session metadata
router.put('/session/metadata', authenticateToken, updateSessionMetadata);

export default router;

