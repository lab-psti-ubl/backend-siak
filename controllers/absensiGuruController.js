import AbsensiGuru from '../models/AbsensiGuru.js';
import TahunAjaran from '../models/TahunAjaran.js';
import Guru from '../models/Guru.js';
import { getISOStringIndonesia } from '../utils/dateUtils.js';

// Helper function: Convert new structure to old format (for backward compatibility with frontend)
const convertToOldFormat = (absensiGuruDoc, guruId = null) => {
  const absensiGuruObj = absensiGuruDoc.toObject ? absensiGuruDoc.toObject() : absensiGuruDoc;
  const result = [];
  
  if (!absensiGuruObj.guru || !Array.isArray(absensiGuruObj.guru)) {
    return [];
  }
  
  for (const guruItem of absensiGuruObj.guru) {
    // Filter by guruId if provided
    if (guruId && guruItem.guruId !== guruId) {
      continue;
    }
    
    // Only include gurus who have at least some attendance data
    const hasAttendanceData = guruItem.jamMasuk || guruItem.jamKeluar || 
                              guruItem.statusMasuk || guruItem.statusKeluar ||
                              guruItem.keterangan || guruItem.keteranganAbsensi ||
                              (guruItem.fotoMengajar && guruItem.fotoMengajar.length > 0);
    
    // If guruId filter is provided, always include (for getAbsensiGuruById, update, delete operations)
    // Otherwise, only include if has attendance data
    if (!guruId && !hasAttendanceData) {
      continue;
    }
    
    // Convert to old format
    result.push({
      id: `${absensiGuruObj.tanggal}-${guruItem.guruId}`,
      guruId: guruItem.guruId,
      tanggal: absensiGuruObj.tanggal,
      jamMasuk: guruItem.jamMasuk,
      jamKeluar: guruItem.jamKeluar,
      statusMasuk: guruItem.statusMasuk,
      statusKeluar: guruItem.statusKeluar,
      keterangan: guruItem.keterangan,
      keteranganAbsensi: guruItem.keteranganAbsensi,
      fotoMengajar: guruItem.fotoMengajar || [],
      tahunAjaranId: absensiGuruObj.tahunAjaranId,
      semester: absensiGuruObj.semester,
      createdAt: absensiGuruObj.createdAt,
      updatedAt: absensiGuruObj.updatedAt,
    });
  }
  
  return result;
};

// Helper function: Get all gurus
const getAllGurus = async () => {
  const gurus = await Guru.find({
    isActive: { $ne: false }
  }).sort({ name: 1 });
  
  // Filter out any gurus without valid id
  return gurus
    .map(g => g && g.id)
    .filter(id => id); // Filter out undefined/null values
};

// Helper function: Get or create absensi guru document for a date/tahunAjaran/semester
const getOrCreateAbsensiGuruDoc = async (tanggal, tahunAjaranId, semester) => {
  const absensiGuruId = `${tanggal}-${tahunAjaranId}-${semester}`;
  
  let absensiGuruDoc = await AbsensiGuru.findOne({ id: absensiGuruId });
  
  if (absensiGuruDoc) return absensiGuruDoc;
  
  // Create with race-condition safety (avoid duplicate key on concurrent creates)
  try {
    absensiGuruDoc = new AbsensiGuru({
      id: absensiGuruId,
      tanggal,
      tahunAjaranId,
      semester,
      guru: [],
      createdAt: getISOStringIndonesia(),
      updatedAt: getISOStringIndonesia(),
    });
    await absensiGuruDoc.save();
  } catch (err) {
    if (err && err.code === 11000) {
      const existing = await AbsensiGuru.findOne({ id: absensiGuruId });
      if (existing) return existing;
    }
    throw err;
  }
  
  return absensiGuruDoc;
};

// Helper function: Update or create guru attendance
const updateOrCreateGuruAbsensi = async (absensiGuruDoc, guruId, attendanceData, allGuruIds) => {
  // Ensure guru array exists
  if (!absensiGuruDoc.guru) {
    absensiGuruDoc.guru = [];
  }
  
  // Filter out any invalid entries (with undefined/null guruId)
  absensiGuruDoc.guru = absensiGuruDoc.guru.filter(g => g && g.guruId);
  
  // Ensure all gurus are present in the guru array
  const existingGuruIds = absensiGuruDoc.guru
    .map(g => g && g.guruId)
    .filter(id => id); // Filter out undefined/null values
  
  for (const guruIdInList of allGuruIds) {
    if (guruIdInList && !existingGuruIds.includes(guruIdInList)) {
      // Add guru with default empty attendance
      absensiGuruDoc.guru.push({
        guruId: guruIdInList,
      });
    }
  }
  
  // Now update the specific guru's attendance
  const guruIndex = absensiGuruDoc.guru.findIndex(g => g && g.guruId === guruId);
  
  if (guruIndex === -1) {
    // This shouldn't happen if all gurus were added above, but handle it anyway
    absensiGuruDoc.guru.push({
      guruId,
      ...attendanceData
    });
  } else {
    // Update existing attendance, merge with existing data
    // Ensure guruId is preserved
    const existing = absensiGuruDoc.guru[guruIndex];
    absensiGuruDoc.guru[guruIndex] = {
      ...existing,
      ...attendanceData,
      guruId: existing.guruId || guruId // Ensure guruId is always present
    };
  }
  
  return absensiGuruDoc;
};

