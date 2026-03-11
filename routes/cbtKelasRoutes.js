import express from 'express';
import {
  getAllCBTKelas,
  createCBTKelas,
  updateCBTKelas,
  deleteCBTKelas,
} from '../controllers/cbtKelasController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all CBT kelas (with optional filters)
router.get('/', getAllCBTKelas);

// POST create CBT kelas
router.post('/', authenticateToken, createCBTKelas);

// PUT update CBT kelas
router.put('/:id', authenticateToken, updateCBTKelas);

// DELETE CBT kelas
router.delete('/:id', authenticateToken, deleteCBTKelas);

export default router;

