import express from 'express';
import {
  getAllJadwalPelajaran,
  getJadwalPelajaranById,
  checkScheduleConflict,
  createJadwalPelajaran,
  updateJadwalPelajaran,
  deleteJadwalPelajaran,
} from '../controllers/jadwalPelajaranController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all jadwal pelajaran (with optional filters: ?kelasId=xxx&guruId=xxx&tahunAjaran=xxx&semester=1&hari=senin)
router.get('/', getAllJadwalPelajaran);

// Check for schedule conflicts
router.post('/check-conflict', checkScheduleConflict);

// Get single jadwal pelajaran by ID
router.get('/:id', getJadwalPelajaranById);

// Create new jadwal pelajaran
router.post('/', createJadwalPelajaran);

// Update jadwal pelajaran
router.put('/:id', updateJadwalPelajaran);

// Delete jadwal pelajaran
router.delete('/:id', deleteJadwalPelajaran);

export default router;

