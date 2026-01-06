import express from 'express';
import {
  getAllAlumni,
  getAlumniById,
  getAlumniByMuridId,
  createAlumni,
  updateAlumni,
  deleteAlumni,
} from '../controllers/alumniController.js';

const router = express.Router();

// Get all alumni (with optional filters: ?tahunLulus=2024&kelasId=xxx&search=xxx)
router.get('/', getAllAlumni);

// Get alumni by ID
router.get('/:id', getAlumniById);

// Get alumni by muridId
router.get('/murid/:muridId', getAlumniByMuridId);

// Create alumni
router.post('/', createAlumni);

// Update alumni
router.put('/:id', updateAlumni);

// Delete alumni
router.delete('/:id', deleteAlumni);

export default router;
