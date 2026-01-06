import express from 'express';
import {
  getAllJurusan,
  getJurusanById,
  createJurusan,
  updateJurusan,
  deleteJurusan,
  getJurusanStats,
} from '../controllers/jurusanController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllJurusan);
router.get('/:id', getJurusanById);
router.get('/:id/stats', getJurusanStats);
router.post('/', createJurusan);
router.put('/:id', updateJurusan);
router.delete('/:id', deleteJurusan);

export default router;

