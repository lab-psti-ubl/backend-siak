import express from 'express';
import {
  getBackgroundKTA,
  saveBackgroundKTA,
} from '../controllers/backgroundKTAController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getBackgroundKTA);
router.post('/', saveBackgroundKTA);
router.put('/', saveBackgroundKTA); // Same as POST for create/update

export default router;


