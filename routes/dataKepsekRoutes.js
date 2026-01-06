import express from 'express';
import {
  getAllDataKepsek,
  getDataKepsekById,
  createDataKepsek,
  updateDataKepsek,
  deleteDataKepsek,
} from '../controllers/dataKepsekController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllDataKepsek);
router.get('/:id', getDataKepsekById);
router.post('/', createDataKepsek);
router.put('/:id', updateDataKepsek);
router.delete('/:id', deleteDataKepsek);

export default router;


