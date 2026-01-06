import express from 'express';
import {
  getAllPengaturanIstirahat,
  getActivePengaturanIstirahat,
  getPengaturanIstirahatById,
  createPengaturanIstirahat,
  updatePengaturanIstirahat,
  deletePengaturanIstirahat,
} from '../controllers/pengaturanIstirahatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllPengaturanIstirahat);
router.get('/active', getActivePengaturanIstirahat);
router.get('/:id', getPengaturanIstirahatById);
router.post('/', createPengaturanIstirahat);
router.put('/:id', updatePengaturanIstirahat);
router.delete('/:id', deletePengaturanIstirahat);

export default router;


