import express from 'express';
import {
  getAllNilai,
  getNilaiById,
  createNilai,
  updateNilai,
  deleteNilai,
  upsertNilai,
  bulkUpsertNilai,
} from '../controllers/nilaiController.js';

const router = express.Router();

// GET all nilai (with optional filters)
router.get('/', getAllNilai);

// GET nilai by ID
router.get('/:id', getNilaiById);

// POST create nilai
router.post('/', createNilai);

// POST upsert nilai (create or update)
router.post('/upsert', upsertNilai);

// POST bulk upsert nilai (for import)
router.post('/bulk-upsert', bulkUpsertNilai);

// PUT update nilai
router.put('/:id', updateNilai);

// DELETE nilai
router.delete('/:id', deleteNilai);

export default router;

