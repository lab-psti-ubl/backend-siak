import express from 'express';
import {
  getProgressHafalanBySantri,
  getAllProgressHafalan,
  addProgressHafalan,
  updateProgressHafalan,
  deleteProgressHafalan,
  saveHasilTes,
} from '../controllers/progressHafalanController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllProgressHafalan);
router.get('/santri/:santriId', getProgressHafalanBySantri);
router.post('/', addProgressHafalan);
router.put('/:id', updateProgressHafalan);
router.post('/:id/hasil-tes', saveHasilTes);
router.delete('/:id', deleteProgressHafalan);

export default router;
