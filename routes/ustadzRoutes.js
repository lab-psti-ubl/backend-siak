import express from 'express';
import {
  getAllUstadz,
  getAvailableGurus,
  addUstadz,
  updateUstadzStatus,
  removeUstadz,
} from '../controllers/ustadzController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllUstadz);
router.get('/available-gurus', getAvailableGurus);
router.post('/', addUstadz);
router.put('/:guruId/status', updateUstadzStatus);
router.delete('/:guruId', removeUstadz);

export default router;

