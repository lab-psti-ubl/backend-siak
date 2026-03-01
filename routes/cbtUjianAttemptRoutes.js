import express from 'express';
import {
  getAllCBTUjianAttempt,
  startCBTUjianAttempt,
  updateCBTUjianAttempt,
  resetCBTUjianAttempt,
  allowEditCBTUjianAttempt,
  gradeEssayCBTUjianAttempt,
} from '../controllers/cbtUjianAttemptController.js';

const router = express.Router();

// GET all attempts (optional filters)
router.get('/', getAllCBTUjianAttempt);

// POST start attempt
router.post('/start', startCBTUjianAttempt);

// PUT update attempt (save / submit)
router.put('/:id', updateCBTUjianAttempt);

// POST reset attempt (guru/admin)
router.post('/reset', resetCBTUjianAttempt);

// POST allow edit attempt (guru/admin)
router.post('/allow-edit', allowEditCBTUjianAttempt);

// POST grade essay questions (guru)
router.post('/grade-essay', gradeEssayCBTUjianAttempt);

export default router;

