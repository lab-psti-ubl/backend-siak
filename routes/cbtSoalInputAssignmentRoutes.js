import express from 'express';
import {
  getAllCBTSoalInputAssignments,
  createCBTSoalInputAssignment,
  deleteCBTSoalInputAssignment,
} from '../controllers/cbtSoalInputAssignmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllCBTSoalInputAssignments);
router.post('/', createCBTSoalInputAssignment);
router.delete('/:id', deleteCBTSoalInputAssignment);

export default router;

