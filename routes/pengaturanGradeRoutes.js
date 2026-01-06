import express from 'express';
import {
  getAllGrade,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  updateAllGrade,
} from '../controllers/pengaturanGradeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllGrade);
router.get('/:id', getGradeById);
router.post('/', createGrade);
router.put('/all', updateAllGrade);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

export default router;


