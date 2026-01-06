import express from 'express';
import {
  getAllGuruMapel,
  getGuruMapelById,
  getGuruMapelByGuruId,
  createGuruMapel,
  updateGuruMapelAssignments,
  updateGuruMapel,
  deleteGuruMapel,
} from '../controllers/guruMapelController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all guru mapel (with optional filters: ?guruId=xxx&mataPelajaranId=xxx&isActive=true)
router.get('/', getAllGuruMapel);

// Get guru mapel by guru ID (active only)
router.get('/guru/:guruId', getGuruMapelByGuruId);

// Get single guru mapel by ID
router.get('/:id', getGuruMapelById);

// Create new guru mapel
router.post('/', createGuruMapel);

// Update guru mapel assignments for a guru (bulk update)
router.put('/guru/:guruId/assignments', updateGuruMapelAssignments);

// Update single guru mapel
router.put('/:id', updateGuruMapel);

// Delete guru mapel
router.delete('/:id', deleteGuruMapel);

export default router;

