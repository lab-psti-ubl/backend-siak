import express from 'express';
import {
  getWaliKelasSettings,
  saveWaliKelasSettings,
} from '../controllers/waliKelasSettingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getWaliKelasSettings);
router.post('/', authenticateToken, saveWaliKelasSettings);
router.put('/', authenticateToken, saveWaliKelasSettings);

export default router;

