import express from 'express';
import {
  getAllRiwayatKelasMurid,
  getRiwayatKelasMuridById,
  getRiwayatKelasMuridByMuridId,
  createRiwayatKelasMurid,
  bulkCreateRiwayatKelasMurid,
  updateRiwayatKelasMurid,
  deleteRiwayatKelasMurid,
} from '../controllers/riwayatKelasMuridController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all riwayat kelas murid (with optional filters)
router.get('/', authenticateToken, getAllRiwayatKelasMurid);

// Get riwayat kelas murid by ID
router.get('/:id', authenticateToken, getRiwayatKelasMuridById);

// Get riwayat kelas murid by muridId
router.get('/by-murid/:muridId', authenticateToken, getRiwayatKelasMuridByMuridId);

// Create riwayat kelas murid
router.post('/', authenticateToken, createRiwayatKelasMurid);

// Bulk create riwayat kelas murid
router.post('/bulk', authenticateToken, bulkCreateRiwayatKelasMurid);

// Update riwayat kelas murid
router.put('/:id', authenticateToken, updateRiwayatKelasMurid);

// Delete riwayat kelas murid
router.delete('/:id', authenticateToken, deleteRiwayatKelasMurid);

export default router;

