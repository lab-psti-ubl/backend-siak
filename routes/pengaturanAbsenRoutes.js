import express from 'express';
import {
  getAllPengaturanAbsen,
  getActivePengaturanAbsen,
  getPengaturanAbsenById,
  createPengaturanAbsen,
  updatePengaturanAbsen,
  deletePengaturanAbsen,
} from '../controllers/pengaturanAbsenController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllPengaturanAbsen);
router.get('/active', getActivePengaturanAbsen);
router.get('/:id', getPengaturanAbsenById);
router.post('/', createPengaturanAbsen);
router.put('/:id', updatePengaturanAbsen);
router.delete('/:id', deletePengaturanAbsen);

export default router;


