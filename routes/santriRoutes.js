import express from 'express';
import {
  getAllSantri,
  getAvailableMurid,
  addSantri,
  addAllMurid,
  updateSantriStatus,
  updateSantri,
  removeSantri,
} from '../controllers/santriController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllSantri);
router.get('/available-murid', getAvailableMurid);
router.post('/', addSantri);
router.post('/add-all-murid', addAllMurid);
router.put('/:santriId/status', updateSantriStatus);
router.put('/:santriId', updateSantri);
router.delete('/:santriId', removeSantri);

export default router;

