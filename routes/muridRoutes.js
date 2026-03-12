import express from 'express';
import {
  getAllMurid,
  getMuridById,
  createMurid,
  updateMurid,
  deleteMurid,
  toggleMuridStatus,
  getMuridProfileImageByNisn,
} from '../controllers/muridController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route: akses foto profil murid berdasarkan NISN tanpa autentikasi
router.get('/public/profile-photo/:nisn', getMuridProfileImageByNisn);

// Apply authentication middleware to all routes below
router.use(authenticateToken);

router.get('/', getAllMurid);
router.get('/:id', getMuridById);
router.post('/', createMurid);
router.put('/:id', updateMurid);
router.patch('/:id/toggle-status', toggleMuridStatus);
router.delete('/:id', deleteMurid);

export default router;

