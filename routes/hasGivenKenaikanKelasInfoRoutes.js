import express from 'express';
import {
  getByTahunAjaranAndSemester,
  setFlag,
  deleteFlag,
  getAll
} from '../controllers/hasGivenKenaikanKelasInfoController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get flag by tahun ajaran and semester
router.get('/', authenticateToken, getByTahunAjaranAndSemester);

// Get all flags
router.get('/all', authenticateToken, getAll);

// Set flag (create or update)
router.post('/', authenticateToken, setFlag);

// Delete flag
router.delete('/', authenticateToken, deleteFlag);

export default router;

