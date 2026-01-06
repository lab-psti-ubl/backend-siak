import express from 'express';
import * as controller from '../controllers/riwayatWaliKelasController.js';

const router = express.Router();

router.get('/', controller.getAll);
router.get('/guru/:guruId', controller.getByGuruId);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.deleteOne);

export default router;
