import express from 'express';
import {
  getProfilSekolah,
  saveProfilSekolah,
} from '../controllers/profilSekolahController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - get profil sekolah (no authentication required)
router.get('/public', getProfilSekolah);

// Apply authentication middleware to protected routes
router.use(authenticateToken);

router.get('/', getProfilSekolah);
router.post('/', saveProfilSekolah);
router.put('/', saveProfilSekolah); // Same as POST for create/update

export default router;


