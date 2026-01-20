import express from 'express';
import {
  getAllKelasTahfiz,
  getKelasTahfizById,
  createKelasTahfiz,
  updateKelasTahfiz,
  deleteKelasTahfiz,
} from '../controllers/kelasTahfizController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllKelasTahfiz);
router.get('/:id', getKelasTahfizById);
router.post('/', createKelasTahfiz);
router.put('/:id', updateKelasTahfiz);
router.delete('/:id', deleteKelasTahfiz);

export default router;

