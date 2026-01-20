import express from 'express';
import {
  getAllJadwalTahfiz,
  getJadwalTahfizById,
  createJadwalTahfiz,
  updateJadwalTahfiz,
  deleteJadwalTahfiz,
} from '../controllers/jadwalTahfizController.js';

const router = express.Router();

router.get('/', getAllJadwalTahfiz);
router.get('/:id', getJadwalTahfizById);
router.post('/', createJadwalTahfiz);
router.put('/:id', updateJadwalTahfiz);
router.delete('/:id', deleteJadwalTahfiz);

export default router;

