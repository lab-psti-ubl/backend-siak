import express from 'express';
import {
  getAllCBTKelas,
  createCBTKelas,
  updateCBTKelas,
  deleteCBTKelas,
} from '../controllers/cbtKelasController.js';

const router = express.Router();

// GET all CBT kelas (with optional filters)
router.get('/', getAllCBTKelas);

// POST create CBT kelas
router.post('/', createCBTKelas);

// PUT update CBT kelas
router.put('/:id', updateCBTKelas);

// DELETE CBT kelas
router.delete('/:id', deleteCBTKelas);

export default router;

