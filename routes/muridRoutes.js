import express from 'express';
import {
  getAllMurid,
  getMuridById,
  createMurid,
  updateMurid,
  deleteMurid,
  toggleMuridStatus,
} from '../controllers/muridController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllMurid);
router.get('/:id', getMuridById);
router.post('/', createMurid);
router.put('/:id', updateMurid);
router.patch('/:id/toggle-status', toggleMuridStatus);
router.delete('/:id', deleteMurid);

export default router;

