import express from 'express';
import {
  getPengaturanSistem,
  updatePengaturanSistem,
  getEnableEarlyDeparture,
  getLanguage,
  getSystemType,
  getFooterSettingsPublic,
  updateFooterCompanyNamePublic,
  getCbtSpmbSettingsPublic,
  updateCbtSpmbSettingsPublic,
} from '../controllers/pengaturanSistemController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import PengaturanSistem from '../models/PengaturanSistem.js';

const router = express.Router();

// Middleware to allow initial setup without auth
// Only allows access if system type is not set yet (initial setup)
const allowInitialSetup = async (req, res, next) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    // If no settings exist or systemType is null, allow access for initial setup
    if (!pengaturan || !pengaturan.systemType) {
      // Check if request has isInitialSetup flag (body should be parsed by express.json())
      if (req.body && req.body.isInitialSetup === true) {
        // Allow without auth for initial setup
        req.user = null; // No user for initial setup
        return next();
      }
    }
    // Otherwise require authentication
    return authenticateToken(req, res, next);
  } catch (error) {
    // On error, require authentication for safety
    return authenticateToken(req, res, next);
  }
};

// getSystemType should be accessible without auth for initial setup check
// This allows the app to check if system type is set before user login
router.get('/system-type', getSystemType);

// getLanguage should be accessible without auth for login page
// This allows the app to use correct language even before user login
router.get('/language', getLanguage);

// Public footer settings (no auth)
router.get('/footer', getFooterSettingsPublic);
router.put('/footer', updateFooterCompanyNamePublic);

// Public CBT & SPMB settings (no auth, seperti footer)
router.get('/cbt-spmb', getCbtSpmbSettingsPublic);
router.put('/cbt-spmb', updateCbtSpmbSettingsPublic);

// Other routes require authentication
router.get('/', authenticateToken, getPengaturanSistem);
router.get('/enable-early-departure', authenticateToken, getEnableEarlyDeparture);

// updatePengaturanSistem can be accessed without auth only for initial setup
// (when systemType is null and isInitialSetup flag is true)
// Otherwise requires authentication
router.put('/', allowInitialSetup, updatePengaturanSistem);

export default router;

