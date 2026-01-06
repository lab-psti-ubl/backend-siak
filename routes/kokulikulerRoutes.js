import express from 'express';
import {
  getKokulikuler,
  createOrUpdateKokulikuler,
  updateKokulikulerMurid,
} from '../controllers/kokulikulerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get kokulikuler by kelas, tahun ajaran, and semester
router.get('/', getKokulikuler);

// Create or update kokulikuler for a class
router.post('/', createOrUpdateKokulikuler);

// Update kokulikuler for a specific murid
router.put('/murid', updateKokulikulerMurid);

export default router;


