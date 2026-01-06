import express from 'express';
import {
  getAllKelas,
  getKelasById,
  createKelas,
  updateKelas,
  deleteKelas,
  getKelasStats,
} from '../controllers/kelasController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllKelas);
router.get('/:id', getKelasById);
router.get('/:id/stats', getKelasStats);
router.post('/', createKelas);
router.put('/:id', updateKelas);
router.delete('/:id', deleteKelas);

export default router;

