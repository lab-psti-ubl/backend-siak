import express from 'express';
import {
  getAllCBTBankSoal,
  getCBTBankSoalById,
  createCBTBankSoal,
  updateCBTBankSoal,
  deleteCBTBankSoal,
} from '../controllers/cbtBankSoalController.js';

const router = express.Router();

// GET all bank soal CBT
router.get('/', getAllCBTBankSoal);

// GET bank soal CBT by id
router.get('/:id', getCBTBankSoalById);

// POST create bank soal CBT
router.post('/', createCBTBankSoal);

// PUT update bank soal CBT
router.put('/:id', updateCBTBankSoal);

// DELETE bank soal CBT
router.delete('/:id', deleteCBTBankSoal);

export default router;

