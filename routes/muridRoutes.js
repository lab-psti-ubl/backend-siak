import express from 'express';
import {
  getAllMurid,
  getMuridById,
  createMurid,
  updateMurid,
  deleteMurid,
  toggleMuridStatus,
  getMuridProfileImage,
  getMuridProfileImageByNisn,
} from '../controllers/muridController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth) for sharing profile photo
router.get('/:id/foto', getMuridProfileImage);
router.get('/nisn/:nisn/foto', getMuridProfileImageByNisn);

// Apply authentication middleware to all other routes
router.use(authenticateToken);

router.get('/', getAllMurid);
router.get('/:id', getMuridById);
router.post('/', createMurid);
router.put('/:id', updateMurid);
router.patch('/:id/toggle-status', toggleMuridStatus);
router.delete('/:id', deleteMurid);

export default router;

