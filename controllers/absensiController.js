import Absensi from '../models/Absensi.js';
import TahunAjaran from '../models/TahunAjaran.js';
import Murid from '../models/Murid.js';

// Helper function: Convert new structure to old format (for backward compatibility with frontend)
const convertToOldFormat = (absensiDoc, muridId = null, kelasId = null) => {
  const absensiObj = absensiDoc.toObject ? absensiDoc.toObject() : absensiDoc;
  const result = [];
  
  if (!absensiObj.kelas || !Array.isArray(absensiObj.kelas)) {
    return [];
  }
  
  for (const kelasItem of absensiObj.kelas) {
    // Filter by kelasId if provided
    if (kelasId && kelasItem.kelasId !== kelasId) {
      continue;
    }
    
    if (!kelasItem.murid || !Array.isArray(kelasItem.murid)) {
      continue;
    }
    
    for (const muridItem of kelasItem.murid) {
      // Filter by muridId if provided
      if (muridId && muridItem.muridId !== muridId) {
        continue;
      }
      
      // Only include students who have at least some attendance data
      // Check if student has any attendance fields set
      const hasAttendanceData = muridItem.jamMasuk || muridItem.jamKeluar || 
                                muridItem.statusMasuk || muridItem.statusKeluar ||
                                muridItem.status || muridItem.waktu || 
                                muridItem.method || muridItem.keterangan ||
                                muridItem.statusAbsen || muridItem.keteranganAbsensi;
      
      // If muridId filter is provided, always include (for getAbsensiById, update, delete operations)
      // Otherwise, only include if has attendance data
      if (!muridId && !hasAttendanceData) {
        continue;
      }
      
      // Convert to old format
      result.push({
        id: `${absensiObj.tanggal}-${kelasItem.kelasId}-${muridItem.muridId}`,
        sesiId: muridItem.sesiId,
        muridId: muridItem.muridId,
        tanggal: absensiObj.tanggal,
        kelasId: kelasItem.kelasId,
        jamMasuk: muridItem.jamMasuk,
        jamKeluar: muridItem.jamKeluar,
        statusMasuk: muridItem.statusMasuk,
        statusKeluar: muridItem.statusKeluar,
        tipeAbsen: muridItem.tipeAbsen,
        status: muridItem.status,
        waktu: muridItem.waktu,
        keterangan: muridItem.keterangan,
        method: muridItem.method,
        tahunAjaranId: absensiObj.tahunAjaranId,
        semester: absensiObj.semester,
        statusAbsen: muridItem.statusAbsen,
        keteranganAbsensi: muridItem.keteranganAbsensi,
        createdAt: absensiObj.createdAt,
        updatedAt: absensiObj.updatedAt,
      });
    }
  }
  
  return result;
};

// Helper function: Get all students in a class
const getAllStudentsInClass = async (kelasId) => {
  const students = await Murid.find({
    kelasId: kelasId,
    isActive: { $ne: false }
  }).sort({ name: 1 });
  
  // Filter out any students without valid id
  return students
    .map(s => s && s.id)
    .filter(id => id); // Filter out undefined/null values
};

// Helper function: Convert old format input to new structure format
const convertOldToNewFormat = (data) => {
  const { tipeAbsen, status, waktu } = data;
  const result = {};
  
  if (tipeAbsen === 'masuk') {
    result.jamMasuk = waktu;
    if (status === 'hadir' || status === 'terlambat') {
      result.statusMasuk = status === 'terlambat' ? 'terlambat' : 'tepat_waktu';
    } else if (status === 'izin') {
      result.statusMasuk = 'izin';
    } else if (status === 'sakit') {
      result.statusMasuk = 'sakit';
    } else if (status === 'alfa') {
      result.statusMasuk = 'alfa';
    } else {
      result.statusMasuk = 'tidak_masuk';
    }
  } else if (tipeAbsen === 'pulang') {
    result.jamKeluar = waktu;
    if (status === 'hadir' || status === 'pulang_cepat') {
      result.statusKeluar = status === 'pulang_cepat' ? 'pulang_awal' : 'tepat_waktu';
    } else if (status === 'izin') {
      result.statusKeluar = 'izin';
    } else if (status === 'sakit') {
      result.statusKeluar = 'sakit';
    } else if (status === 'alfa') {
      result.statusKeluar = 'alfa';
    } else {
      result.statusKeluar = 'tidak_keluar';
    }
  }
  
  // Keep legacy fields
  result.tipeAbsen = tipeAbsen;
  result.status = status;
  result.waktu = waktu;
  
  return result;
};