// Get all absensi guru (converted to old format for backward compatibility)
export const getAllAbsensiGuru = async (req, res) => {
  try {
    const absensiGuruList = await AbsensiGuru.find().sort({ tanggal: -1 });
    
    // Convert to old format
    let result = [];
    for (const absensiGuruDoc of absensiGuruList) {
      const converted = convertToOldFormat(absensiGuruDoc);
      result = result.concat(converted);
    }
    
    // Sort by tanggal and jamMasuk (if available)
    result.sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeA.localeCompare(timeB);
    });
    
    return res.json({
      success: true,
      absensiGuru: result,
    });
  } catch (error) {
    console.error('Error getting absensi guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi guru',
      error: error.message,
    });
  }
};

// Get absensi guru by ID (returns new structure, but can convert to old format if needed)
export const getAbsensiGuruById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is in old format (tanggal-guruId: YYYY-MM-DD-guruId)
    const idParts = id.split('-');
    if (idParts.length >= 4 && id.match(/^\d{4}-\d{2}-\d{2}-.+$/)) {
      // Old format: tanggal-guruId
      const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
      const guruId = idParts.slice(3).join('-');
      
      // Search for absensi guru documents by tanggal
      const absensiGuruDocs = await AbsensiGuru.find({ tanggal });
      
      // Try to find the specific guru attendance
      for (const absensiGuruDoc of absensiGuruDocs) {
        const converted = convertToOldFormat(absensiGuruDoc, guruId);
        const found = converted.find(a => a.id === id);
        if (found) {
          return res.json({
            success: true,
            absensiGuru: found,
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Absensi guru tidak ditemukan',
      });
    }
    
    // New format ID (tanggal-tahunAjaranId-semester)
    const absensiGuru = await AbsensiGuru.findOne({ id });
    
    if (!absensiGuru) {
      return res.status(404).json({
        success: false,
        message: 'Absensi guru tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      absensiGuru: absensiGuru.toObject(),
    });
  } catch (error) {
    console.error('Error getting absensi guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi guru',
      error: error.message,
    });
  }
};

// Get absensi guru by tanggal
export const getAbsensiGuruByTanggal = async (req, res) => {
  try {
    const { tanggal } = req.query;
    if (!tanggal) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tanggal diperlukan',
      });
    }
    
    const absensiGuruList = await AbsensiGuru.find({ tanggal }).sort({ tanggal: -1 });
    
    // Convert to old format
    let result = [];
    for (const absensiGuruDoc of absensiGuruList) {
      const converted = convertToOldFormat(absensiGuruDoc);
      result = result.concat(converted);
    }
    
    // Sort by jamMasuk (if available)
    result.sort((a, b) => {
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeA.localeCompare(timeB);
    });
    
    return res.json({
      success: true,
      absensiGuru: result,
    });
  } catch (error) {
    console.error('Error getting absensi guru by tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi guru',
      error: error.message,
    });
  }
};

// Get all dates that exist in absensi guru collection for a given month/year
export const getAbsensiGuruDates = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    if (!bulan || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Parameter bulan dan tahun diperlukan',
      });
    }
    
    const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
    const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-31`;
    
    // Get all documents for the month/year, only return the tanggal field
    const absensiGuruList = await AbsensiGuru.find({
      tanggal: { $gte: startDate, $lte: endDate }
    }).select('tanggal').sort({ tanggal: 1 });
    
    // Extract unique dates
    const dates = [...new Set(absensiGuruList.map(doc => doc.tanggal))];
    
    return res.json({
      success: true,
      dates: dates,
    });
  } catch (error) {
    console.error('Error getting absensi guru dates:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tanggal absensi guru',
      error: error.message,
    });
  }
};

// Get absensi guru by guruId
export const getAbsensiGuruByGuruId = async (req, res) => {
  try {
    const { guruId } = req.params;
    const { bulan, tahun } = req.query;
    
    const query = {};
    
    if (bulan && tahun) {
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    } else if (tahun) {
      const startDate = `${tahun}-01-01`;
      const endDate = `${tahun}-12-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    }
    
    const absensiGuruList = await AbsensiGuru.find(query).sort({ tanggal: -1 });
    
    // Convert to old format and filter by guruId
    let result = [];
    for (const absensiGuruDoc of absensiGuruList) {
      const converted = convertToOldFormat(absensiGuruDoc, guruId);
      result = result.concat(converted);
    }
    
    // Sort by tanggal and jamMasuk (if available)
    result.sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeA.localeCompare(timeB);
    });
    
    return res.json({
      success: true,
      absensiGuru: result,
    });
  } catch (error) {
    console.error('Error getting absensi guru by guruId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi guru',
      error: error.message,
    });
  }
};

