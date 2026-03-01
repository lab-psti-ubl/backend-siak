import express from 'express';
import { login, getCurrentUser, refreshToken, updateAdminAccount, changeAdminPassword } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route (no auth required)
router.post('/login', login);

// Refresh token route (token required but can be expired)
router.post('/refresh-token', refreshToken);

// Protected route (token optional but recommended)
router.get('/current-user', authenticateToken, getCurrentUser);

// Admin account management routes (admin & kepala_sekolah only)
router.put(
  '/admin/account',
  authenticateToken,
  authorizeRoles('admin', 'kepala_sekolah'),
  updateAdminAccount
);

router.put(
  '/admin/change-password',
  authenticateToken,
  authorizeRoles('admin', 'kepala_sekolah'),
  changeAdminPassword
);

export default router;

