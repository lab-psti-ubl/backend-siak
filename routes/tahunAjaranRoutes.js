import express from 'express';
import {
  getAllTahunAjaran,
  getTahunAjaranById,
  getActiveTahunAjaran,
  createTahunAjaran,
  updateTahunAjaran,
  activateTahunAjaran,
  deleteTahunAjaran,
} from '../controllers/tahunAjaranController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all tahun ajaran
router.get('/', getAllTahunAjaran);

// Get active tahun ajaran
router.get('/active', getActiveTahunAjaran);

// Get single tahun ajaran by ID
router.get('/:id', getTahunAjaranById);

// Create new tahun ajaran
router.post('/', createTahunAjaran);

// Update tahun ajaran
router.put('/:id', updateTahunAjaran);

// Activate tahun ajaran
router.patch('/:id/activate', activateTahunAjaran);

// Delete tahun ajaran
router.delete('/:id', deleteTahunAjaran);

export default router;

