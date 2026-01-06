import express from 'express';
import {
  getAllGurus,
  getGuruById,
  createGuru,
  updateGuru,
  deleteGuru,
  updateProfilGuru,
  changePasswordGuru,
} from '../controllers/guruController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', getAllGurus);
router.get('/:id', getGuruById);
router.post('/', createGuru);
router.put('/:id', updateGuru);
router.delete('/:id', deleteGuru);

// Profil guru endpoints (untuk guru sendiri)
router.put('/profil/update', updateProfilGuru);
router.put('/profil/change-password', changePasswordGuru);

export default router;

