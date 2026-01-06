import express from 'express';
import {
  getPengaturanNilaiMinimal,
  savePengaturanNilaiMinimal,
} from '../controllers/pengaturanNilaiMinimalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getPengaturanNilaiMinimal);
router.post('/', savePengaturanNilaiMinimal);
router.put('/', savePengaturanNilaiMinimal);

export default router;


