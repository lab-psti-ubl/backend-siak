import express from 'express';
import {
  getAllAlatRFID,
  getAlatRFIDById,
  getAlatRFIDByToken,
  createAlatRFID,
  updateAlatRFID,
  deleteAlatRFID,
  toggleStatusAlatRFID,
} from '../controllers/alatRFIDController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllAlatRFID);
router.get('/by-token', authenticateToken, getAlatRFIDByToken);
router.get('/:id', authenticateToken, getAlatRFIDById);
router.post('/', authenticateToken, createAlatRFID);
router.put('/:id', authenticateToken, updateAlatRFID);
router.patch('/:id/toggle-status', authenticateToken, toggleStatusAlatRFID);
router.delete('/:id', authenticateToken, deleteAlatRFID);

export default router;

