import express from 'express';
import {
  getSystemActivation,
  checkSystemActive,
  activateSystem,
  initializeSystemActivation,
} from '../controllers/activationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/check', checkSystemActive);
router.post('/initialize', initializeSystemActivation);

// Protected routes (auth required)
router.get('/', authenticateToken, getSystemActivation);
router.post('/activate', authenticateToken, authorizeRoles('admin', 'kepala_sekolah'), activateSystem);

export default router;

