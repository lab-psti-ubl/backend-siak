import express from 'express';
import {
  getAllKomponenNilai,
  getKomponenNilaiById,
  createKomponenNilai,
  updateKomponenNilai,
  deleteKomponenNilai,
  updateAllKomponenNilai,
} from '../controllers/pengaturanKomponenNilaiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllKomponenNilai);
router.get('/:id', getKomponenNilaiById);
router.post('/', createKomponenNilai);
router.put('/all', updateAllKomponenNilai);
router.put('/:id', updateKomponenNilai);
router.delete('/:id', deleteKomponenNilai);

export default router;


