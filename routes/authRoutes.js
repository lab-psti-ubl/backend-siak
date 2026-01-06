import express from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route (no auth required)
router.post('/login', login);

// Protected route (token optional but recommended)
router.get('/current-user', authenticateToken, getCurrentUser);

export default router;

