import express from 'express';
import * as controller from '../controllers/readNotificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/user/:userId', controller.getByUserId);
router.post('/upsert', controller.upsert);
router.post('/mark-as-read', controller.markAsRead);
router.post('/mark-multiple-as-read', controller.markMultipleAsRead);

export default router;

