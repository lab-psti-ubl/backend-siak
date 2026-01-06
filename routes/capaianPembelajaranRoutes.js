import express from 'express';
import {
  getCapaianPembelajaran,
  getAllCapaianPembelajaran,
  getCapaianPembelajaranById,
  createOrUpdateCapaianPembelajaran,
  addOrUpdateCapaianPembelajaranItem,
  deleteCapaianPembelajaranItem,
  updateCapaianPembelajaran,
  deleteCapaianPembelajaran,
} from '../controllers/capaianPembelajaranController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===== NEW STRUCTURE ENDPOINTS (using array-based structure) =====

// Get capaian pembelajaran by guru, tahun ajaran, and semester
// Query params: ?guruId=xxx&tahunAjaran=2024/2025&semester=1
router.get('/guru', getCapaianPembelajaran);

// Create or update capaian pembelajaran for a guru
// Body: { guruId, tahunAjaran, semester, tingkatData: [...] }
router.post('/guru', createOrUpdateCapaianPembelajaran);

// Add or update capaian pembelajaran for a specific tingkat and mata pelajaran
// Body: { guruId, tahunAjaran, semester, tingkat, mataPelajaranId, capaianPembelajaran }
router.post('/item', addOrUpdateCapaianPembelajaranItem);

// Delete capaian pembelajaran for a specific tingkat and mata pelajaran
// Body: { guruId, tahunAjaran, semester, tingkat, mataPelajaranId }
router.delete('/item', deleteCapaianPembelajaranItem);

// ===== LEGACY ENDPOINTS (for backward compatibility - returns flattened structure) =====

// Get all capaian pembelajaran (flattened structure for backward compatibility)
// Query params: ?guruId=xxx&tingkat=xxx&mataPelajaranId=xxx&tahunAjaran=xxx&semester=1
router.get('/', getAllCapaianPembelajaran);

// Get single capaian pembelajaran by ID (legacy - returns flattened structure)
// ID format: docId-tingkat-mataPelajaranId
router.get('/:id', getCapaianPembelajaranById);

// Update capaian pembelajaran (legacy - for backward compatibility)
// ID format: docId-tingkat-mataPelajaranId
router.put('/:id', updateCapaianPembelajaran);

// Delete capaian pembelajaran (legacy - for backward compatibility)
// ID format: docId-tingkat-mataPelajaranId
router.delete('/:id', deleteCapaianPembelajaran);

export default router;


