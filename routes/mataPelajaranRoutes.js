import express from 'express';
import {
  getAllMataPelajaran,
  getMataPelajaranById,
  createMataPelajaran,
  updateMataPelajaran,
  deleteMataPelajaran,
} from '../controllers/mataPelajaranController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all mata pelajaran
router.get('/', getAllMataPelajaran);

// Get single mata pelajaran by ID
router.get('/:id', getMataPelajaranById);

// Create new mata pelajaran
router.post('/', createMataPelajaran);

// Update mata pelajaran
router.put('/:id', updateMataPelajaran);

// Delete mata pelajaran
router.delete('/:id', deleteMataPelajaran);

export default router;

