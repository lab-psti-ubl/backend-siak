import express from 'express';
import { resetDatabase } from '../controllers/resetDatabaseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route untuk reset database (hanya admin)
router.post('/', authenticateToken, resetDatabase);

export default router;

