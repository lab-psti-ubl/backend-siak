import express from 'express';
import {
  getAllEkstrakulikuler,
  getEkstrakulikulerById,
  createEkstrakulikuler,
  updateEkstrakulikuler,
  deleteEkstrakulikuler,
} from '../controllers/ekstrakulikulerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all ekstrakulikuler (with optional filter: ?isActive=true)
router.get('/', getAllEkstrakulikuler);

// Get single ekstrakulikuler by ID
router.get('/:id', getEkstrakulikulerById);

// Create ekstrakulikuler
router.post('/', createEkstrakulikuler);

// Update ekstrakulikuler
router.put('/:id', updateEkstrakulikuler);

// Delete ekstrakulikuler
router.delete('/:id', deleteEkstrakulikuler);

export default router;

