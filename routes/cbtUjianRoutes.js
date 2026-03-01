import express from 'express';
import {
  getAllCBTUjian,
  getCBTUjianById,
  createCBTUjian,
  updateCBTUjian,
  deleteCBTUjian,
} from '../controllers/cbtUjianController.js';

const router = express.Router();

// GET all ujian CBT (with optional filters)
router.get('/', getAllCBTUjian);

// GET ujian CBT by id
router.get('/:id', getCBTUjianById);

// POST create ujian CBT
router.post('/', createCBTUjian);

// PUT update ujian CBT
router.put('/:id', updateCBTUjian);

// DELETE ujian CBT
router.delete('/:id', deleteCBTUjian);

export default router;

