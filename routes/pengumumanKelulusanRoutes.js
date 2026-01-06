import express from 'express';
import * as controller from '../controllers/pengumumanKelulusanController.js';

const router = express.Router();

router.get('/', controller.getAll);
router.get('/filter', controller.getByFilter);
router.get('/active', controller.getActive);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.deleteOne);

export default router;

