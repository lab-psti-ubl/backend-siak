import express from 'express';
import {
  getAllSpmbOpenings,
  createSpmbOpening,
  updateSpmbOpening,
  deleteSpmbOpening,
  getActiveSpmbOpeningPublic,
  createSpmbRegistrationPublic,
  getSpmbRegistrations,
  updateSpmbRegistrationStatus,
  assignSpmbRegistrationsToClass,
} from '../controllers/spmbController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoints (untuk form SPMB di luar login)
router.get('/opening-active', getActiveSpmbOpeningPublic);
router.post('/register', createSpmbRegistrationPublic);

// Admin endpoints (butuh auth)
router.get('/openings', authenticateToken, getAllSpmbOpenings);
router.post('/openings', authenticateToken, createSpmbOpening);
router.put('/openings/:id', authenticateToken, updateSpmbOpening);
router.delete('/openings/:id', authenticateToken, deleteSpmbOpening);

router.get('/registrations', authenticateToken, getSpmbRegistrations);
router.patch('/registrations/:id/status', authenticateToken, updateSpmbRegistrationStatus);
router.post('/registrations/assign-to-class', authenticateToken, assignSpmbRegistrationsToClass);

export default router;