// Get absensi guru by guruId and tanggal
export const getAbsensiGuruByGuruIdAndTanggal = async (req, res) => {
  try {
    const { guruId, tanggal } = req.query;
    if (!guruId || !tanggal) {
      return res.status(400).json({
        success: false,
        message: 'Parameter guruId dan tanggal diperlukan',
      });
    }
    
    const absensiGuruList = await AbsensiGuru.find({ tanggal }).sort({ tanggal: -1 });
    
    // Convert to old format and filter by guruId
    let result = [];
    for (const absensiGuruDoc of absensiGuruList) {
      const converted = convertToOldFormat(absensiGuruDoc, guruId);
      result = result.concat(converted);
    }
    
    // Should only be one result, but return as single object for backward compatibility
    const absensiGuru = result.length > 0 ? result[0] : null;
    
    return res.json({
      success: true,
      absensiGuru: absensiGuru,
    });
  } catch (error) {
    console.error('Error getting absensi guru by guruId and tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi guru',
      error: error.message,
    });
  }
};

// Create absensi guru
export const createAbsensiGuru = async (req, res) => {
  try {
    const {
      id,
      guruId,
      tanggal,
      jamMasuk,
      jamKeluar,
      statusMasuk,
      statusKeluar,
      keterangan,
      keteranganAbsensi,
      fotoMengajar,
      tahunAjaranId,
      semester,
    } = req.body;

    if (!guruId || !tanggal || !statusMasuk) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap: guruId, tanggal, dan statusMasuk wajib diisi',
      });
    }

    // Get active tahun ajaran if tahunAjaranId not provided
    let finalTahunAjaranId = tahunAjaranId;
    let finalSemester = semester;
    
    if (!finalTahunAjaranId || finalSemester === undefined) {
      const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
      if (!activeTahunAjaran) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada tahun ajaran aktif. Silakan set tahun ajaran aktif terlebih dahulu',
        });
      }
      finalTahunAjaranId = activeTahunAjaran.id;
      finalSemester = activeTahunAjaran.semester;
    }

    // Get or create absensi guru document for this date/tahunAjaran/semester
    const absensiGuruDoc = await getOrCreateAbsensiGuruDoc(tanggal, finalTahunAjaranId, finalSemester);
    
    // Get all gurus
    const allGuruIds = await getAllGurus();
    
    // Prepare attendance data
    const attendanceData = {
      jamMasuk,
      jamKeluar,
      statusMasuk,
      statusKeluar,
      keterangan,
      keteranganAbsensi,
      sumberData: 'server',
      sumberDataUpdatedAt: getISOStringIndonesia(),
      fotoMengajar: fotoMengajar || [],
    };
    
    // Remove undefined values
    Object.keys(attendanceData).forEach(key => {
      if (attendanceData[key] === undefined) {
        delete attendanceData[key];
      }
    });
    
    // Update or create guru attendance (this will also ensure all gurus are present)
    await updateOrCreateGuruAbsensi(absensiGuruDoc, guruId, attendanceData, allGuruIds);
    await absensiGuruDoc.save();
    
    // Reload the document to get the latest data
    const updatedAbsensiGuruDoc = await AbsensiGuru.findOne({ id: absensiGuruDoc.id });
    
    // Return in old format for backward compatibility
    const converted = convertToOldFormat(updatedAbsensiGuruDoc, guruId);
    const result = converted.find(a => a.guruId === guruId);
    
    if (!result) {
      // If not found in converted format, create the result manually
      const guruItem = updatedAbsensiGuruDoc.guru.find(g => g.guruId === guruId);
      
      if (guruItem) {
        return res.status(201).json({
          success: true,
          message: 'Absensi guru berhasil dibuat/diperbarui',
          absensiGuru: {
            id: `${tanggal}-${guruId}`,
            guruId: guruItem.guruId,
            tanggal: updatedAbsensiGuruDoc.tanggal,
            jamMasuk: guruItem.jamMasuk,
            jamKeluar: guruItem.jamKeluar,
            statusMasuk: guruItem.statusMasuk,
            statusKeluar: guruItem.statusKeluar,
            keterangan: guruItem.keterangan,
            keteranganAbsensi: guruItem.keteranganAbsensi,
            fotoMengajar: guruItem.fotoMengajar || [],
            tahunAjaranId: updatedAbsensiGuruDoc.tahunAjaranId,
            semester: updatedAbsensiGuruDoc.semester,
            createdAt: updatedAbsensiGuruDoc.createdAt,
            updatedAt: updatedAbsensiGuruDoc.updatedAt,
          },
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Absensi guru berhasil dibuat/diperbarui',
      absensiGuru: result,
    });
  } catch (error) {
    console.error('Error creating absensi guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat/memperbarui absensi guru',
      error: error.message,
    });
  }
};

