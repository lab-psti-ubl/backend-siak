import express from 'express';
import {
  getAllIzinGuru,
  getIzinGuruById,
  getIzinGuruByStatus,
  createIzinGuru,
  updateIzinGuru,
  deleteIzinGuru,
} from '../controllers/izinGuruController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllIzinGuru);
router.get('/by-status', authenticateToken, getIzinGuruByStatus);
// Public route for verification (no auth required) - must be before /:id
router.get('/verification/:id', getIzinGuruById);
router.get('/:id', authenticateToken, getIzinGuruById);
router.post('/', authenticateToken, createIzinGuru);
router.put('/:id', authenticateToken, updateIzinGuru);
router.delete('/:id', authenticateToken, deleteIzinGuru);

export default router;