// Helper function: Get or create absensi document for a date/tahunAjaran/semester
const getOrCreateAbsensiDoc = async (tanggal, tahunAjaranId, semester) => {
  const absensiId = `${tanggal}-${tahunAjaranId}-${semester}`;
  
  let absensiDoc = await Absensi.findOne({ id: absensiId });
  
  if (!absensiDoc) {
    absensiDoc = new Absensi({
      id: absensiId,
      tanggal,
      tahunAjaranId,
      semester,
      kelas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await absensiDoc.save();
  }
  
  return absensiDoc;
};

// Helper function: Update or create murid attendance in a kelas
const updateOrCreateMuridAbsensi = async (absensiDoc, kelasId, muridId, attendanceData, allMuridIds) => {
  let kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasId);
  
  // If kelas doesn't exist, create it
  if (kelasIndex === -1) {
    absensiDoc.kelas.push({
      kelasId,
      murid: []
    });
    kelasIndex = absensiDoc.kelas.length - 1;
  }
  
  // Ensure murid array exists
  if (!absensiDoc.kelas[kelasIndex].murid) {
    absensiDoc.kelas[kelasIndex].murid = [];
  }
  
  // Filter out any invalid entries (with undefined/null muridId)
  absensiDoc.kelas[kelasIndex].murid = absensiDoc.kelas[kelasIndex].murid.filter(m => m && m.muridId);
  
  // Ensure all students in class are present in the murid array
  const existingMuridIds = absensiDoc.kelas[kelasIndex].murid
    .map(m => m && m.muridId)
    .filter(id => id); // Filter out undefined/null values
  
  for (const muridIdInClass of allMuridIds) {
    if (muridIdInClass && !existingMuridIds.includes(muridIdInClass)) {
      // Add student with default empty attendance
      absensiDoc.kelas[kelasIndex].murid.push({
        muridId: muridIdInClass,
      });
    }
  }
  
  // Now update the specific student's attendance
  const muridIndex = absensiDoc.kelas[kelasIndex].murid.findIndex(m => m && m.muridId === muridId);
  
  if (muridIndex === -1) {
    // This shouldn't happen if all students were added above, but handle it anyway
    absensiDoc.kelas[kelasIndex].murid.push({
      muridId,
      ...attendanceData
    });
  } else {
    // Update existing attendance, merge with existing data
    // Ensure muridId is preserved
    const existing = absensiDoc.kelas[kelasIndex].murid[muridIndex];
    absensiDoc.kelas[kelasIndex].murid[muridIndex] = {
      ...existing,
      ...attendanceData,
      muridId: existing.muridId || muridId // Ensure muridId is always present
    };
  }
  
  return absensiDoc;
};

// Get all absensi (converted to old format for backward compatibility)
export const getAllAbsensi = async (req, res) => {
  try {
    const { muridId, kelasId, tanggal, bulan, tahun, tahunAjaranId, semester } = req.query;
    
    const query = {};
    
    if (tanggal) query.tanggal = tanggal;
    if (tahunAjaranId) query.tahunAjaranId = tahunAjaranId;
    if (semester !== undefined) query.semester = parseInt(semester);
    
    // Filter by bulan and tahun if provided
    if (bulan && tahun) {
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    } else if (tahun) {
      const startDate = `${tahun}-01-01`;
      const endDate = `${tahun}-12-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    }
    
    const absensiList = await Absensi.find(query).sort({ tanggal: -1 });
    
    // Convert to old format and filter
    let result = [];
    for (const absensiDoc of absensiList) {
      const converted = convertToOldFormat(absensiDoc, muridId, kelasId);
      result = result.concat(converted);
    }
    
    // Sort by tanggal and jamMasuk (if available)
    result.sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeB.localeCompare(timeA);
    });
    
    return res.json({
      success: true,
      absensi: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Get all absensi error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data absensi',
      error: error.message,
    });
  }
};

// Get absensi by ID (returns new structure, but can convert to old format if needed)
export const getAbsensiById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is in old format (tanggal-kelasId-muridId: YYYY-MM-DD-kelasId-muridId)
    const idParts = id.split('-');
    if (idParts.length >= 5 && id.match(/^\d{4}-\d{2}-\d{2}-.+-.+$/)) {
      // Old format: tanggal-kelasId-muridId
      const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
      const kelasId = idParts[3];
      const muridId = idParts.slice(4).join('-');
      
      // Search for absensi documents by tanggal
      const absensiDocs = await Absensi.find({ tanggal });
      
      // Try to find the specific murid attendance
      for (const absensiDoc of absensiDocs) {
        const converted = convertToOldFormat(absensiDoc, muridId, kelasId);
        const found = converted.find(a => a.id === id);
        if (found) {
          return res.json({
            success: true,
            absensi: found,
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan',
      });
    }
    
    // New format ID (tanggal-tahunAjaranId-semester)
    const absensi = await Absensi.findOne({ id });
    
    if (!absensi) {
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      absensi: absensi.toObject(),
    });
  } catch (error) {
    console.error('Get absensi by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data absensi',
      error: error.message,
    });
  }
};

// Get absensi by muridId
export const getAbsensiByMuridId = async (req, res) => {
  try {
    const { muridId } = req.params;
    const { bulan, tahun, tanggal } = req.query;
    
    const query = {};
    
    if (tanggal) {
      query.tanggal = tanggal;
    } else if (bulan && tahun) {
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    } else if (tahun) {
      const startDate = `${tahun}-01-01`;
      const endDate = `${tahun}-12-31`;
      query.tanggal = { $gte: startDate, $lte: endDate };
    }
    
    const absensiList = await Absensi.find(query).sort({ tanggal: -1 });
    
    // Convert to old format and filter by muridId
    let result = [];
    for (const absensiDoc of absensiList) {
      const converted = convertToOldFormat(absensiDoc, muridId);
      result = result.concat(converted);
    }
    
    // Sort by tanggal and jamMasuk (if available)
    result.sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return b.tanggal.localeCompare(a.tanggal);
      }
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeB.localeCompare(timeA);
    });
    
    return res.json({
      success: true,
      absensi: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Get absensi by muridId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data absensi',
      error: error.message,
    });
  }
};

// Get absensi by muridId and tanggal
export const getAbsensiByMuridIdAndTanggal = async (req, res) => {
  try {
    const { muridId } = req.params;
    const { tanggal } = req.query;
    
    if (!tanggal) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal harus diisi',
      });
    }
    
    // Extract tahunAjaranId and semester from tanggal if possible
    // For now, we'll search all absensi documents for this date
    const absensiList = await Absensi.find({ tanggal }).sort({ tanggal: -1 });
    
    // Convert to old format and filter by muridId
    let result = [];
    for (const absensiDoc of absensiList) {
      const converted = convertToOldFormat(absensiDoc, muridId);
      result = result.concat(converted);
    }
    
    // Sort by jamMasuk (if available)
    result.sort((a, b) => {
      const timeA = a.jamMasuk || '';
      const timeB = b.jamMasuk || '';
      return timeB.localeCompare(timeA);
    });
    
    return res.json({
      success: true,
      absensi: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Get absensi by muridId and tanggal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data absensi',
      error: error.message,
    });
  }
};

// Create absensi
export const createAbsensi = async (req, res) => {
  try {
    const {
      id,
      sesiId,
      muridId,
      tanggal,
      kelasId,
      tipeAbsen, // 'masuk' or 'pulang' - for backward compatibility
      status,
      waktu,
      keterangan,
      method,
      tahunAjaranId,
      semester,
      statusAbsen,
      keteranganAbsensi,
      // New structure fields
      jamMasuk,
      jamKeluar,
      statusMasuk,
      statusKeluar,
    } = req.body;

    // Validation
    if (!muridId || !tanggal || !kelasId) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap. muridId, tanggal, dan kelasId wajib diisi',
      });
    }

    // Determine if using new or old structure
    const isNewStructure = jamMasuk !== undefined || jamKeluar !== undefined || statusMasuk !== undefined || statusKeluar !== undefined;
    const isOldStructure = tipeAbsen && status && waktu;

    if (!isNewStructure && !isOldStructure) {
      // If neither structure is provided, default to empty attendance (student will be added but no attendance data)
      // This allows for auto-populating all students in class
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

    // Get or create absensi document for this date/tahunAjaran/semester
    const absensiDoc = await getOrCreateAbsensiDoc(tanggal, finalTahunAjaranId, finalSemester);
    
    // Get all students in the class
    const allMuridIds = await getAllStudentsInClass(kelasId);
    
    // Prepare attendance data
    let attendanceData = {};
    
    if (isNewStructure) {
      if (jamMasuk !== undefined) attendanceData.jamMasuk = jamMasuk;
      if (jamKeluar !== undefined) attendanceData.jamKeluar = jamKeluar;
      if (statusMasuk !== undefined) attendanceData.statusMasuk = statusMasuk;
      if (statusKeluar !== undefined) attendanceData.statusKeluar = statusKeluar;
    } else if (isOldStructure) {
      const converted = convertOldToNewFormat({ tipeAbsen, status, waktu });
      attendanceData = { ...attendanceData, ...converted };
    }
    
    // Add other fields
    if (keterangan !== undefined) attendanceData.keterangan = keterangan;
    if (method) attendanceData.method = method;
    if (statusAbsen) attendanceData.statusAbsen = statusAbsen;
    if (keteranganAbsensi) attendanceData.keteranganAbsensi = keteranganAbsensi;
    if (sesiId) attendanceData.sesiId = sesiId;
    
    // Use atomic operation to avoid version conflicts
    const absensiId = absensiDoc.id;
    
    // Retry logic for version conflicts
    let retries = 3;
    let success = false;
    let updatedAbsensiDoc = null;
    
    while (retries > 0 && !success) {
      try {
        // Reload document to get latest version
        const freshDoc = await Absensi.findOne({ id: absensiId });
        if (!freshDoc) {
          throw new Error('Absensi document not found');
        }
        
        // Update or create murid attendance
        await updateOrCreateMuridAbsensi(freshDoc, kelasId, muridId, attendanceData, allMuridIds);
        
        // Save with version check
        await freshDoc.save();
        success = true;
        updatedAbsensiDoc = freshDoc;
      } catch (error) {
        if (error.name === 'VersionError' && retries > 1) {
          // Version conflict, retry
          retries--;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!success || !updatedAbsensiDoc) {
      throw new Error('Failed to save absensi after retries');
    }
    
    // Reload the document to get the latest data
    updatedAbsensiDoc = await Absensi.findOne({ id: absensiId });
    
    // Return in old format for backward compatibility
    const converted = convertToOldFormat(updatedAbsensiDoc, muridId, kelasId);
    const result = converted.find(a => a.muridId === muridId && a.kelasId === kelasId);
    
    if (!result) {
      // If not found in converted format, create the result manually
      const kelasItem = updatedAbsensiDoc.kelas.find(k => k.kelasId === kelasId);
      const muridItem = kelasItem?.murid.find(m => m.muridId === muridId);
      
      if (muridItem) {
        return res.status(201).json({
          success: true,
          message: 'Absensi berhasil dibuat/diperbarui',
          absensi: {
            id: `${tanggal}-${kelasId}-${muridId}`,
            sesiId: muridItem.sesiId,
            muridId: muridItem.muridId,
            tanggal: updatedAbsensiDoc.tanggal,
            kelasId: kelasId,
            jamMasuk: muridItem.jamMasuk,
            jamKeluar: muridItem.jamKeluar,
            statusMasuk: muridItem.statusMasuk,
            statusKeluar: muridItem.statusKeluar,
            tipeAbsen: muridItem.tipeAbsen,
            status: muridItem.status,
            waktu: muridItem.waktu,
            keterangan: muridItem.keterangan,
            method: muridItem.method,
            tahunAjaranId: updatedAbsensiDoc.tahunAjaranId,
            semester: updatedAbsensiDoc.semester,
            statusAbsen: muridItem.statusAbsen,
            keteranganAbsensi: muridItem.keteranganAbsensi,
            createdAt: updatedAbsensiDoc.createdAt,
            updatedAt: updatedAbsensiDoc.updatedAt,
          },
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Absensi berhasil dibuat/diperbarui',
      absensi: result,
    });
  } catch (error) {
    console.error('Create absensi error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat/memperbarui absensi',
      error: error.message,
    });
  }
};

// Update absensi (using old format ID: tanggal-kelasId-muridId)
export const updateAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      waktu,
      keterangan,
      statusAbsen,
      keteranganAbsensi,
      // New structure fields
      jamMasuk,
      jamKeluar,
      statusMasuk,
      statusKeluar,
    } = req.body;

    // Parse old format ID: tanggal-kelasId-muridId (format: YYYY-MM-DD-kelasId-muridId)
    const idParts = id.split('-');
    if (idParts.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'ID format tidak valid',
      });
    }
    
    // Reconstruct tanggal (first 3 parts: YYYY-MM-DD)
    const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
    const kelasId = idParts[3];
    const muridId = idParts.slice(4).join('-'); // Handle muridId that might contain dashes
    
    // Find absensi document - we need to search by tanggal and find the right document
    // Since we don't know tahunAjaranId and semester from the ID, we need to search
    const absensiDocs = await Absensi.find({ tanggal });
    
    let foundAbsensi = null;
    let foundKelasIndex = -1;
    let foundMuridIndex = -1;
    
    for (const absensiDoc of absensiDocs) {
      const kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasId);
      if (kelasIndex !== -1) {
        const muridIndex = absensiDoc.kelas[kelasIndex].murid.findIndex(m => m.muridId === muridId);
        if (muridIndex !== -1) {
          foundAbsensi = absensiDoc;
          foundKelasIndex = kelasIndex;
          foundMuridIndex = muridIndex;
          break;
        }
      }
    }
    
    if (!foundAbsensi) {
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan',
      });
    }

    // Retry logic for version conflicts
    let retries = 3;
    let success = false;
    let savedAbsensi = null;
    
    while (retries > 0 && !success) {
      try {
        // Reload document to get latest version
        const freshDoc = await Absensi.findOne({ id: foundAbsensi.id });
        if (!freshDoc) {
          throw new Error('Absensi document not found');
        }
        
        // Find the correct indices again
        const freshKelasIndex = freshDoc.kelas.findIndex(k => k.kelasId === kelasId);
        if (freshKelasIndex === -1) {
          throw new Error('Kelas not found');
        }
        
        const freshMuridIndex = freshDoc.kelas[freshKelasIndex].murid.findIndex(m => m.muridId === muridId);
        if (freshMuridIndex === -1) {
          throw new Error('Murid not found');
        }
        
        // Update attendance data
        const muridAbsensi = freshDoc.kelas[freshKelasIndex].murid[freshMuridIndex];
        
        if (jamMasuk !== undefined) muridAbsensi.jamMasuk = jamMasuk;
        if (jamKeluar !== undefined) muridAbsensi.jamKeluar = jamKeluar;
        if (statusMasuk !== undefined) muridAbsensi.statusMasuk = statusMasuk;
        if (statusKeluar !== undefined) muridAbsensi.statusKeluar = statusKeluar;
        
        // Legacy fields
        if (status) muridAbsensi.status = status;
        if (waktu) muridAbsensi.waktu = waktu;
        if (keterangan !== undefined) muridAbsensi.keterangan = keterangan;
        if (statusAbsen) muridAbsensi.statusAbsen = statusAbsen;
        if (keteranganAbsensi) muridAbsensi.keteranganAbsensi = keteranganAbsensi;

        await freshDoc.save();
        success = true;
        savedAbsensi = freshDoc;
      } catch (error) {
        if (error.name === 'VersionError' && retries > 1) {
          // Version conflict, retry
          retries--;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (!success || !savedAbsensi) {
      throw new Error('Failed to save absensi after retries');
    }
    
    // Return in old format
    const converted = convertToOldFormat(savedAbsensi, muridId, kelasId);
    const result = converted.find(a => a.id === id) || converted[0];

    return res.json({
      success: true,
      message: 'Absensi berhasil diperbarui',
      absensi: result,
    });
  } catch (error) {
    console.error('Update absensi error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui absensi',
      error: error.message,
    });
  }
};

// Delete absensi (using old format ID: tanggal-kelasId-muridId)
export const deleteAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse old format ID: tanggal-kelasId-muridId
    const idParts = id.split('-');
    if (idParts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'ID format tidak valid',
      });
    }
    
    const tanggal = `${idParts[0]}-${idParts[1]}-${idParts[2]}`;
    const kelasId = idParts[3];
    const muridId = idParts.slice(4).join('-');
    
    // Find absensi document
    const absensiDocs = await Absensi.find({ tanggal });
    
    let foundAbsensi = null;
    let foundKelasIndex = -1;
    let foundMuridIndex = -1;
    
    for (const absensiDoc of absensiDocs) {
      const kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasId);
      if (kelasIndex !== -1) {
        const muridIndex = absensiDoc.kelas[kelasIndex].murid.findIndex(m => m.muridId === muridId);
        if (muridIndex !== -1) {
          foundAbsensi = absensiDoc;
          foundKelasIndex = kelasIndex;
          foundMuridIndex = muridIndex;
          break;
        }
      }
    }
    
    if (!foundAbsensi) {
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan',
      });
    }

    // Remove the murid attendance from the array
    foundAbsensi.kelas[foundKelasIndex].murid.splice(foundMuridIndex, 1);
    
    // If kelas has no more murid, remove the kelas too
    if (foundAbsensi.kelas[foundKelasIndex].murid.length === 0) {
      foundAbsensi.kelas.splice(foundKelasIndex, 1);
    }
    
    // If absensi document has no more kelas, delete the document
    if (foundAbsensi.kelas.length === 0) {
      await Absensi.deleteOne({ id: foundAbsensi.id });
    } else {
      await foundAbsensi.save();
    }

    return res.json({
      success: true,
      message: 'Absensi berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete absensi error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus absensi',
      error: error.message,
    });
  }
};

// Bulk create/update absensi
export const bulkCreateAbsensi = async (req, res) => {
  try {
    const { absensiList } = req.body;

    if (!Array.isArray(absensiList) || absensiList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'absensiList harus berupa array yang tidak kosong',
      });
    }

    // Get active tahun ajaran if needed
    const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
    if (!activeTahunAjaran) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada tahun ajaran aktif. Silakan set tahun ajaran aktif terlebih dahulu',
      });
    }

    const results = [];
    const errors = [];

    // Group by tanggal-tahunAjaran-semester for efficiency
    const groupedData = {};
    
    for (const absensiData of absensiList) {
      try {
        const {
          id,
          sesiId,
          muridId,
          tanggal,
          kelasId,
          tipeAbsen,
          status,
          waktu,
          keterangan,
          method,
          tahunAjaranId,
          semester,
          statusAbsen,
          keteranganAbsensi,
          jamMasuk,
          jamKeluar,
          statusMasuk,
          statusKeluar,
        } = absensiData;

        if (!muridId || !tanggal || !kelasId) {
          errors.push({ absensiData, error: 'Data tidak lengkap: muridId, tanggal, kelasId wajib' });
          continue;
        }

        const finalTahunAjaranId = tahunAjaranId || activeTahunAjaran.id;
        const finalSemester = semester !== undefined ? semester : activeTahunAjaran.semester;
        
        const groupKey = `${tanggal}-${finalTahunAjaranId}-${finalSemester}`;
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = [];
        }
        groupedData[groupKey].push({
          muridId,
          kelasId,
          sesiId,
          tipeAbsen,
          status,
          waktu,
          keterangan,
          method,
          statusAbsen,
          keteranganAbsensi,
          jamMasuk,
          jamKeluar,
          statusMasuk,
          statusKeluar,
        });
      } catch (error) {
        errors.push({ absensiData, error: error.message });
      }
    }

    // Process each group
    for (const [groupKey, groupData] of Object.entries(groupedData)) {
      const [tanggal, tahunAjaranId, semester] = groupKey.split('-');
      
      // Get or create absensi document
      const absensiDoc = await getOrCreateAbsensiDoc(tanggal, tahunAjaranId, parseInt(semester));
      
      // Group by kelasId to get all students per class at once
      const kelasGroups = {};
      for (const item of groupData) {
        if (!kelasGroups[item.kelasId]) {
          kelasGroups[item.kelasId] = [];
        }
        kelasGroups[item.kelasId].push(item);
      }
      
      // Retry logic for version conflicts
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          // Reload document to get latest version
          const freshDoc = await Absensi.findOne({ id: absensiDoc.id });
          if (!freshDoc) {
            throw new Error('Absensi document not found');
          }
          
          // Process each kelas
          for (const [kelasId, kelasItems] of Object.entries(kelasGroups)) {
            // Get all students in class
            const allMuridIds = await getAllStudentsInClass(kelasId);
            
            // Process each student attendance
            for (const item of kelasItems) {
              const isNewStructure = item.jamMasuk !== undefined || item.jamKeluar !== undefined || item.statusMasuk !== undefined || item.statusKeluar !== undefined;
              const isOldStructure = item.tipeAbsen && item.status && item.waktu;
              
              let attendanceData = {};
              
              if (isNewStructure) {
                if (item.jamMasuk !== undefined) attendanceData.jamMasuk = item.jamMasuk;
                if (item.jamKeluar !== undefined) attendanceData.jamKeluar = item.jamKeluar;
                if (item.statusMasuk !== undefined) attendanceData.statusMasuk = item.statusMasuk;
                if (item.statusKeluar !== undefined) attendanceData.statusKeluar = item.statusKeluar;
              } else if (isOldStructure) {
                const converted = convertOldToNewFormat({
                  tipeAbsen: item.tipeAbsen,
                  status: item.status,
                  waktu: item.waktu
                });
                attendanceData = { ...attendanceData, ...converted };
              }
              
              if (item.keterangan !== undefined) attendanceData.keterangan = item.keterangan;
              if (item.method) attendanceData.method = item.method;
              if (item.statusAbsen) attendanceData.statusAbsen = item.statusAbsen;
              if (item.keteranganAbsensi) attendanceData.keteranganAbsensi = item.keteranganAbsensi;
              if (item.sesiId) attendanceData.sesiId = item.sesiId;
              
              await updateOrCreateMuridAbsensi(freshDoc, kelasId, item.muridId, attendanceData, allMuridIds);
            }
          }
          
          await freshDoc.save();
          success = true;
          absensiDoc = freshDoc;
        } catch (error) {
          if (error.name === 'VersionError' && retries > 1) {
            // Version conflict, retry
            retries--;
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 50));
            continue;
          } else {
            throw error;
          }
        }
      }
      
      if (!success) {
        throw new Error('Failed to save absensi after retries');
      }
    }
    
    // Convert results to old format
    for (const absensiData of absensiList) {
      try {
        const { muridId, tanggal, kelasId, tahunAjaranId, semester } = absensiData;
        const finalTahunAjaranId = tahunAjaranId || activeTahunAjaran.id;
        const finalSemester = semester !== undefined ? semester : activeTahunAjaran.semester;
        
        const absensiId = `${tanggal}-${finalTahunAjaranId}-${finalSemester}`;
        const absensiDoc = await Absensi.findOne({ id: absensiId });
        
        if (absensiDoc) {
          const converted = convertToOldFormat(absensiDoc, muridId, kelasId);
          const found = converted.find(a => a.muridId === muridId && a.kelasId === kelasId);
          if (found) {
            results.push(found);
          }
        }
      } catch (error) {
        // Skip if conversion fails
      }
    }

    return res.json({
      success: true,
      message: `Berhasil memproses ${results.length} dari ${absensiList.length} absensi`,
      absensi: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk create absensi error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses absensi',
      error: error.message,
    });
  }
};

// Helper function: Get or create kelas in absensi document
const getOrCreateKelasInAbsensi = (absensiDoc, kelasId) => {
  let kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasId);
  
  if (kelasIndex === -1) {
    absensiDoc.kelas.push({
      kelasId,
      murid: [],
      sessionMasuk: null,
      sessionPulang: null,
    });
    kelasIndex = absensiDoc.kelas.length - 1;
  }
  
  return absensiDoc.kelas[kelasIndex];
};

// Get session metadata from absensi
export const getSessionMetadata = async (req, res) => {
  try {
    const { tanggal, kelasId, tahunAjaranId, semester, sessionType } = req.query;
    
    if (!tanggal || !kelasId) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal dan kelasId wajib diisi',
      });
    }
    
    // Get active tahun ajaran if not provided
    let finalTahunAjaranId = tahunAjaranId;
    let finalSemester = semester;
    
    if (!finalTahunAjaranId || finalSemester === undefined) {
      const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
      if (!activeTahunAjaran) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada tahun ajaran aktif',
        });
      }
      finalTahunAjaranId = activeTahunAjaran.id;
      finalSemester = activeTahunAjaran.semester;
    }
    
    const absensiId = `${tanggal}-${finalTahunAjaranId}-${finalSemester}`;
    const absensiDoc = await Absensi.findOne({ id: absensiId });
    
    if (!absensiDoc) {
      return res.json({
        success: true,
        session: null,
      });
    }
    
    const kelasData = absensiDoc.kelas.find(k => k.kelasId === kelasId);
    
    if (!kelasData) {
      return res.json({
        success: true,
        session: null,
      });
    }
    
    const session = sessionType === 'masuk' ? kelasData.sessionMasuk : kelasData.sessionPulang;
    
    if (!session) {
      return res.json({
        success: true,
        session: null,
      });
    }
    
    // Convert to SesiAbsensi-like format for compatibility
    const jadwalId = `${kelasId}-${sessionType}`;
    const sessionResponse = {
      id: `sesi-${sessionType}-${tanggal}-${kelasId}`,
      jadwalId,
      tanggal,
      jamBuka: session.jamBuka,
      jamTutup: session.jamTutup,
      status: session.status,
      createdBy: session.createdBy,
      tahunAjaranId: finalTahunAjaranId,
      semester: finalSemester,
    };
    
    return res.json({
      success: true,
      session: sessionResponse,
    });
  } catch (error) {
    console.error('Get session metadata error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil metadata sesi',
      error: error.message,
    });
  }
};

// Update session metadata in absensi
export const updateSessionMetadata = async (req, res) => {
  try {
    const {
      tanggal,
      kelasId,
      sessionType, // 'masuk' or 'pulang'
      jamBuka,
      jamTutup,
      status, // 'dibuka' or 'ditutup'
      createdBy,
      tahunAjaranId,
      semester,
    } = req.body;
    
    if (!tanggal || !kelasId || !sessionType || !status || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap. tanggal, kelasId, sessionType, status, dan createdBy wajib diisi',
      });
    }
    
    if (sessionType !== 'masuk' && sessionType !== 'pulang') {
      return res.status(400).json({
        success: false,
        message: 'sessionType harus "masuk" atau "pulang"',
      });
    }
    
    // Get active tahun ajaran if not provided
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
    
    // Get or create absensi document
    const absensiDoc = await getOrCreateAbsensiDoc(tanggal, finalTahunAjaranId, finalSemester);
    
    // Get or create kelas in absensi
    const kelasData = getOrCreateKelasInAbsensi(absensiDoc, kelasId);
    
    // Update session metadata
    const sessionMetadata = {
      jamBuka: jamBuka || new Date().toLocaleTimeString('id-ID', { hour12: false }),
      jamTutup: jamTutup || null,
      status,
      createdBy,
    };
    
    if (sessionType === 'masuk') {
      kelasData.sessionMasuk = sessionMetadata;
    } else {
      kelasData.sessionPulang = sessionMetadata;
    }
    
    await absensiDoc.save();
    
    // Return in SesiAbsensi-like format for compatibility
    const jadwalId = `${kelasId}-${sessionType}`;
    const sessionResponse = {
      id: `sesi-${sessionType}-${tanggal}-${kelasId}`,
      jadwalId,
      tanggal,
      jamBuka: sessionMetadata.jamBuka,
      jamTutup: sessionMetadata.jamTutup,
      status: sessionMetadata.status,
      createdBy: sessionMetadata.createdBy,
      tahunAjaranId: finalTahunAjaranId,
      semester: finalSemester,
    };
    
    return res.json({
      success: true,
      message: `Sesi ${sessionType} berhasil diperbarui`,
      session: sessionResponse,
    });
  } catch (error) {
    console.error('Update session metadata error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui metadata sesi',
      error: error.message,
    });
  }
};
