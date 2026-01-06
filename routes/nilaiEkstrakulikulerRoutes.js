import express from 'express';
import {
  getNilaiEkstrakulikuler,
  getAllNilaiEkstrakulikuler,
  getNilaiEkstrakulikulerByMuridId,
  createOrUpdateNilaiEkstrakulikuler,
  addOrUpdateNilaiEkstrakulikulerMurid,
  deleteNilaiEkstrakulikulerMurid,
} from '../controllers/nilaiEkstrakulikulerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===== NEW STRUCTURE ENDPOINTS (using kelas-based structure like Kokulikuler) =====

// Get nilai ekstrakulikuler by kelas, tahun ajaran, and semester
// Query params: ?kelasId=xxx&tahunAjaran=2024/2025&semester=1
router.get('/kelas', getNilaiEkstrakulikuler);

// Create or update nilai ekstrakulikuler for a class
// Body: { kelasId, waliKelasId, tahunAjaran, semester, muridData: [...] }
router.post('/kelas', createOrUpdateNilaiEkstrakulikuler);

// Add or update nilai ekstrakulikuler for a specific murid (must be before /murid/:muridId)
// Body: { kelasId, tahunAjaran, semester, muridId, ekstrakulikulerId, nilai }
router.post('/murid', addOrUpdateNilaiEkstrakulikulerMurid);

// Delete nilai ekstrakulikuler for a specific murid (must be before /murid/:muridId)
// Body: { kelasId, tahunAjaran, semester, muridId, ekstrakulikulerId }
router.delete('/murid', deleteNilaiEkstrakulikulerMurid);

// Get nilai ekstrakulikuler by muridId (for detail view) - must be after /murid POST/DELETE
// Params: :muridId
// Query params: ?semester=1&tahunAjaran=2024/2025
router.get('/murid/:muridId', getNilaiEkstrakulikulerByMuridId);

// ===== LEGACY ENDPOINT (for backward compatibility - returns flattened structure) =====
// Get all nilai ekstrakulikuler (flattened structure for backward compatibility)
// Query params: ?muridId=xxx&kelasId=xxx&semester=1&tahunAjaran=2024/2025&ekstrakulikulerId=xxx
router.get('/', getAllNilaiEkstrakulikuler);

export default router;

