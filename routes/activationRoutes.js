import express from 'express';
import {
  getSystemActivation,
  checkSystemActive,
  activateSystem,
  deactivateSystem,
  updateActivationCode,
  initializeSystemActivation,
} from '../controllers/activationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/check', checkSystemActive);
router.get('/status', getSystemActivation);
router.post('/initialize', initializeSystemActivation);

// Protected routes (auth required)
router.get('/', authenticateToken, getSystemActivation);
router.post('/activate', authenticateToken, authorizeRoles('admin', 'kepala_sekolah'), activateSystem);
router.post('/deactivate', deactivateSystem);
router.put('/code', updateActivationCode);

export default router;

