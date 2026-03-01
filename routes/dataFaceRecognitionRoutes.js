import express from 'express';
import {
  getListWithStatus,
  getByGuruId,
  registerFaces,
  getAllDescriptors,
} from '../controllers/dataFaceRecognitionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getListWithStatus);
router.get('/descriptors', getAllDescriptors);
router.get('/guru/:guruId', getByGuruId);
router.post('/register', registerFaces);

export default router;