// Update absensi guru (using old format ID: tanggal-guruId)
export const updateAbsensiGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Parse old format ID: tanggal-guruId (format: YYYY-MM-DD-guruId)
    const idParts = id.split('-');
    if (idParts.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'ID format tidak valid',
      });
    }
    
    const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
    const guruId = idParts.slice(3).join('-');
    
    // Find absensi guru document - we need to search by tanggal and find the right document
    const absensiGuruDocs = await AbsensiGuru.find({ tanggal });
    
    let foundAbsensiGuru = null;
    let foundGuruIndex = -1;
    
    for (const absensiGuruDoc of absensiGuruDocs) {
      const guruIndex = absensiGuruDoc.guru.findIndex(g => g && g.guruId === guruId);
      if (guruIndex !== -1) {
        foundAbsensiGuru = absensiGuruDoc;
        foundGuruIndex = guruIndex;
        break;
      }
    }
    
    if (!foundAbsensiGuru) {
      return res.status(404).json({
        success: false,
        message: 'Absensi guru tidak ditemukan',
      });
    }

    // Update attendance data (exclude id, createdAt, updatedAt from updateData)
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.tanggal;
    delete updateData.tahunAjaranId;
    delete updateData.semester;
    delete updateData.guruId;
    
    const guruAbsensi = foundAbsensiGuru.guru[foundGuruIndex];
    
    // Update fields
    if (updateData.jamMasuk !== undefined) guruAbsensi.jamMasuk = updateData.jamMasuk;
    if (updateData.jamKeluar !== undefined) guruAbsensi.jamKeluar = updateData.jamKeluar;
    if (updateData.statusMasuk !== undefined) guruAbsensi.statusMasuk = updateData.statusMasuk;
    if (updateData.statusKeluar !== undefined) guruAbsensi.statusKeluar = updateData.statusKeluar;
    if (updateData.keterangan !== undefined) guruAbsensi.keterangan = updateData.keterangan;
    if (updateData.keteranganAbsensi !== undefined) guruAbsensi.keteranganAbsensi = updateData.keteranganAbsensi;
    if (updateData.fotoMengajar !== undefined) guruAbsensi.fotoMengajar = updateData.fotoMengajar;

    await foundAbsensiGuru.save();
    
    // Return in old format
    const converted = convertToOldFormat(foundAbsensiGuru, guruId);
    const result = converted.find(a => a.id === id) || converted[0];

    return res.json({
      success: true,
      message: 'Absensi guru berhasil diperbarui',
      absensiGuru: result,
    });
  } catch (error) {
    console.error('Error updating absensi guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui absensi guru',
      error: error.message,
    });
  }
};

// Delete absensi guru (using old format ID: tanggal-guruId)
export const deleteAbsensiGuru = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse old format ID: tanggal-guruId (format: YYYY-MM-DD-guruId)
    const idParts = id.split('-');
    if (idParts.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'ID format tidak valid',
      });
    }
    
    const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
    const guruId = idParts.slice(3).join('-');
    
    // Find absensi guru document
    const absensiGuruDocs = await AbsensiGuru.find({ tanggal });
    
    let foundAbsensiGuru = null;
    let foundGuruIndex = -1;
    
    for (const absensiGuruDoc of absensiGuruDocs) {
      const guruIndex = absensiGuruDoc.guru.findIndex(g => g && g.guruId === guruId);
      if (guruIndex !== -1) {
        foundAbsensiGuru = absensiGuruDoc;
        foundGuruIndex = guruIndex;
        break;
      }
    }
    
    if (!foundAbsensiGuru) {
      return res.status(404).json({
        success: false,
        message: 'Absensi guru tidak ditemukan',
      });
    }

    // Remove the guru attendance from the array
    foundAbsensiGuru.guru.splice(foundGuruIndex, 1);
    
    // If absensi guru document has no more gurus, delete the document
    if (foundAbsensiGuru.guru.length === 0) {
      await AbsensiGuru.deleteOne({ id: foundAbsensiGuru.id });
    } else {
      await foundAbsensiGuru.save();
    }

    return res.json({
      success: true,
      message: 'Absensi guru berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting absensi guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus absensi guru',
      error: error.message,
    });
  }
};
