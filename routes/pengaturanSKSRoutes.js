import express from 'express';
import {
  getAllPengaturanSKS,
  getActivePengaturanSKS,
  getPengaturanSKSById,
  createPengaturanSKS,
  updatePengaturanSKS,
  deletePengaturanSKS,
} from '../controllers/pengaturanSKSController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllPengaturanSKS);
router.get('/active', getActivePengaturanSKS);
router.get('/:id', getPengaturanSKSById);
router.post('/', createPengaturanSKS);
router.put('/:id', updatePengaturanSKS);
router.delete('/:id', deletePengaturanSKS);

export default router;


